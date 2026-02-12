const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

const router = express.Router();
const secretKey = process.env.JWT_SECRET;

if (!secretKey) {
  console.error("Ошибка: JWT_SECRET не загружен из .env. Проверьте файл .env");
}

// Маршрут для авторизации
router.post('/login', async (req, res) => {
  const { loginName, password } = req.body;
  console.log("Попытка авторизации с данными:", { loginName, password }); // Логируем все данные

  try {
    const user = await User.findOne({ loginName });
    if (!user) {
      console.warn(`Пользователь ${loginName} не найден`);
      return res.status(401).json({ message: 'Неверный логин или пароль' });
    }

    const isPasswordValid = user.password === password || await user.comparePassword(password);

    console.log("Результат проверки пароля:", isPasswordValid);

    if (isPasswordValid) {
      const token = jwt.sign(
        { loginName: user.loginName, role: user.role },
        secretKey,
        { expiresIn: '1h' }
      );
      console.log("Авторизация успешна. Токен:", token);
      return res.json({ token, role: user.role });
    } else {
      console.warn("Неверный пароль для пользователя:", loginName);
      return res.status(401).json({ message: 'Неверный логин или пароль' });
    }
  } catch (error) {
    console.error('Ошибка при авторизации:', error);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Импорт мидлваров для проверки роли и токена
const { authMiddleware, checkRole } = require('../middleware/authMiddleware');

// Маршрут для регистрации (без хеширования здесь)
router.post('/register', authMiddleware, checkRole(['superadmin']), async (req, res) => {
  const { loginName, password, role } = req.body;
  console.log("Попытка регистрации с данными:", { loginName, password, role }); // Логируем все данные

  if (!['superadmin', 'admin', 'moderator'].includes(role)) {
    console.warn("Попытка регистрации с недопустимой ролью:", role);
    return res.status(400).json({ message: 'Недопустимая роль' });
  }

  try {
    console.log(`Регистрация нового пользователя: ${loginName} с ролью ${role}`);
    const existingUser = await User.findOne({ loginName });
    if (existingUser) {
      console.warn(`Пользователь ${loginName} уже существует`);
      return res.status(409).json({ message: 'Пользователь уже существует' });
    }

    // Создание пользователя без хеширования пароля (модель выполнит это в pre('save'))
    const newUser = new User({ loginName, password, role });
    await newUser.save();

    console.log(`Пользователь ${loginName} успешно создан с ролью ${role}`);
    res.status(201).json({ message: 'Пользователь успешно создан' });
  } catch (error) {
    console.error('Ошибка при регистрации пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;
