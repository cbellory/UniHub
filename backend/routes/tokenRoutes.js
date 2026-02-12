const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokenController');

/**
 * Роуты для работы с токенами UniversityCoin
 */

// Выдать токены студенту (ручная выдача)
router.post('/mint', tokenController.mintTokens);

// Получить баланс токенов студента
router.get('/balance/:address', tokenController.getBalance);

// Синхронизировать баланс из блокчейна в базу данных
router.post('/sync/:address', tokenController.syncBalance);

// Получить адреса контрактов
router.get('/contracts', tokenController.getContractAddresses);

module.exports = router;
