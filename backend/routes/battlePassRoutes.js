const express = require('express');
const router = express.Router();
const battlePassController = require('../controllers/battlePassController');
const { authMiddleware, checkRole } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

router.get('/progress/:address', async (req, res) => {
  try {
    const progress = await battlePassController.getBattlePassProgress(req);
    if (progress) {
      res.json(progress);
    } else {
      res.status(404).json({ message: 'Кошелек не найден' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

router.get('/levels', async (req, res) => {
  try {
    const levels = await battlePassController.getAllLevels(req);
    res.json(levels);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

router.post('/update', [ body('address').isString().notEmpty(), body('pointsEarned').isNumeric() ], async (req, res) => {
  try {
    const updatedProgress = await battlePassController.updateBattlePass(req);
    if (updatedProgress) {
      res.json(updatedProgress);
    } else {
      res.status(404).json({ message: 'Кошелек не найден' });
    }
  } catch (error) {
    res.status(error.status || 500).json({ message: 'Ошибка сервера', errors: error.errors });
  }
});

// Admin routes (example, might be in a separate file)
router.post('/levels/add', authMiddleware, checkRole(['superadmin']), async (req, res) => {
  try {
    const newLevel = await battlePassController.addLevel(req);
    res.status(201).json(newLevel);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

// ... и так далее для остальных админских маршрутов ...

module.exports = router;