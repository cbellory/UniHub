const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const connectDB = require('./db/db');
const walletController = require('./controllers/walletController');
const taskController = require('./controllers/taskController');
const userController = require('./controllers/userController');

// Импорт маршрутов
const adminRoutes = require('./routes/admin');
const walletRoutes = require('./routes/walletRoutes');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/userRoutes');
const battlePassRoutes = require('./routes/battlePassRoutes');
const battlePassAdminRoutes = require('./routes/battlePassAdminRoutes');
// --- 1. ИМПОРТИРУЕМ НОВЫЕ МАРШРУТЫ DAO ---
const daoRoutes = require('./routes/daoRoutes');
const tokenRoutes = require('./routes/tokenRoutes');
const diplomaRoutes = require('./routes/diplomaRoutes');
const certificateRoutes = require('./routes/certificateRoutes'); // New certificate system
const shopRoutes = require('./routes/shopRoutes'); // NEW SHOP ROUTES
const backupRoutes = require('./routes/backupRoutes'); // NEW BACKUP ROUTES
const monitorRoutes = require('./routes/monitorRoutes'); // NEW MONITOR ROUTES
const BackupScheduler = require('./services/backupScheduler');
const { authMiddleware, checkRole } = require('./middleware/authMiddleware');

const app = express();

// --- Настройка Middleware ---
connectDB(); // Подключение к БД
BackupScheduler.init(); // Запуск планировщика бэкапов

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Настройка Multer для загрузки файлов (New Middleware)
const createUpload = require('./middleware/uploadMiddleware');
const uploadAvatar = createUpload('avatar');
const submissionUpload = createUpload('submission');

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Настройка Маршрутов (Routes) ---

// Публичные маршруты
app.post("/api/register", async (req, res) => {
  try {
    const result = await walletController.registerWallet(req);
    const status = result.isNew ? 201 : 200;
    // Теперь мы отправляем на фронтенд сразу весь объект профиля
    res.status(status).json(result.profile);
  } catch (error) {
    res.status(500).json({ message: "Ошибка регистрации кошелька", error: error.message });
  }
});

app.get("/api/wallets/status/:address", walletController.checkWalletStatus);

// Get all wallets (for admin student picker)
app.get("/api/wallets/list", async (req, res) => {
  try {
    const wallets = await require('./models/Wallet').find({}, 'username address avatarUrl').sort({ username: 1 }).limit(200);
    res.json(wallets);
  } catch (error) {
    console.error("Error fetching wallets:", error);
    res.status(500).json({ message: "Error fetching wallets" });
  }
});

// ----- НОВЫЙ МАРШРУТ ДЛЯ РЕФЕРАЛОВ -----
app.get('/api/users/referrals/:address', async (req, res) => {
  try {
    const referrals = await userController.getUserReferrals(req);
    // userController вернет массив (даже пустой), или null в случае ошибки
    if (referrals !== null) {
      res.json({ referrals });
    } else {
      res.status(404).json({ message: 'Кошелек не найден' });
    }
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Ошибка сервера' });
  }
});

app.get('/api/users/profile/:address', async (req, res) => {
  try {
    const profileData = await userController.getUserProfile(req);
    if (profileData) {
      res.json(profileData);
    } else {
      res.status(404).json({ error: 'Профиль не найден' });
    }
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Ошибка сервера' });
  }
});

app.get('/api/users/rating', async (req, res) => {
  try {
    const rating = await userController.getUserRating(req);
    res.json(rating);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера при получении рейтинга' });
  }
});

// Получение детальной информации о пользователе (Public)
app.get('/api/users/details/:address', async (req, res) => {
  try {
    const data = await userController.getPublicUserDetails(req, res);
    if (data) {
      res.json(data);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/get-tasks/:address', async (req, res) => {
  try {
    const taskData = await taskController.getTasks(req);
    if (taskData) {
      res.json(taskData);
    } else {
      res.status(404).json({ error: 'Кошелек не найден' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении задач' });
  }
});

app.post("/api/complete-task", async (req, res) => {
  try {
    const result = await taskController.completeTask(req);
    if (result.success) {
      res.json(result);
    } else {
      res.status(result.status || 400).json({ message: result.message });
    }
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Ошибка сервера' });
  }
});

app.post('/api/users/update-profile', uploadAvatar.single('avatar'), async (req, res) => {
  try {
    const updatedWallet = await userController.updateProfile(req);
    if (updatedWallet) {
      res.json({ message: 'Профиль обновлен', wallet: updatedWallet });
    } else {
      res.status(404).json({ message: 'Кошелек не найден' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при обновлении профиля' });
  }
});

// --- 3. НОВЫЕ МАРШРУТЫ ДЛЯ MANUAL TASKS ---
app.post('/api/submit-task', submissionUpload.single('proofImage'), async (req, res) => {
  try {
    const result = await taskController.submitTaskReport(req);
    res.json({ success: true, message: 'Report submitted', submission: result });
  } catch (error) {
    res.status(400).json({ message: error.message || "Error submitting task" });
  }
});

app.get('/api/admin/submissions', authMiddleware, checkRole(['superadmin', 'admin']), async (req, res) => {
  try {
    const submissions = await taskController.getPendingSubmissions(req);
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching submissions" });
  }
});

app.post('/api/admin/review-submission', authMiddleware, checkRole(['superadmin', 'admin']), async (req, res) => {
  try {
    const result = await taskController.reviewSubmission(req);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message || "Error reviewing submission" });
  }
});

// Подключение роутеров
app.use('/api/custom-auth', authRoutes);
app.use('/api/battlepass', battlePassRoutes);
// --- 2. РЕГИСТРИРУЕМ НОВЫЕ МАРШРУТЫ DAO ---
app.use('/api/dao', daoRoutes);
// --- РЕГИСТРИРУЕМ МАРШРУТЫ ДЛЯ БЛОКЧЕЙНА ---
app.use('/api/tokens', tokenRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/diploma', diplomaRoutes); // Legacy compatibility
app.use('/api/certificates', certificateRoutes); // New certificate system
app.use('/api/shop', shopRoutes); // MOUNT SHOP ROUTES
app.use('/api/education', require('./routes/educationRoutes')); // New Education/SkillTree Routes
app.use('/api/badges', require('./routes/badgeRoutes')); // NEW BADGE ROUTES

// Защищенные маршруты (требуют авторизации)
app.use('/api/admin-api', authMiddleware, adminRoutes);
app.use('/api/admin-api/users', authMiddleware, checkRole(['superadmin', 'admin']), userRoutes);
app.use('/api/wallets', authMiddleware, checkRole(['superadmin', 'admin']), walletRoutes);
app.use('/api/admin-api/dashboard', authMiddleware, checkRole(['superadmin', 'admin']), require('./routes/dashboardRoutes'));
app.use('/api/admin/battlepass', authMiddleware, checkRole(['superadmin']), battlePassAdminRoutes);
app.use('/api/admin/backups', backupRoutes); // NEW BACKUPS API
app.use('/api/admin/monitor', monitorRoutes); // NEW MONITOR API


// --- Отдача статичных файлов фронтенда ---
app.use('/frontend', express.static(path.join(__dirname, '../frontend', 'build')));
app.get('/frontend/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'build', 'index.html'));
});

app.use('/admin', express.static(path.join(__dirname, '../admin', 'build')));
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin', 'build', 'index.html'));
});

// Редирект с корня сайта с сохранением параметров
app.get('/', (req, res) => {
  res.redirect('/frontend' + req.originalUrl);
});

app.use((req, res) => {
  res.status(404).send('Page not found');
});

module.exports = app;