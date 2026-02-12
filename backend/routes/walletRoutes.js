const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');

// Маршрут для отримання всіх гаманців
router.get('/', async (req, res) => {
  try {
    const wallets = await walletController.getAllWallets(req);
    res.json(wallets);
  } catch (error) {
    res.status(500).json({ message: "Помилка при отриманні списку гаманців", error: error.message });
  }
});

// Маршрут для оновлення даних гаманця
router.put('/:address', async (req, res) => {
  try {
    const updatedWallet = await walletController.updateWallet(req);
    if (updatedWallet) {
      res.json(updatedWallet);
    } else {
      res.status(404).json({ message: "Гаманець для оновлення не знайдено" });
    }
  } catch (error) {
    res.status(500).json({ message: "Помилка при оновленні гаманця", error: error.message });
  }
});

// Маршрут для видалення гаманця
router.delete('/:address', async (req, res) => {
  try {
    const deletedWallet = await walletController.deleteWallet(req);
    if (deletedWallet) {
      res.json({ message: "Гаманець успішно видалено" });
    } else {
      res.status(404).json({ message: "Гаманець для видалення не знайдено" });
    }
  } catch (error) {
    res.status(500).json({ message: "Помилка при видаленні гаманця", error: error.message });
  }
});

module.exports = router;
