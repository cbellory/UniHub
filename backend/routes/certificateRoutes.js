const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Настройка хранилища для дипломов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads', 'certificates');
        // Создаем папку, если её нет
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'certificate-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

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
