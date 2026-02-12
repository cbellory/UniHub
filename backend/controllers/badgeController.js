const Badge = require('../models/Badge');
const Wallet = require('../models/Wallet');

exports.getAllBadges = async (req, res) => {
    try {
        const badges = await Badge.find({});
        res.json(badges);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching badges', error: error.message });
    }
};

exports.getMyBadges = async (req, res) => {
    try {
        const { address } = req.params;
        const wallet = await Wallet.findOne({ address });

        if (!wallet) return res.status(404).json({ message: 'Wallet not found' });

        // Return only the badge IDs and dates
        res.json(wallet.badges || []);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user badges', error: error.message });
    }
};

// Internal helper to award a badge (can be used by other controllers)
exports.awardBadge = async (address, badgeId) => {
    const wallet = await Wallet.findOne({ address });
    if (!wallet) return false;

    // Check if already has badge
    const hasBadge = wallet.badges.some(b => b.badgeId === badgeId);
    if (hasBadge) return false;

    wallet.badges.push({ badgeId, date: new Date() });

    // Optional: Add XP reward
    const badge = await Badge.findOne({ id: badgeId });
    if (badge && badge.xpReward) {
        wallet.points += badge.xpReward;
    }

    await wallet.save();
    console.log(`🏆 Badge awarded: ${badgeId} to ${address}`);
    return true;
};
