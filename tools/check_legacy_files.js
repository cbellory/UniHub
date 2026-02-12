const mongoose = require('../backend/node_modules/mongoose');
const Wallet = require('../backend/models/Wallet');
const Task = require('../backend/models/Task');
const TaskSubmission = require('../backend/models/TaskSubmission');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const checkFiles = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const wallets = await Wallet.find({ avatarUrl: { $regex: /^\/uploads\// } });
        console.log('--- Avatar URLs Legacy Check ---');
        wallets.forEach(w => {
            if (!w.avatarUrl.includes('/uploads/users/') && !w.avatarUrl.includes('/uploads/content/')) {
                console.log(`User ${w.address}: ${w.avatarUrl}`);
            }
        });

        const tasks = await Task.find({ imageUrl: { $regex: /^\/uploads\// } });
        console.log('--- Task Images Legacy Check ---');
        tasks.forEach(t => {
            if (!t.imageUrl.includes('/uploads/users/') && !t.imageUrl.includes('/uploads/content/')) {
                console.log(`Task ${t.name}: ${t.imageUrl}`);
            }
        });

        const subs = await TaskSubmission.find({ proofImageUrl: { $regex: /^\/uploads\// } });
        console.log('--- Submission Legacy Check ---');
        subs.forEach(s => {
            if (!s.proofImageUrl.includes('/uploads/users/') && !s.proofImageUrl.includes('/uploads/content/')) {
                console.log(`Sub ${s._id}: ${s.proofImageUrl}`);
            }
        });

        console.log('--- Check Complete ---');
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkFiles();
