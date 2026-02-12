const BattlePassLevel = require('../models/BattlePassLevel');
const Wallet = require('../models/Wallet');
const walletController = require('./walletController');
const { validationResult } = require('express-validator');

// ===============================
// 1. Найти или создать кошелек
// ===============================
async function findOrRegisterWallet(address, ip) {
  try {
    let wallet = await Wallet.findOne({ address: new RegExp(`^${address}$`, 'i') });
    if (!wallet) {
      const result = await walletController.registerWallet({ body: { address, ip } });
      wallet = result.wallet;
    }
    return wallet;
  } catch (error) {
    console.error(`Ошибка в findOrRegisterWallet для ${address}:`, error);
    throw error;
  }
}

// ===============================
// 2. Расчет нового уровня, прогресса и награды
// ===============================
function calculateLevelProgress(wallet, allLevels) {
  let currentLevel = wallet.battlePassLevel || 1;
  let currentProgress = wallet.battlePassProgress || 0;
  let earnedTokens = 0;

  while (true) {
    const levelData = allLevels.find(l => l.level === currentLevel);
    if (!levelData) break;

    if (currentProgress >= levelData.pointsRequired) {
      currentProgress -= levelData.pointsRequired;
      earnedTokens += Number(levelData.reward || 0);
      currentLevel += 1;
    } else {
      break;
    }
  }

  return {
    newLevel: currentLevel,
    newProgress: currentProgress,
    totalTokensEarned: earnedTokens
  };
}

// ===============================
// 3. Получение прогресса Battle Pass
// ===============================
exports.getBattlePassProgress = async (req) => {
  const { address } = req.params;
  try {
    const ip = req.ip || '127.0.0.1';
    let wallet = await findOrRegisterWallet(address, ip);
    if (!wallet) return null;

    return {
      battlePassLevel: wallet.battlePassLevel,
      battlePassProgress: wallet.battlePassProgress,
      points: wallet.points,
      tokenBalance: wallet.tokenBalance
    };
  } catch (error) {
    console.error(`Ошибка в getBattlePassProgress для ${address}:`, error);
    throw error;
  }
};

// ===============================
// 4. Обновление прогресса Battle Pass
// ===============================
exports.updateBattlePass = async (req) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const err = new Error('Ошибка валидации');
    err.status = 400;
    err.errors = errors.array();
    throw err;
  }

  const { address, pointsEarned } = req.body;
  console.log("updateBattlePass CALLED", address, pointsEarned);
  try {
    const ip = req.ip || '127.0.0.1';
    let wallet = await findOrRegisterWallet(address, ip);
    if (!wallet) return null;

    // Добавляем очки прогресса
    wallet.battlePassProgress += Number(pointsEarned);

    // Загружаем уровни
    const allLevels = await BattlePassLevel.find().sort({ level: 1 });

    // Рассчитываем изменения
    const result = calculateLevelProgress(wallet, allLevels);

    // Применяем
    wallet.battlePassLevel = result.newLevel;
    wallet.battlePassProgress = result.newProgress;
    wallet.tokenBalance += result.totalTokensEarned;

    await wallet.save();

    return {
      battlePassLevel: wallet.battlePassLevel,
      battlePassProgress: wallet.battlePassProgress,
      points: wallet.points,
      tokenBalance: wallet.tokenBalance
    };
  } catch (error) {
    console.error(`Ошибка в updateBattlePass для ${address}:`, error);
    throw error;
  }
};

// ===============================
// CRUD уровней
// ===============================
exports.getAllLevels = async () => {
  try {
    return await BattlePassLevel.find();
  } catch (error) {
    console.error('Ошибка в getAllLevels (battlePassController):', error);
    throw error;
  }
};

exports.addLevel = async (req) => {
  const { level, pointsRequired, reward } = req.body;
  try {
    const newLevel = new BattlePassLevel({ level, pointsRequired, reward });
    await newLevel.save();
    return newLevel;
  } catch (error) {
    console.error('Ошибка в addLevel:', error);
    throw error;
  }
};

exports.updateLevel = async (req) => {
  const { id } = req.params;
  const { level, pointsRequired, reward } = req.body;
  try {
    return await BattlePassLevel.findByIdAndUpdate(id, {
      level,
      pointsRequired,
      reward
    }, { new: true });
  } catch (error) {
    console.error('Ошибка в updateLevel:', error);
    throw error;
  }
};

exports.deleteLevel = async (req) => {
  const { id } = req.params;
  try {
    return await BattlePassLevel.findByIdAndDelete(id);
  } catch (error) {
    console.error('Ошибка в deleteLevel:', error);
    throw error;
  }
};
