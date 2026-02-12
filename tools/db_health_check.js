const mongoose = require('../backend/node_modules/mongoose');
const fs = require('fs');

const uri = 'mongodb://127.0.0.1:27017/walletsDB';

async function run() {
    try {
        console.log('--- DATABASE HEALTH CHECK START ---');
        await mongoose.connect(uri);
        console.log('Connected to DB successfully.\n');

        const db = mongoose.connection.db;
        const admin = db.admin();

        // 1. Server Status
        const serverStatus = await admin.serverStatus();
        console.log(`MongoDB Version: ${serverStatus.version}`);
        console.log(`Uptime: ${serverStatus.uptime} seconds`);
        console.log(`Connections: Current=${serverStatus.connections.current}, Available=${serverStatus.connections.available}`);
        console.log('--------------------------------------------------\n');

        // 2. Iterate Collections
        const collections = await db.listCollections().toArray();
        console.log(`Found ${collections.length} collections. Checking integrity...\n`);

        const report = [];

        for (const colInfo of collections) {
            const colName = colInfo.name;
            if (colName.startsWith('system.')) continue;

            const collection = db.collection(colName);

            // A. Count
            const count = await collection.countDocuments();

            // B. Scan (find one)
            let sampleDoc = null;
            let status = 'OK';
            let indexStatus = 'OK';
            let errorMsg = null;

            try {
                sampleDoc = await collection.findOne({});
            } catch (err) {
                status = 'SCAN_FAILED';
                errorMsg = err.message;
            }

            // C. Index Verify (findById) if we have a doc
            if (sampleDoc && sampleDoc._id) {
                try {
                    const foundById = await collection.findOne({ _id: sampleDoc._id });
                    if (!foundById) {
                        indexStatus = 'CORRUPTED (findById returned null)';
                        status = 'CRITICAL_FAILURE';
                    }
                } catch (err) {
                    indexStatus = 'ERROR';
                    status = 'CRITICAL_FAILURE';
                    errorMsg = err.message;
                }
            } else if (count > 0 && !sampleDoc) {
                status = 'GHOST_DATA (Count > 0 but findOne null)';
            }

            // D. Check for mixed ID types in _id
            let idType = 'N/A';
            if (sampleDoc) {
                idType = typeof sampleDoc._id;
                if (sampleDoc._id && sampleDoc._id.constructor) {
                    idType += ` (${sampleDoc._id.constructor.name})`;
                }
            }

            console.log(`Collection: [${colName}]`);
            console.log(`  - Documents: ${count}`);
            console.log(`  - Scan Status: ${status}`);
            console.log(`  - Index Status: ${indexStatus}`);
            console.log(`  - _id Type: ${idType}`);
            if (errorMsg) console.log(`  - ERROR: ${errorMsg}`);
            console.log('');

            report.push({
                name: colName,
                status,
                count,
                indexStatus
            });
        }

        const corrupted = report.filter(r => r.status !== 'OK' || r.indexStatus !== 'OK');

        console.log('--- SUMMARY ---');
        if (corrupted.length === 0) {
            console.log('✅ ALL COLLECTIONS ARE HEALTHY.');
        } else {
            console.log('❌ CORRUPTION DETECTED IN:', corrupted.map(c => c.name).join(', '));
            console.log('Recommended Action: Run restore script for these collections.');
        }

    } catch (err) {
        console.error('FATAL ERROR:', err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
