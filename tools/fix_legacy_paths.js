const mongoose = require('../backend/node_modules/mongoose');
const Wallet = require('../backend/models/Wallet');
const Task = require('../backend/models/Task');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const UPLOADS_ROOT = path.join(__dirname, '../backend/uploads');
const ICONS_OLD = path.join(UPLOADS_ROOT, 'icons');
const ICONS_NEW = path.join(UPLOADS_ROOT, 'content', 'icons');

const fixPaths = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // 1. Move Icons Directory
        if (fs.existsSync(ICONS_OLD)) {
            if (!fs.existsSync(path.dirname(ICONS_NEW))) fs.mkdirSync(path.dirname(ICONS_NEW), { recursive: true });

            // If new icons folder already exists, move content
            if (fs.existsSync(ICONS_NEW)) {
                const files = fs.readdirSync(ICONS_OLD);
                files.forEach(f => {
                    fs.renameSync(path.join(ICONS_OLD, f), path.join(ICONS_NEW, f));
                });
                fs.rmdirSync(ICONS_OLD);
            } else {
                fs.renameSync(ICONS_OLD, ICONS_NEW);
            }
            console.log('Moved icons to content/icons');
        }

        // 2. Update Batches of Tasks
        const tasks = await Task.find({ imageUrl: { $regex: /^\/uploads\/icons\// } });
        for (const t of tasks) {
            t.imageUrl = t.imageUrl.replace('/uploads/icons/', '/uploads/content/icons/');
            await t.save();
            console.log(`Updated task ${t.name}`);
        }

        // 3. Update Wallets with Default Avatar
        const wallets = await Wallet.find({ avatarUrl: { $regex: /^\/uploads\/(avatars\/)?default_avatar\.png/ } });
        for (const w of wallets) {
            w.avatarUrl = '/uploads/content/default_avatar.png';
            await w.save();
            console.log(`Updated wallet ${w.address}`);
        }

        // 4. Update Wallets with old /uploads/avatars/ path (if any remaining)
        // If they point to a file that was deleted, we might want to reset them to default?
        // But for now let's just point them to content if we can, or leave them (they are broken links now).
        // Best to reset to default if broken.

        const brokenWallets = await Wallet.find({ avatarUrl: { $regex: /^\/uploads\/avatars\// } });
        for (const w of brokenWallets) {
            // Check if file exists in new user location? No, we deleted avatars folder.
            // So these are definitely broken unless they were migrated.
            // If they were migrated, they would point to /uploads/users/...
            // So these are broken. Reset to default.
            if (w.avatarUrl !== '/uploads/content/default_avatar.png') {
                w.avatarUrl = '/uploads/content/default_avatar.png';
                await w.save();
                console.log(`Reset broken avatar for ${w.address}`);
            }
        }

        console.log('--- Fix Complete ---');
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

fixPaths();
