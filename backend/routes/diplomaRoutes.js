const express = require('express');
const router = express.Router();
const diplomaController = require('../controllers/diplomaController');
const createUpload = require('../middleware/uploadMiddleware');
const upload = createUpload('diploma');

/**
 * Роуты для работы с дипломами (SoulboundDiploma NFT)
 */

// Выдать диплом студенту (с поддержкой загрузки картинки)
router.post('/mint', upload.single('image'), diplomaController.mintDiploma);

// Получить метаданные диплома (для NFT)
router.get('/metadata/:id', diplomaController.getMetadata);

// Получить информацию о дипломе по tokenId
router.get('/:tokenId', diplomaController.getDiplomaInfo);

// Получить все дипломы студента
router.get('/student/:address', diplomaController.getStudentDiplomas);

// Получить все выданные дипломы (для админа)
router.get('/all/list', diplomaController.getAllDiplomas);

// Проверить подлинность диплома
router.get('/verify/:tokenId', diplomaController.verifyDiploma);

// Удалить диплом (из базы)
router.delete('/:id', diplomaController.deleteDiploma);

module.exports = router;
