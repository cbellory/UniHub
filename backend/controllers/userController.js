const Wallet = require('../models/Wallet');
const User = require('../models/User');
const Diploma = require('../models/Diploma');
const TaskSubmission = require('../models/TaskSubmission');
const Task = require('../models/Task');
const mongoose = require('mongoose');

function formatProfileData(profile) {
  if (!profile) return null;
  return {
    username: profile.username || '',
    avatarUrl: profile.avatarUrl ? `/${profile.avatarUrl.replace(/^\/+/, '')}` : '',
    points: profile.points || 0,
    tokenBalance: profile.tokenBalance || 0,
    battlePassLevel: profile.battlePassLevel || 1,
    battlePassProgress: profile.battlePassProgress || 0,
    inventory: profile.inventory || [],
    equipped: profile.equipped || {},
    group: profile.group || '',
    badges: profile.badges || [] // ⬅ ADD THIS
  };
}
exports.formatProfileData = formatProfileData;

// *** Користувацькі функції ***

exports.getUserRating = async (req, res) => {
  try {
    const rating = await Wallet.find({}, 'username address points avatarUrl equipped')
      .sort({ points: -1 })
      .limit(10);
    return rating;
  } catch (error) {
    console.error("Ошибка в getUserRating:", error);
    throw error;
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const address = req.params.address;
    if (!address) {
      const err = new Error('Адреса не вказана');
      err.status = 400;
      throw err;
    }
    const profile = await Wallet.findOne({ address: new RegExp(`^${address}$`, 'i') });
    return formatProfileData(profile);
  } catch (error) {
    console.error("Помилка в getUserProfile:", error);
    throw error;
  }
};

exports.updateProfile = async (req, res) => {
  const { address, username } = req.body;
  const avatarUrl = req.file ? `/uploads/avatars/${req.file.filename}` : null;
  try {
    const wallet = await Wallet.findOne({ address: new RegExp(`^${address}$`, 'i') });
    if (!wallet) return null;
    wallet.username = username || wallet.username;
    if (avatarUrl) {
      wallet.avatarUrl = avatarUrl;
    }
    await wallet.save();
    return wallet;
  } catch (error) {
    console.error("Помилка при оновленні профілю:", error);
    throw error;
  }
};

// Додавання реферала
exports.addReferral = async (req, res) => {
  const { address, referralAddress } = req.body;
  if (!address || !referralAddress) {
    const err = new Error('Необхідні адреса користувача та адреса реферала');
    err.status = 400;
    throw err;
  }
  try {
    // Шукаємо гаманець того, хто запросив (без урахування регістру)
    const wallet = await Wallet.findOne({ address: new RegExp(`^${address}$`, 'i') });

    if (!wallet) {
      return { success: false, status: 404, message: 'Гаманець того, хто запросив, не знайдено' };
    }

    if (wallet.referrals && wallet.referrals.includes(referralAddress)) {
      return { success: false, status: 400, message: 'Реферал вже доданий' };
    }

    if (!wallet.referrals) {
      wallet.referrals = [];
    }
    wallet.referrals.push(referralAddress);
    await wallet.save();
    return { success: true, message: 'Реферал успішно доданий' };
  } catch (error) {
    console.error("Помилка при додаванні реферала:", error);
    throw error;
  }
};

// Отримання списку рефералів
exports.getUserReferrals = async (req, res) => {
  const { address } = req.params;
  if (!address) {
    const err = new Error('Адреса не вказана');
    err.status = 400;
    throw err;
  }
  try {
    const wallet = await Wallet.findOne({ address: new RegExp(`^${address}$`, 'i') }, 'referrals');
    if (!wallet) return null;
    return wallet.referrals || [];
  } catch (error) {
    console.error("Помилка при отриманні списку рефералів:", error);
    throw error;
  }
};

exports.getAdminUserDetails = async (req, res) => {
  const { address } = req.params;
  try {
    const wallet = await Wallet.findOne({ address: new RegExp(`^${address}$`, 'i') });
    if (!wallet) return null;

    // 1. Сертифікати
    const diplomas = await Diploma.find({ studentAddress: new RegExp(`^${address}$`, 'i') });

    // 2. Історія звітів (Manual Tasks)
    const submissions = await TaskSubmission.find({ walletAddress: new RegExp(`^${address}$`, 'i') })
      .populate('taskId', 'name points type')
      .sort({ submittedAt: -1 });

    // 3. Виконані завдання (з Map)
    // Преобразуем Map в массив ID выполненных задач
    const completedTaskIds = [];
    if (wallet.tasks) {
      wallet.tasks.forEach((completed, taskId) => {
        // Check if taskId is a valid ObjectId (because older data might have bad IDs)
        if (completed && mongoose.Types.ObjectId.isValid(taskId)) {
          completedTaskIds.push(taskId);
        }
      });
    }
    const completedTasks = await Task.find({ '_id': { $in: completedTaskIds } }, 'name points type');

    return {
      wallet,
      diplomas,
      submissions,
      completedTasks
    };
  } catch (error) {
    console.error("Помилка в getAdminUserDetails:", error);
    throw error;
  }
};

exports.getPublicUserDetails = async (req, res) => {
  const { address } = req.params;
  try {
    const wallet = await Wallet.findOne({ address: new RegExp(`^${address}$`, 'i') });
    if (!wallet) return null;

    // 1. Сертифікати
    const diplomas = await Diploma.find({ studentAddress: new RegExp(`^${address}$`, 'i') });

    // 2. Виконані завдання (з Map)
    const completedTaskIds = [];
    if (wallet.tasks) {
      wallet.tasks.forEach((completed, taskId) => {
        if (completed && mongoose.Types.ObjectId.isValid(taskId)) {
          completedTaskIds.push(taskId);
        }
      });
    }
    const completedTasks = await Task.find({ '_id': { $in: completedTaskIds } }, 'name points type');

    return {
      wallet,
      diplomas,
      submissions: [], // Return empty array to not break frontend before it's updated
      completedTasks
    };
  } catch (error) {
    console.error("Помилка в getPublicUserDetails:", error);
    throw error;
  }
};


// *** Адміністративні функції для управління користувачами ***
exports.getUsers = async (req, res) => {
  try {
    return await User.find({}, 'loginName role');
  } catch (error) {
    console.error('Помилка при отриманні користувачів:', error);
    throw error;
  }
};

exports.createUser = async (req, res) => {
  const { loginName, password, role } = req.body;
  try {
    const newUser = new User({ loginName, password, role });
    await newUser.save();
    return newUser;
  } catch (error) {
    console.error('Помилка при створенні користувача:', error);
    throw error;
  }
};

exports.updateUser = async (req, res) => {
  const { loginName, password, role } = req.body;
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) return null;
    user.loginName = loginName || user.loginName;
    user.role = role || user.role;
    if (password) {
      user.password = password;
    }
    await user.save();
    return user;
  } catch (error) {
    console.error('Помилка при оновленні користувача:', error);
    throw error;
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    return await User.findByIdAndDelete(id);
  } catch (error) {
    console.error('Помилка при видаленні користувача:', error);
    throw error;
  }
};