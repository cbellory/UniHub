const Badge = require('../models/Badge');
const Wallet = require('../models/Wallet');
const Course = require('../models/Course');
const Topic = require('../models/Topic');
const Task = require('../models/Task');

class BadgeService {
    /**
     * Check and award all applicable badges for a user
     * @param {String} address - User wallet address
     * @returns {Array} - Array of newly awarded badge IDs
     */
    static async checkAndAwardBadges(address) {
        const wallet = await Wallet.findOne({ address });
        if (!wallet) return [];

        const newBadges = [];

        // --- BASIC BADGES ---
        // First Step (already should have this from registration)
        if (!wallet.badges.some(b => b.badgeId === 'first_step')) {
            wallet.badges.push({ badgeId: 'first_step', date: new Date() });
            newBadges.push('first_step');
        }

        // Scholar: 3 tasks completed
        const completedCount = Array.from(wallet.tasks.values()).filter(Boolean).length;
        if (completedCount >= 3 && !wallet.badges.some(b => b.badgeId === 'scholar')) {
            wallet.badges.push({ badgeId: 'scholar', date: new Date() });
            newBadges.push('scholar');
        }

        // Big Spender: First shop purchase
        if (wallet.inventory && wallet.inventory.length > 0 && !wallet.badges.some(b => b.badgeId === 'big_spender')) {
            wallet.badges.push({ badgeId: 'big_spender', date: new Date() });
            newBadges.push('big_spender');
        }

        // Rich: 1000 tokens
        if (wallet.tokenBalance >= 1000 && !wallet.badges.some(b => b.badgeId === 'rich')) {
            wallet.badges.push({ badgeId: 'rich', date: new Date() });
            newBadges.push('rich');
        }

        // --- COURSE BADGES ---
        const COURSE_BADGES = {
            'course_blockchain_initiate': 'Основи Блокчейну',
            'course_smart_contracts': 'Смарт-контракти 101',
            'course_ai_finance': 'Машинне навчання',
            'course_amazon': 'Amazon'
        };

        for (const [badgeId, courseTitle] of Object.entries(COURSE_BADGES)) {
            if (wallet.badges.some(b => b.badgeId === badgeId)) continue;

            // Find course
            const course = await Course.findOne({ title: { $regex: courseTitle, $options: 'i' } });
            if (!course) continue;

            // Get all tasks for this course
            const topics = await Topic.find({ course: course._id });
            const topicIds = topics.map(t => t._id);
            const tasks = await Task.find({ topic: { $in: topicIds } });
            const taskIds = tasks.map(t => t._id.toString());

            if (taskIds.length === 0) continue;

            // Check if all tasks completed
            const allCompleted = taskIds.every(tid => wallet.tasks.get(tid) === true);
            if (allCompleted) {
                wallet.badges.push({ badgeId, date: new Date() });
                newBadges.push(badgeId);
            }
        }

        // Award XP for new badges
        for (const badgeId of newBadges) {
            const badge = await Badge.findOne({ id: badgeId });
            if (badge && badge.xpReward) {
                wallet.points += badge.xpReward;
            }
        }

        if (newBadges.length > 0) {
            await wallet.save();
            console.log(`🏆 Awarded ${newBadges.length} badges to ${address}:`, newBadges);
        }

        return newBadges;
    }
}

module.exports = BadgeService;
