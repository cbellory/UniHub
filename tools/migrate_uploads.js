const mongoose = require('../backend/node_modules/mongoose');
const fs = require('fs');
const path = require('path');
const Wallet = require('../backend/models/Wallet');
const TaskSubmission = require('../backend/models/TaskSubmission');
const Task = require('../backend/models/Task');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const UPLOADS_ROOT = path.join(__dirname, '../backend/uploads');
const AVATARS_ROOT = path.join(UPLOADS_ROOT, 'avatars'); // Old location
const SUBMISSIONS_ROOT = path.join(UPLOADS_ROOT, 'submissions'); // Old location

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => console.log('Mongoose connected'));
        mongoose.connection.on('error', (err) => console.error('Mongoose connection error:', err));

        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('MongoDB Connected via Mongoose');
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    }
};

const moveFile = (oldPath, newDir, filename) => {
    if (!fs.existsSync(oldPath)) return null;
    if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true });

    const newPath = path.join(newDir, filename);
    fs.renameSync(oldPath, newPath);
    return newPath;
};

const migrate = async () => {
    await connectDB();

    console.log('--- STARTING MIGRATION ---');

    // 1. Migrate User Avatars
    const wallets = await Wallet.find({});
    console.log(`Found ${wallets.length} wallets.`);

    for (const wallet of wallets) {
        if (wallet.avatarUrl && wallet.avatarUrl.includes('/uploads/avatars/')) {
            const filename = path.basename(wallet.avatarUrl);
            const oldPath = path.join(AVATARS_ROOT, filename);
            const safeAddress = wallet.address.replace(/[^a-zA-Z0-9_-]/g, '_');
            const newDir = path.join(UPLOADS_ROOT, 'users', safeAddress, 'avatars');

            if (fs.existsSync(oldPath)) {
                moveFile(oldPath, newDir, filename);
                wallet.avatarUrl = `/uploads/users/${safeAddress}/avatars/${filename}`;
                await wallet.save();
                console.log(`Migrated avatar for ${wallet.address}`);
            } else {
                // If file doesn't exist in old location, maybe it's already migrated or lost?
                // Check if it exists in new location just in case
                const potentialNewPath = path.join(newDir, filename);
                if (fs.existsSync(potentialNewPath)) {
                    wallet.avatarUrl = `/uploads/users/${safeAddress}/avatars/${filename}`;
                    await wallet.save();
                    console.log(`Fixed path for ${wallet.address} (already moved)`);
                }
            }
        }

        // Ensure folders exist even if no avatar
        const safeAddress = wallet.address.replace(/[^a-zA-Z0-9_-]/g, '_');
        const userDir = path.join(UPLOADS_ROOT, 'users', safeAddress);
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(path.join(userDir, 'avatars'), { recursive: true });
            fs.mkdirSync(path.join(userDir, 'submissions'), { recursive: true });
        }
    }

    // 2. Migrate Task Submissions
    const submissions = await TaskSubmission.find({});
    console.log(`Found ${submissions.length} submissions.`);

    for (const sub of submissions) {
        if (sub.proofImageUrl && sub.proofImageUrl.includes('/uploads/submissions/')) {
            const filename = path.basename(sub.proofImageUrl);
            const oldPath = path.join(SUBMISSIONS_ROOT, filename);
            const safeAddress = sub.walletAddress.replace(/[^a-zA-Z0-9_-]/g, '_');
            const newDir = path.join(UPLOADS_ROOT, 'users', safeAddress, 'submissions');

            if (fs.existsSync(oldPath)) {
                moveFile(oldPath, newDir, filename);
                sub.proofImageUrl = `/uploads/users/${safeAddress}/submissions/${filename}`;
                await sub.save();
                console.log(`Migrated submission ${sub._id}`);
            }
        }
    }

    // 3. Migrate Task Images (Content) - only if they are mixed in avatars
    // Admin content usually goes to /uploads/avatars too in old system
    const tasks = await Task.find({});
    console.log(`Found ${tasks.length} tasks.`);

    for (const task of tasks) {
        if (task.imageUrl && task.imageUrl.includes('/uploads/avatars/')) {
            const filename = path.basename(task.imageUrl);
            const oldPath = path.join(AVATARS_ROOT, filename);
            const newDir = path.join(UPLOADS_ROOT, 'content', 'tasks');

            if (fs.existsSync(oldPath)) {
                moveFile(oldPath, newDir, filename);
                task.imageUrl = `/uploads/content/tasks/${filename}`;
                await task.save();
                console.log(`Migrated task image ${task.name}`);
            }
        }
    }

    console.log('--- MIGRATION COMPLETE ---');
    console.log('Use "rm -rf backend/uploads/avatars" to cleanup old folders manually AFTER verification.');
    process.exit();
};

migrate();
