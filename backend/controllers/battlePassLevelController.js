const BattlePassLevel = require('../models/BattlePassLevel');

exports.getAllLevels = async (req) => {
  try {
    return await BattlePassLevel.find().sort({ level: 1 });
  } catch (error) {
    console.error('Ошибка в getAllLevels (Level):', error);
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
    console.error('Ошибка в addLevel (Level):', error);
    throw error;
  }
};

exports.updateLevel = async (req) => {
  const { id } = req.params;
  const { pointsRequired, reward } = req.body;
  try {
    const level = await BattlePassLevel.findById(id);
    if (!level) return null;
    level.pointsRequired = pointsRequired;
    level.reward = reward;
    await level.save();
    return level;
  } catch (error) {
    console.error('Ошибка в updateLevel (Level):', error);
    throw error;
  }
};

exports.deleteLevel = async (req) => {
  const { id } = req.params;
  try {
    return await BattlePassLevel.findByIdAndDelete(id);
  } catch (error) {
    console.error('Ошибка в deleteLevel (Level):', error);
    throw error;
  }
};