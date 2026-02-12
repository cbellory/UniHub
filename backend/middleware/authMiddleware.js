const jwt = require('jsonwebtoken');
require('dotenv').config(); // Загрузка переменных окружения

const secretKey = process.env.JWT_SECRET; // Получаем секретный ключ из .env

// Проверка загрузки секретного ключа
if (!secretKey) {
  console.error("Ошибка: JWT_SECRET не загружен из .env. Проверьте файл .env");
}

// Миддлвара для проверки токена
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log('Заголовок Authorization:', authHeader); // Лог для отладки

  if (!authHeader) {
    console.warn('Авторизация не удалась. Заголовок Authorization отсутствует.');
    return res.status(403).json({ message: 'Требуется авторизация' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    console.warn('Авторизация не удалась. Токен не предоставлен.');
    return res.status(403).json({ message: 'Требуется авторизация' });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    // console.log('Токен валиден, авторизация успешна:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Ошибка при проверке токена:', err.message);
    return res.status(401).json({ message: 'Недействительный токен' });
  }
};

// Миддлвара для проверки роли пользователя
const checkRole = (allowedRoles) => (req, res, next) => {
  console.log('Роль пользователя:', req.user?.role); // Лог для отладки

  if (!req.user) {
    console.warn('Доступ запрещен. Пользователь не авторизован.');
    return res.status(403).json({ message: 'Требуется авторизация' });
  }

  if (!allowedRoles.includes(req.user.role)) {
    console.warn(`Доступ запрещен. Роль пользователя ${req.user.role} не соответствует требованиям.`);
    return res.status(403).json({ message: 'Доступ запрещен' });
  }

  next();
};

module.exports = { authMiddleware, checkRole };
