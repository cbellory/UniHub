const express = require('express');
const router = express.Router();
const multer = require('multer'); // --- 1. Импортируем multer ---
const path = require('path');
const taskController = require('../controllers/taskController');
const userController = require('../controllers/userController');
const { authMiddleware, checkRole } = require('../middleware/authMiddleware');

// --- 2. Настраиваем multer, как в app.js ---
const createUpload = require('../middleware/uploadMiddleware');
const upload = createUpload('task'); // Tasks and general content


// --- Маршруты для задач (Tasks) ---

// Получение всех задач (без изменений)
router.get('/tasks', authMiddleware, checkRole(['superadmin', 'admin', 'moderator']), async (req, res) => {
  try {
    const tasks = await taskController.getAllTasksAdmin(req);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Ошибка при получении задач", error: error.message });
  }
});

// --- 3. ПОДКЛЮЧАЕМ MULTER К МАРШРУТАМ СОЗДАНИЯ И ОБНОВЛЕНИЯ ---

// Добавление задачи
router.post('/tasks', authMiddleware, checkRole(['superadmin', 'admin', 'moderator']), upload.single('image'), async (req, res) => {
  try {
    const newTask = await taskController.addTaskWithImage(req);
    res.status(201).json(newTask);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Ошибка при добавлении задачи" });
  }
});

// Обновление задачи
router.put('/tasks/:id', authMiddleware, checkRole(['superadmin', 'admin', 'moderator']), upload.single('image'), async (req, res) => {
  try {
    const updatedTask = await taskController.updateTask(req);
    if (updatedTask) {
      res.json({ message: "Задача обновлена", task: updatedTask });
    } else {
      res.status(404).json({ message: "Задача для обновления не найдена" });
    }
  } catch (error) {
    res.status(500).json({ message: "Ошибка при обновлении задачи", error: error.message });
  }
});

// Получение списка заявок на проверку
router.get('/submissions', authMiddleware, checkRole(['superadmin', 'admin', 'moderator']), async (req, res) => {
  try {
    const submissions = await taskController.getPendingSubmissions(req);
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: "Ошибка при получении заявок", error: error.message });
  }
});

// Проверка выполнения задачи (Admin Review)
router.post('/review-submission', authMiddleware, checkRole(['superadmin', 'admin', 'moderator']), async (req, res) => {
  try {
    const result = await taskController.reviewSubmission(req);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


// Удаление задачи (без изменений)
router.delete('/tasks/:id', authMiddleware, checkRole(['superadmin', 'admin', 'moderator']), async (req, res) => {
  try {
    const deletedTask = await taskController.deleteTask(req);
    if (deletedTask) {
      res.json({ message: "Задача удалена" });
    } else {
      res.status(404).json({ message: "Задача для удаления не найдена" });
    }
  } catch (error) {
    res.status(500).json({ message: "Ошибка при удалении задачи", error: error.message });
  }
});


// --- Маршруты для пользователей (Users) ---
// ... (остальная часть файла без изменений) ...

// Получение всех пользователей
router.get('/users', authMiddleware, checkRole(['superadmin', 'admin']), async (req, res) => {
  try {
    const users = await userController.getUsers(req);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении пользователей', error: error.message });
  }
});

// Получение полной детальной информации о студенте (для админки)
router.get('/user-details/:address', authMiddleware, checkRole(['superadmin', 'admin']), async (req, res) => {
  try {
    const details = await userController.getAdminUserDetails(req);
    if (!details) {
      return res.status(404).json({ message: "Студент не найден" });
    }
    res.json(details);
  } catch (error) {
    res.status(500).json({ message: "Ошибка при получении данных студента", error: error.message });
  }
});

// Создание нового пользователя
router.post('/users', authMiddleware, checkRole(['superadmin']), async (req, res) => {
  try {
    const newUser = await userController.createUser(req);
    res.status(201).json({ message: 'Пользователь успешно создан', user: newUser });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при создании пользователя', error: error.message });
  }
});

// Обновление пользователя по ID
router.put('/users/:id', authMiddleware, checkRole(['superadmin']), async (req, res) => {
  try {
    const updatedUser = await userController.updateUser(req);
    if (updatedUser) {
      res.json({ message: 'Пользователь успешно обновлен', user: updatedUser });
    } else {
      res.status(404).json({ message: 'Пользователь не найден' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при обновлении пользователя', error: error.message });
  }
});

// Удаление пользователя по ID
router.delete('/users/:id', authMiddleware, checkRole(['superadmin']), async (req, res) => {
  try {
    const deletedUser = await userController.deleteUser(req);
    if (deletedUser) {
      res.json({ message: 'Пользователь успешно удален' });
    } else {
      res.status(404).json({ message: 'Пользователь не найден' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при удалении пользователя', error: error.message });
  }
});

module.exports = router;