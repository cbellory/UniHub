const express = require('express');
const router = express.Router();
const battlePassAdminController = require('../controllers/battlePassAdminController');

router.get('/levels', async (req, res) => {
  try {
    const levels = await battlePassAdminController.getAllLevels(req);
    res.json(levels);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

router.post('/levels', async (req, res) => {
  try {
    const newLevel = await battlePassAdminController.addLevel(req);
    res.status(201).json({ message: 'Новый уровень добавлен', newLevel });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

router.put('/levels/:id', async (req, res) => {
  try {
    const updatedLevel = await battlePassAdminController.updateLevel(req);
    if (updatedLevel) {
      res.json({ message: 'Уровень обновлен', updatedLevel });
    } else {
      res.status(404).json({ message: 'Уровень не найден' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

router.delete('/levels/:id', async (req, res) => {
  try {
    const deletedLevel = await battlePassAdminController.deleteLevel(req);
    if (deletedLevel) {
      res.json({ message: 'Уровень удален' });
    } else {
      res.status(404).json({ message: 'Уровень не найден' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

module.exports = router;