const ContractService = require('../services/contractService');
const Diploma = require('../models/Diploma');
const Certificate = require('../models/Certificate');
const Wallet = require('../models/Wallet');

/**
 * Контроллер для работы с дипломами (SoulboundDiploma NFT)
 */

/**
 * Отримати метадані сертифіката (для NFT)
 * GET /api/diploma/metadata/:id
 */
exports.getMetadata = async (req, res) => {
    try {
        const { id } = req.params;
        const diploma = await Diploma.findById(id);

        if (!diploma) {
            return res.status(404).json({ message: 'Diploma not found' });
        }

        // Формируем стандартный ERC-721 Metadata JSON
        const metadata = {
            name: `Diploma: ${diploma.diplomaData.specialty || 'University Course'}`,
            description: `Diploma issued to ${diploma.studentAddress} by ${diploma.diplomaData.university || 'University'}. Year: ${diploma.diplomaData.graduationYear}. Grade: ${diploma.diplomaData.averageGrade}.`,
            image: diploma.diplomaData.imageUrl || '', // Посилання на картинку
            attributes: [
                { trait_type: "University", value: diploma.diplomaData.university },
                { trait_type: "Specialty", value: diploma.diplomaData.specialty },
                { trait_type: "Year", value: diploma.diplomaData.graduationYear },
                { trait_type: "Average Grade", value: diploma.diplomaData.averageGrade },
                { trait_type: "Honors", value: diploma.diplomaData.honors || "None" }
            ]
        };

        res.json(metadata);
    } catch (error) {
        console.error('Error getting metadata:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Видати сертифікат студенту
 * POST /api/diploma/mint
 * Body: { studentAddress, metadataURI, diplomaData }
 */
exports.mintDiploma = async (req, res) => {
    try {
        const { studentAddress } = req.body;
        let diplomaData = req.body.diplomaData;

        // Якщо diplomaData прийшов як рядок (з FormData), парсимо його
        if (typeof diplomaData === 'string') {
            try {
                diplomaData = JSON.parse(diplomaData);
            } catch (e) {
                console.error('Error parsing diplomaData:', e);
                diplomaData = {};
            }
        } else if (!diplomaData) {
            diplomaData = {};
        }

        // Обробка завантаженого файлу
        // Базовий URL (використовуємо ваш домен)
        const BASE_URL = 'https://cbellory.online';

        // Обробка завантаженого файлу
        if (req.file) {
            // Формуємо реальне посилання на картинку з використанням домену
            const imageUrl = `${BASE_URL}/uploads/diplomas/${req.file.filename}`;
            diplomaData.imageUrl = imageUrl;
        }

        // Валідація
        if (!studentAddress) {
            return res.status(400).json({
                success: false,
                message: 'Student address is required',
            });
        }

        // Перевіряємо, чи існує студент в базі (регістронезалежний пошук)
        const wallet = await Wallet.findOne({ address: new RegExp(`^${studentAddress}$`, 'i') });

        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: 'Student wallet not found in database',
            });
        }

        // 1. Створюємо об'єкт сертифіката в БД заздалегідь, щоб отримати ID
        const diploma = new Diploma({
            studentAddress: studentAddress.toLowerCase(),
            diplomaData: diplomaData,
            issuedBy: req.user?.address || 'admin',
            // Поки ставимо заглушки, оновимо після мінту
            tokenId: -1,
            transactionHash: 'pending',
            blockNumber: 0,
            metadataURI: 'pending'
        });

        // 2. Генеруємо РЕАЛЬНЕ посилання на метадані
        // Використовуємо ID створеного об'єкта і ваш домен
        const realMetadataURI = `${BASE_URL}/api/diploma/metadata/${diploma._id}`;
        diploma.metadataURI = realMetadataURI;

        // 3. Видаємо сертифікат через смарт-контракт з реальним посиланням
        const result = await ContractService.mintDiploma(studentAddress, realMetadataURI);

        // 4. Оновлюємо дані сертифіката
        diploma.tokenId = result.tokenId;
        diploma.transactionHash = result.transactionHash;
        diploma.blockNumber = result.blockNumber;

        await diploma.save();

        console.log(`Diploma minted: tokenId=${result.tokenId} to ${studentAddress}`);
        console.log(`Metadata URI: ${realMetadataURI}`);
        console.log(`Image URL: ${diplomaData.imageUrl}`);

        res.status(200).json({
            success: true,
            message: 'Diploma minted successfully',
            data: {
                ...result,
                diploma: diploma,
            },
        });
    } catch (error) {
        console.error('Error in mintDiploma:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mint diploma',
            error: error.message,
        });
    }
};

/**
 * Отримати інформацію про сертифікат за tokenId
 * GET /api/diploma/:tokenId
 */
exports.getDiplomaInfo = async (req, res) => {
    try {
        const { tokenId } = req.params;

        if (!tokenId) {
            return res.status(400).json({
                success: false,
                message: 'Token ID is required',
            });
        }

        // Отримуємо дані з блокчейну
        const blockchainInfo = await ContractService.getDiplomaInfo(tokenId);

        // Отримуємо дані з бази
        const diplomaDB = await Diploma.findOne({ tokenId: parseInt(tokenId) });

        res.status(200).json({
            success: true,
            data: {
                blockchain: blockchainInfo,
                database: diplomaDB,
            },
        });
    } catch (error) {
        console.error('Error in getDiplomaInfo:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get diploma info',
            error: error.message,
        });
    }
};

/**
 * Отримати всі сертифікати студента
 * GET /api/diploma/student/:address
 */
exports.getStudentDiplomas = async (req, res) => {
    try {
        const { address } = req.params;

        if (!address) {
            return res.status(400).json({
                success: false,
                message: 'Address is required',
            });
        }

        // Отримуємо кількість сертифікатів з блокчейну
        const blockchainBalance = await ContractService.getDiplomaBalance(address);

        // Отримуємо всі дипломи з бази даних
        const diplomas = await Diploma.find({
            studentAddress: new RegExp(`^${address}$`, 'i')
        }).sort({ issuedAt: -1 });

        // Отримуємо всі сертифікати з бази даних
        const certificates = await Certificate.find({
            studentAddress: new RegExp(`^${address}$`, 'i')
        }).sort({ issuedAt: -1 });

        // Об'єднуємо та нормалізуємо дані
        const allItems = [
            ...diplomas,
            ...certificates.map(cert => ({
                ...cert.toObject(),
                diplomaData: {
                    ...cert.certificateData,
                    specialty: cert.certificateData.courseName,
                    university: cert.certificateData.institution,
                    graduationYear: cert.certificateData.completionYear
                },
                type: 'Certificate'
            }))
        ].sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));

        res.status(200).json({
            success: true,
            data: {
                address: address,
                totalDiplomas: blockchainBalance.diplomaCount + blockchainBalance.certificateCount, // Approximation
                diplomas: allItems,
            },
        });
    } catch (error) {
        console.error('Error in getStudentDiplomas:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get student diplomas',
            error: error.message,
        });
    }
};

/**
 * Отримати всі видані сертифікати (для адміна)
 * GET /api/diploma/all
 */
exports.getAllDiplomas = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const diplomas = await Diploma.find()
            .sort({ issuedAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Diploma.countDocuments();

        res.status(200).json({
            success: true,
            data: {
                diplomas: diplomas,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                totalDiplomas: count,
            },
        });
    } catch (error) {
        console.error('Error in getAllDiplomas:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get all diplomas',
            error: error.message,
        });
    }
};

/**
 * Перевірити справжність сертифіката
 * GET /api/diploma/verify/:tokenId
 */
exports.verifyDiploma = async (req, res) => {
    try {
        const { tokenId } = req.params;

        if (!tokenId) {
            return res.status(400).json({
                success: false,
                message: 'Token ID is required',
            });
        }

        // Отримуємо дані з блокчейну
        const blockchainInfo = await ContractService.getDiplomaInfo(tokenId);

        // Отримуємо дані з бази
        const diplomaDB = await Diploma.findOne({ tokenId: parseInt(tokenId) });

        // Перевіряємо відповідність
        const isValid = diplomaDB &&
            diplomaDB.studentAddress.toLowerCase() === blockchainInfo.owner.toLowerCase() &&
            diplomaDB.metadataURI === blockchainInfo.metadataURI;

        res.status(200).json({
            success: true,
            data: {
                isValid: isValid,
                tokenId: tokenId,
                owner: blockchainInfo.owner,
                metadataURI: blockchainInfo.metadataURI,
                diplomaData: diplomaDB ? diplomaDB.diplomaData : null,
                issuedAt: diplomaDB ? diplomaDB.issuedAt : null,
            },
        });
    } catch (error) {
        console.error('Error in verifyDiploma:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify diploma',
            error: error.message,
        });
    }
};

/**
 * Видалити сертифікат з бази даних (приховати)
 * DELETE /api/diploma/:id
 */
exports.deleteDiploma = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[Delete Diploma] Request to delete diploma with ID: ${id}`);

        const result = await Diploma.findByIdAndDelete(id);

        if (!result) {
            console.log(`[Delete Diploma] Diploma not found with ID: ${id}`);
            return res.status(404).json({ success: false, message: 'Diploma not found' });
        }

        console.log(`[Delete Diploma] Successfully deleted diploma: ${id}`);
        res.status(200).json({ success: true, message: 'Diploma deleted from database' });
    } catch (error) {
        console.error('Error deleting diploma:', error);
        res.status(500).json({ success: false, message: 'Failed to delete diploma' });
    }
};
