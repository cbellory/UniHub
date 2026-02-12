const BattlePassLevel = require('../models/BattlePassLevel');

exports.getAllLevels = async (req) => {
  try {
    return await BattlePassLevel.find();
  } catch (error) {
    console.error("Ошибка в getAllLevels (Admin):", error);
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
    console.error("Ошибка в addLevel (Admin):", error);
    throw error;
  }
};

exports.updateLevel = async (req) => {
  const { id } = req.params;
  const { pointsRequired, reward } = req.body;
  try {
    return await BattlePassLevel.findByIdAndUpdate(id, { pointsRequired, reward }, { new: true });
  } catch (error) {
    console.error("Ошибка в updateLevel (Admin):", error);
    throw error;
  }
};

exports.deleteLevel = async (req) => {
  const { id } = req.params;
  try {
    return await BattlePassLevel.findByIdAndDelete(id);
  } catch (error) {
    console.error("Ошибка в deleteLevel (Admin):", error);
    throw error;
  }
};