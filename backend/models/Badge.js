const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // e.g., 'first_login'
    name: {
        ua: { type: String, required: true },
        en: { type: String, required: true }
    },
    description: {
        ua: { type: String, required: true },
        en: { type: String, required: true }
    },
    iconUrl: { type: String, default: '' }, // URL or icon name
    condition: { type: String, default: '' }, // Internal note on how it's awarded
    xpReward: { type: Number, default: 0 }
});

const Badge = mongoose.model('Badge', badgeSchema);

module.exports = Badge;
