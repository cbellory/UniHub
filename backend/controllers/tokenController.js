const ContractService = require('../services/contractService');
const Wallet = require('../models/Wallet');

/**
 * Контроллер для работы с токенами UniversityCoin
 */

/**
 * Выдать токены студенту (ручная выдача)
 * POST /api/tokens/mint
 * Body: { studentAddress, amount, reason }
 */
exports.mintTokens = async (req, res) => {
    try {
        const { studentAddress, amount, reason } = req.body;

        // Валидация
        if (!studentAddress || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Student address and amount are required',
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be greater than 0',
            });
        }

        // Проверяем, существует ли студент в базе
        // Проверяем, существует ли студент в базе (регистронезависимый поиск)
        let wallet = await Wallet.findOne({ address: new RegExp(`^${studentAddress}$`, 'i') });

        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: 'Student wallet not found in database',
            });
        }

        // Выдаем токены через смарт-контракт
        const result = await ContractService.mintTokens(studentAddress, amount);

        // Обновляем баланс в базе данных
        wallet.tokenBalance += amount;
        await wallet.save();

        // Логируем операцию
        console.log(`Tokens minted: ${amount} UCN to ${studentAddress}. Reason: ${reason || 'N/A'}`);

        res.status(200).json({
            success: true,
            message: 'Tokens minted successfully',
            data: {
                ...result,
                reason: reason || 'Manual mint',
                newBalance: wallet.tokenBalance,
            },
        });
    } catch (error) {
        console.error('Error in mintTokens:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mint tokens',
            error: error.message,
        });
    }
};

/**
 * Получить баланс токенов студента
 * GET /api/tokens/balance/:address
 */
exports.getBalance = async (req, res) => {
    try {
        const { address } = req.params;

        if (!address) {
            return res.status(400).json({
                success: false,
                message: 'Address is required',
            });
        }

        // Получаем баланс из блокчейна
        const blockchainBalance = await ContractService.getTokenBalance(address);

        // Получаем данные из базы
        // Получаем данные из базы (регистронезависимый поиск)
        const wallet = await Wallet.findOne({ address: new RegExp(`^${address}$`, 'i') });

        res.status(200).json({
            success: true,
            data: {
                address: address,
                blockchainBalance: blockchainBalance.balance,
                databaseBalance: wallet ? wallet.tokenBalance : 0,
                synced: wallet ? Math.abs(blockchainBalance.balance - wallet.tokenBalance) < 0.0001 : false,
            },
        });
    } catch (error) {
        console.error('Error in getBalance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get balance',
            error: error.message,
        });
    }
};

/**
 * Синхронизировать баланс из блокчейна в базу данных
 * POST /api/tokens/sync/:address
 */
exports.syncBalance = async (req, res) => {
    try {
        const { address } = req.params;

        if (!address) {
            return res.status(400).json({
                success: false,
                message: 'Address is required',
            });
        }

        // Получаем баланс из блокчейна
        const blockchainBalance = await ContractService.getTokenBalance(address);

        // Обновляем в базе
        // Обновляем в базе (регистронезависимый поиск)
        const wallet = await Wallet.findOneAndUpdate(
            { address: new RegExp(`^${address}$`, 'i') },
            { tokenBalance: blockchainBalance.balance },
            { new: true, upsert: false }
        );

        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: 'Wallet not found in database',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Balance synced successfully',
            data: {
                address: address,
                newBalance: blockchainBalance.balance,
            },
        });
    } catch (error) {
        console.error('Error in syncBalance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to sync balance',
            error: error.message,
        });
    }
};

/**
 * Получить адреса контрактов
 * GET /api/tokens/contracts
 */
exports.getContractAddresses = async (req, res) => {
    try {
        const addresses = ContractService.getContractAddresses();

        res.status(200).json({
            success: true,
            data: addresses,
        });
    } catch (error) {
        console.error('Error in getContractAddresses:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get contract addresses',
            error: error.message,
        });
    }
};
