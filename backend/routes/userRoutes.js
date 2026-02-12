const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, checkRole } = require('../middleware/authMiddleware');
// `multer` здесь больше не нужен, он применяется в app.js

// *** Публичные и пользовательские маршруты ***

// Обновление профиля (загрузка аватара происходит в app.js)
router.post('/update-profile', async (req, res) => {
  try {
    const updatedWallet = await userController.updateProfile(req);
    if (updatedWallet) {
      res.json({ message: 'Профиль обновлен', wallet: updatedWallet });
    } else {
      res.status(404).json({ message: 'Кошелек не найден' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при обновлении профиля', error: error.message });
  }
});

// Получение рейтинга
router.get('/rating', async (req, res) => {
  try {
    const rating = await userController.getUserRating(req);
    res.json(rating);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении рейтинга', error: error.message });
  }
});

// Получение профиля
router.get('/profile/:address', async (req, res) => {
  try {
    const profile = await userController.getUserProfile(req);
    if (profile) {
      res.json(profile);
    } else {
      res.status(404).json({ message: 'Профиль не найден' });
    }
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Ошибка сервера' });
  }
});

// Получение рефералов
router.get('/referrals/:address', async (req, res) => {
  try {
    const referrals = await userController.getUserReferrals(req);
    if (referrals) {
      res.json({ referrals });
    } else {
      res.status(404).json({ message: 'Кошелек не найден' });
    }
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Ошибка сервера' });
  }
});

// Добавление реферала
router.post('/add-referral', async (req, res) => {
  try {
    const result = await userController.addReferral(req);
    if (result.success) {
      res.json(result);
    } else {
      res.status(result.status || 400).json({ message: result.message });
    }
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Ошибка сервера' });
  }
});


// *** Административные маршруты (дублируют логику из admin.js, но исправлены) ***

// Получение списка всех пользователей
router.get('/users', authMiddleware, checkRole(['superadmin']), async (req, res) => {
  try {
    const users = await userController.getUsers(req);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении списка пользователей', error: error.message });
  }
});

// Создание нового пользователя
router.post('/users', authMiddleware, checkRole(['superadmin']), async (req, res) => {
  try {
    const newUser = await userController.createUser(req);
    res.status(201).json({ message: 'Пользователь создан', user: newUser });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при создании пользователя', error: error.message });
  }
});

// Обновление пользователя
router.put('/users/:id', authMiddleware, checkRole(['superadmin']), async (req, res) => {
  try {
    const updatedUser = await userController.updateUser(req);
    if (updatedUser) {
      res.json({ message: 'Пользователь обновлен', user: updatedUser });
    } else {
      res.status(404).json({ message: 'Пользователь не найден' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при обновлении пользователя', error: error.message });
  }
});

// Удаление пользователя
router.delete('/users/:id', authMiddleware, checkRole(['superadmin']), async (req, res) => {
  try {
    const deletedUser = await userController.deleteUser(req);
    if (deletedUser) {
      res.json({ message: 'Пользователь удален' });
    } else {
      res.status(404).json({ message: 'Пользователь не найден' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при удалении пользователя', error: error.message });
  }
});

// Получение детальной информации о пользователе (Public)
router.get('/details/:address', async (req, res) => {
  try {
    const data = await userController.getAdminUserDetails(req, res);
    if (data) {
      res.json(data);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;