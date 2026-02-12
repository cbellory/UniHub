const mongoose = require('../backend/node_modules/mongoose');
const fs = require('fs');
const path = require('path');

// Models
const Group = require('../backend/models/Group');
const Course = require('../backend/models/Course');
const Topic = require('../backend/models/Topic');
const Task = require('../backend/models/Task');

const uri = 'mongodb://127.0.0.1:27018/walletsDB';

async function repairCollection(model, name, idFieldsToFix = []) {
    console.log(`\n--- REPAIRING: ${name} ---`);
    try {
        // 1. Fetch All Data (Lean to get raw JS objects)
        let docs = await model.find({}).lean();
        console.log(`Fetched ${docs.length} documents.`);

        if (docs.length === 0) {
            console.log('Collection empty, skipping.');
            return;
        }

        // 2. Fix Types in Memory (String -> ObjectId)
        let fixedCount = 0;
        docs = docs.map(doc => {
            // Fix _id if needed (usually auto-handled but good to ensure)
            if (typeof doc._id === 'string') {
                try { doc._id = new mongoose.Types.ObjectId(doc._id); } catch (e) { }
            }

            // Fix specific fields (e.g. topic.course)
            idFieldsToFix.forEach(field => {
                if (doc[field] && typeof doc[field] === 'string') {
                    try {
                        doc[field] = new mongoose.Types.ObjectId(doc[field]);
                        fixedCount++;
                    } catch (e) { }
                }
                // Handle Arrays (e.g. Group.courses)
                if (doc[field] && Array.isArray(doc[field])) {
                    doc[field] = doc[field].map(item => {
                        if (typeof item === 'string') {
                            fixedCount++;
                            return new mongoose.Types.ObjectId(item);
                        }
                        return item;
                    });
                }
            });
            return doc;
        });

        if (fixedCount > 0) console.log(`Fixed types for ${fixedCount} fields.`);

        // 3. Backup
        const backupPath = `backup_repair_${name}_${Date.now()}.json`;
        fs.writeFileSync(backupPath, JSON.stringify(docs, null, 2));
        console.log(`Backup saved to ${backupPath}`);

        // 4. Drop Collection (Forces Index Rebuild)
        try {
            await mongoose.connection.db.collection(name).drop();
            console.log('Collection dropped (Index reset).');
        } catch (e) {
            console.log('Drop failed (maybe didn\'t exist?), proceeding to insert.');
        }

        // 5. Re-Insert
        await model.insertMany(docs);
        console.log(`Successfully re-inserted ${docs.length} documents.`);

    } catch (err) {
        console.error(`FAILED to repair ${name}:`, err.message);
    }
}

async function run() {
    try {
        await mongoose.connect(uri);
        console.log('Connected to DB. Starting Emergency Repair...');

        // Repair sequence (Order matters slightly for logic, but for indices it's independent)
        await repairCollection(Group, 'groups', ['courses']);
        await repairCollection(Course, 'courses', []);
        await repairCollection(Topic, 'topics', ['course']);
        await repairCollection(Task, 'tasks', ['topic']);

        console.log('\n✅ EMERGENCY REPAIR COMPLETE.');
        console.log('Please restart the Site/Server now.');

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
