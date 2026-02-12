const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const createUpload = require('../middleware/uploadMiddleware');
const upload = createUpload('certificate');

/**
 * Роуты для работы с дипломами (SoulboundCertificate NFT)
 */

// Выдать диплом студенту (с поддержкой загрузки картинки)
router.post('/mint', upload.single('image'), certificateController.mintCertificate);

// Получить метаданные диплома (для NFT)
router.get('/metadata/:id', certificateController.getMetadata);

// Получить информацию о дипломе по tokenId
router.get('/:tokenId', certificateController.getCertificateInfo);

// Получить все дипломы студента
router.get('/student/:address', certificateController.getStudentCertificates);

// Получить все выданные дипломы (для админа)
router.get('/all/list', certificateController.getAllCertificates);

// Проверить подлинность диплома
router.get('/verify/:tokenId', certificateController.verifyCertificate);

// Удалить диплом (из базы)
router.delete('/:id', certificateController.deleteCertificate);

module.exports = router;
