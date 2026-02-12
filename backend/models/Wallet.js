const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true },
  ip: { type: String, required: true },
  tokenBalance: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  tasks: { type: Map, of: Boolean, default: {} },
  username: { type: String },
  avatarUrl: { type: String },
  battlePassLevel: { type: Number, default: 1 },
  battlePassProgress: { type: Number, default: 0 },
  referrals: { type: [String], default: [] },
  invitedBy: { type: String },
  group: { type: String, default: '' },
  date: { type: Date, default: Date.now },

  // --- SHOP & CUSTOMIZATION ---
  inventory: { type: [String], default: [] }, // Array of item IDs
  equipped: {
    avatarFrame: { type: String, default: '' },
    nickEffect: { type: String, default: '' },
    profileBg: { type: String, default: '' }
  },

  // --- ACHIEVEMENTS ---
  badges: [{
    badgeId: { type: String },
    date: { type: Date, default: Date.now }
  }]
});

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;