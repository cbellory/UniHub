const express = require('express');
const router = express.Router();
const battlePassLevelController = require('../controllers/battlePassLevelController');

router.get('/', async (req, res) => {
  try {
    const levels = await battlePassLevelController.getAllLevels(req);
    res.json(levels);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

router.post('/add', async (req, res) => {
  try {
    const newLevel = await battlePassLevelController.addLevel(req);
    res.status(201).json(newLevel);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

router.put('/update/:id', async (req, res) => {
  try {
    const updatedLevel = await battlePassLevelController.updateLevel(req);
    if (updatedLevel) {
      res.json(updatedLevel);
    } else {
      res.status(404).json({ message: 'Уровень не найден' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера', error: error.message });
  }
});

router.delete('/delete/:id', async (req, res) => {
  try {
    const deletedLevel = await battlePassLevelController.deleteLevel(req);
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