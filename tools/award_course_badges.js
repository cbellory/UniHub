const mongoose = require('../backend/node_modules/mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const Wallet = require('../backend/models/Wallet');
const Course = require('../backend/models/Course');
const Topic = require('../backend/models/Topic');
const Task = require('../backend/models/Task');
const Badge = require('../backend/models/Badge');

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27018/walletsDB';

// Map Badge ID -> Course Title (Substring match)
const BADGE_RULES = {
    'course_blockchain_initiate': 'Основи Блокчейну',
    'course_smart_contracts': 'Смарт-контракти 101',
    'course_ai_finance': 'Машинне навчання',
    'course_amazon': 'Amazon'
};

async function run() {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to DB');

    const wallets = await Wallet.find({});
    console.log(`Checking ${wallets.length} wallets...`);

    for (const badgeId of Object.keys(BADGE_RULES)) {
        const courseTitle = BADGE_RULES[badgeId];

        // Find Course
        const course = await Course.findOne({ title: { $regex: courseTitle, $options: 'i' } });
        if (!course) {
            console.log(`⚠️ Course not found: ${courseTitle}`);
            continue;
        }

        // Find all Tasks for this course
        // Course -> Topics -> Tasks
        const topics = await Topic.find({ course: course._id });
        console.log(`Debug: Found ${topics.length} topics for course ${course.title} (ID: ${course._id})`);
        const topicIds = topics.map(t => t._id);

        const tasks = await Task.find({ topic: { $in: topicIds } });
        console.log(`Debug: Found ${tasks.length} tasks for topics: ${topicIds.join(', ')}`);
        const taskIds = tasks.map(t => t._id.toString());

        console.log(`Checking badge [${badgeId}] for course "${course.title}" (${taskIds.length} tasks)`);

        if (taskIds.length === 0) continue;

        for (const wallet of wallets) {
            // Check if user has this badge
            const hasBadge = wallet.badges && wallet.badges.some(b => b.badgeId === badgeId);
            if (hasBadge) continue;

            // Check if user completed all tasks
            const userTasks = wallet.tasks || {}; // Map of taskID -> boolean

            // Check if every task in the course is completed by user
            const allCompleted = taskIds.every(tid => {
                // wallet.tasks is a Map in Mongoose, but might be POJO here depending on lean()
                // Schema says: tasks: { type: Map, of: Boolean }
                return wallet.tasks.get(tid) === true;
            });

            if (allCompleted) {
                console.log(`🏆 Awarding ${badgeId} to ${wallet.username || wallet.address}`);
                wallet.badges.push({ badgeId, date: new Date() });

                // Add XP?
                // const badge = await Badge.findOne({ id: badgeId });
                // if (badge) wallet.points += badge.xpReward;

                await wallet.save();
            }
        }
    }

    console.log('Done');
    await mongoose.disconnect();
}

run().catch(console.error);
