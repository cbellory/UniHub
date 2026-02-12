const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BACKUP_ROOT = path.join(PROJECT_ROOT, 'backups', 'db');

if (!fs.existsSync(BACKUP_ROOT)) fs.mkdirSync(BACKUP_ROOT, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const specificBackupDir = path.join(BACKUP_ROOT, `backup_${timestamp}`);
fs.mkdirSync(specificBackupDir);

// Utils
function drawBar(current, total, taskName) {
    const width = 30;
    const pct = current / total;
    const filled = Math.floor(width * pct);
    const empty = width - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const percent = Math.floor(pct * 100);

    // \r переписывает строку
    process.stdout.write(`\r[${bar}] ${percent}% (${current}/${total}) ${taskName}          `);
}

async function runBackup() {
    console.log('\n🚀 STARTING DATABASE BACKUP');
    console.log('================================');
    console.log(`📅 Timestamp: ${timestamp}`);
    console.log(`📂 Target: ${specificBackupDir}`);

    const connStr = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/walletsDB";

    try {
        await mongoose.connect(connStr, { useNewUrlParser: true, useUnifiedTopology: true });
        // Silent connect
    } catch (e) {
        console.error('\n❌ Connection failed:', e.message);
        process.exit(1);
    }

    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        const total = collections.length;

        console.log(`\n📊 Found ${total} collections. Starting export...\n`);

        if (total === 0) {
            console.log('⚠️  Database is empty.');
        } else {
            for (let i = 0; i < total; i++) {
                const collName = collections[i].name;

                // Update bar BEFORE processing
                drawBar(i, total, `Saving ${collName}...`);

                // Fetch data
                const data = await mongoose.connection.db.collection(collName).find({}).toArray();

                // Write file
                fs.writeFileSync(
                    path.join(specificBackupDir, `${collName}.json`),
                    JSON.stringify(data, null, 2)
                );

                // Simulate tiny delay (optional) to let user see the progress if it's too fast
                if (total < 20) await new Promise(r => setTimeout(r, 100));
            }
            // Final bar
            drawBar(total, total, 'Complete!');
            process.stdout.write('\n'); // New line
        }

        console.log('\n================================');
        console.log('🎉 BACKUP SUCCESSFUL');
        console.log('================================');

        await mongoose.connection.close();
        process.exit(0);

    } catch (e) {
        console.error('\n❌ Backup failed:', e.message);
        process.exit(1);
    }
}

runBackup();
