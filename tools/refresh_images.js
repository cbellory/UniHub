const mongoose = require('mongoose');
const MongoClient = mongoose.mongo.MongoClient;

const uri = 'mongodb://127.0.0.1:27018';
const dbName = 'walletsDB';

console.log('Connecting and Refreshing Images...');

// Mapping topics to specific local images (using existing uploads/avatars)
// Using large files (presumably nice looking) or distinct ones
const IMAGE_MAP = {
    'aws': '/uploads/avatars/1767613561305-8c25adac-5e28-4b3b-b038-6cfd1d3648ed.png',  // Blue tech looking
    'sql': '/uploads/avatars/1767613825678-a52eeb5b-db32-4195-9bba-1b9288fb4506.png',  // Database looking
    'crypto': '/uploads/avatars/1767610816920-de755dab-3bdf-45a5-b553-6f50e8b04a0b.png', // Wallet looking
    'contract': '/uploads/avatars/1765242003520-d0d91598-08fb-4de9-b500-6de6d0305cef.png', // Smart Contract looking
    'quiz': '/uploads/avatars/quiz_icon.gif', // Animated for Quiz stuff
    'default': '/uploads/avatars/1767615049963-png-clipart-computer-icons-student-education-college-avatar-angle-child.png' // Student icon used as fallback
};

MongoClient.connect(uri)
    .then(async client => {
        const db = client.db(dbName);
        const tasksCollection = db.collection('tasks');

        const tasks = await tasksCollection.find({}).toArray();
        console.log(`Found ${tasks.length} tasks to refresh.`);

        for (const task of tasks) {
            let newImage = IMAGE_MAP.default;
            const name = task.name.toLowerCase();
            const desc = (task.description || '').toLowerCase();

            if (name.includes('aws') || name.includes('redshift') || name.includes('glue')) {
                newImage = IMAGE_MAP.aws;
            } else if (name.includes('sql')) {
                newImage = IMAGE_MAP.sql;
            } else if (name.includes('quiz') || name.includes('тест')) {
                newImage = IMAGE_MAP.quiz;
            } else if (name.includes('wallet') || name.includes('гаман') || name.includes('seed') || name.includes('metamask') || name.includes('trans')) {
                newImage = IMAGE_MAP.crypto;
            } else if (name.includes('contract') || name.includes('erc') || name.includes('solidity') || name.includes('token') || name.includes('remix')) {
                newImage = IMAGE_MAP.contract;
            }

            await tasksCollection.updateOne(
                { _id: task._id },
                { $set: { imageUrl: newImage } }
            );
            console.log(`Updated [${task.name}] -> ${newImage}`);
        }

        console.log(`All images refreshed.`);
        client.close();
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
