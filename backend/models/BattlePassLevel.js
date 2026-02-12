const mongoose = require('mongoose');

const battlePassLevelSchema = new mongoose.Schema({
  level: { type: Number, required: true },
  pointsRequired: { type: Number, required: true },
  reward: { type: String, required: true }, // Награда за уровень (например, токены или предметы)
});

const BattlePassLevel = mongoose.model('BattlePassLevel', battlePassLevelSchema);

module.exports = BattlePassLevel;
