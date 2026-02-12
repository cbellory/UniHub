const ContractService = require('../services/contractService');
const Certificate = require('../models/Certificate');
const Wallet = require('../models/Wallet');

/**
 * Контроллер для работы с дипломами (SoulboundCertificate NFT)
 */

/**
 * Получить метаданные диплома (для NFT)
 * GET /api/certificate/metadata/:id
 */
exports.getMetadata = async (req, res) => {
    try {
        const { id } = req.params;
        const certificate = await Certificate.findById(id);

        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found' });
        }

        // Form standard ERC-721 Metadata JSON
        const metadata = {
            name: `Certificate: ${certificate.certificateData.courseName || 'Course Completion'}`,
            description: `Certificate issued to ${certificate.studentAddress} by ${certificate.certificateData.institution || 'Institution'}. Year: ${certificate.certificateData.completionYear}. ${certificate.certificateData.description || ''}`,
            image: certificate.certificateData.imageUrl || '', // Image URL
            attributes: [
                { trait_type: "Institution", value: certificate.certificateData.institution },
                { trait_type: "Course", value: certificate.certificateData.courseName },
                { trait_type: "Year", value: certificate.certificateData.completionYear },
                { trait_type: "Grade", value: certificate.certificateData.averageGrade },
                { trait_type: "Honors", value: certificate.certificateData.honors || "None" }
            ]
        };

        res.json(metadata);
    } catch (error) {
        console.error('Error getting metadata:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Выдать диплом студенту
 * POST /api/certificate/mint
 * Body: { studentAddress, metadataURI, certificateData }
 */
exports.mintCertificate = async (req, res) => {
    try {
        const { studentAddress } = req.body;
        let certificateData = req.body.certificateData;

        // Если certificateData пришел как строка (из FormData), парсим его
        if (typeof certificateData === 'string') {
            try {
                certificateData = JSON.parse(certificateData);
            } catch (e) {
                console.error('Error parsing certificateData:', e);
                certificateData = {};
            }
        } else if (!certificateData) {
            certificateData = {};
        }

        // Обработка загруженного файла
        // Базовый URL (используем ваш домен)
        const BASE_URL = 'https://cbellory.online';

        // Handle uploaded file
        if (req.file) {
            // Form real image link using domain
            const imageUrl = `${BASE_URL}/uploads/certificates/${req.file.filename}`;
            certificateData.imageUrl = imageUrl;
        }

        // Валидация
        if (!studentAddress) {
            return res.status(400).json({
                success: false,
                message: 'Student address is required',
            });
        }

        // Проверяем, существует ли студент в базе (регистронезависимый поиск)
        const wallet = await Wallet.findOne({ address: new RegExp(`^${studentAddress}$`, 'i') });

        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: 'Student wallet not found in database',
            });
        }

        // 1. Создаем объект диплома в БД заранее, чтобы получить ID
        const certificate = new Certificate({
            studentAddress: studentAddress.toLowerCase(),
            certificateData: certificateData,
            issuedBy: req.user?.address || 'admin',
            // Пока ставим заглушки, обновим после минта
            tokenId: -1,
            transactionHash: 'pending',
            blockNumber: 0,
            metadataURI: 'pending'
        });

        // 2. Генерируем РЕАЛЬНУЮ ссылку на метаданные
        // Используем ID созданного объекта и ваш домен
        const realMetadataURI = `${BASE_URL}/api/certificate/metadata/${certificate._id}`;
        certificate.metadataURI = realMetadataURI;

        // 3. Issue certificate via smart contract (blockchain still uses diploma method)
        const result = await ContractService.mintDiploma(studentAddress, realMetadataURI);

        // 4. Обновляем данные диплома
        certificate.tokenId = result.tokenId;
        certificate.transactionHash = result.transactionHash;
        certificate.blockNumber = result.blockNumber;

        await certificate.save();

        console.log(`Certificate minted: tokenId=${result.tokenId} to ${studentAddress}`);
        console.log(`Metadata URI: ${realMetadataURI}`);
        console.log(`Image URL: ${certificateData.imageUrl}`);

        res.status(200).json({
            success: true,
            message: 'Certificate minted successfully',
            data: {
                ...result,
                certificate: certificate,
            },
        });
    } catch (error) {
        console.error('Error in mintCertificate:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mint certificate',
            error: error.message,
        });
    }
};

/**
 * Получить информацию о дипломе по tokenId
 * GET /api/certificate/:tokenId
 */
exports.getCertificateInfo = async (req, res) => {
    try {
        const { tokenId } = req.params;

        if (!tokenId) {
            return res.status(400).json({
                success: false,
                message: 'Token ID is required',
            });
        }

        // Получаем данные из блокчейна
        const blockchainInfo = await ContractService.getCertificateInfo(tokenId);

        // Получаем данные из базы
        const certificateDB = await Certificate.findOne({ tokenId: parseInt(tokenId) });

        res.status(200).json({
            success: true,
            data: {
                blockchain: blockchainInfo,
                database: certificateDB,
            },
        });
    } catch (error) {
        console.error('Error in getCertificateInfo:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get certificate info',
            error: error.message,
        });
    }
};

/**
 * Получить все дипломы студента
 * GET /api/certificate/student/:address
 */
exports.getStudentCertificates = async (req, res) => {
    try {
        const { address } = req.params;

        if (!address) {
            return res.status(400).json({
                success: false,
                message: 'Address is required',
            });
        }

        // Получаем количество дипломов из блокчейна
        const blockchainBalance = await ContractService.getCertificateBalance(address);

        // Получаем все дипломы из базы данных
        const certificates = await Certificate.find({
            studentAddress: new RegExp(`^${address}$`, 'i')
        }).sort({ issuedAt: -1 });

        res.status(200).json({
            success: true,
            data: {
                address: address,
                totalCertificates: blockchainBalance.certificateCount,
                certificates: certificates,
            },
        });
    } catch (error) {
        console.error('Error in getStudentCertificates:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get student certificates',
            error: error.message,
        });
    }
};

/**
 * Получить все выданные дипломы (для админа)
 * GET /api/certificate/all
 */
exports.getAllCertificates = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const certificates = await Certificate.find()
            .sort({ issuedAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Certificate.countDocuments();

        res.status(200).json({
            success: true,
            data: {
                certificates: certificates,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                totalCertificates: count,
            },
        });
    } catch (error) {
        console.error('Error in getAllCertificates:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get all certificates',
            error: error.message,
        });
    }
};

/**
 * Проверить подлинность диплома
 * GET /api/certificate/verify/:tokenId
 */
exports.verifyCertificate = async (req, res) => {
    try {
        const { tokenId } = req.params;

        if (!tokenId) {
            return res.status(400).json({
                success: false,
                message: 'Token ID is required',
            });
        }

        // Получаем данные из блокчейна
        const blockchainInfo = await ContractService.getCertificateInfo(tokenId);

        // Получаем данные из базы
        const certificateDB = await Certificate.findOne({ tokenId: parseInt(tokenId) });

        // Проверяем соответствие
        const isValid = certificateDB &&
            certificateDB.studentAddress.toLowerCase() === blockchainInfo.owner.toLowerCase() &&
            certificateDB.metadataURI === blockchainInfo.metadataURI;

        res.status(200).json({
            success: true,
            data: {
                isValid: isValid,
                tokenId: tokenId,
                owner: blockchainInfo.owner,
                metadataURI: blockchainInfo.metadataURI,
                certificateData: certificateDB ? certificateDB.certificateData : null,
                issuedAt: certificateDB ? certificateDB.issuedAt : null,
            },
        });
    } catch (error) {
        console.error('Error in verifyCertificate:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify certificate',
            error: error.message,
        });
    }
};

/**
 * Удалить диплом из базы данных (скрыть)
 * DELETE /api/certificate/:id
 */
exports.deleteCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[Delete Certificate] Request to delete certificate with ID: ${id}`);

        const result = await Certificate.findByIdAndDelete(id);

        if (!result) {
            console.log(`[Delete Certificate] Certificate not found with ID: ${id}`);
            return res.status(404).json({ success: false, message: 'Certificate not found' });
        }

        console.log(`[Delete Certificate] Successfully deleted certificate: ${id}`);
        res.status(200).json({ success: true, message: 'Certificate deleted from database' });
    } catch (error) {
        console.error('Error deleting certificate:', error);
        res.status(500).json({ success: false, message: 'Failed to delete certificate' });
    }
};
