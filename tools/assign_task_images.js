const mongoose = require('mongoose');
const MongoClient = mongoose.mongo.MongoClient;

const uri = 'mongodb://127.0.0.1:27018'; // Direct connection
const dbName = 'walletsDB';

// Valid local images from uploads directory
const defaultImages = [
    '/uploads/1728234375594-hot-wallet-telegram-app-v0-8pe6ybeme2ad1.webp',
    '/uploads/1729914383773-Visco.png',
    '/uploads/1730559445342-BKFsWarw_400x400.png',
    '/uploads/1732633980589-paws1730205532073.png'
];

console.log('Connecting and fixing images...');

MongoClient.connect(uri)
    .then(async client => {
        const db = client.db(dbName);
        const tasksCollection = db.collection('tasks');

        // Find tasks with:
        // 1. Missing imageUrl
        // 2. Empty imageUrl
        // 3. Unsplash imageUrl (unstable)
        const tasks = await tasksCollection.find({
            $or: [
                { imageUrl: { $exists: false } },
                { imageUrl: "" },
                { imageUrl: null },
                { imageUrl: { $regex: /unsplash/i } }
            ]
        }).toArray();

        console.log(`Found ${tasks.length} tasks to fix.`);

        for (const task of tasks) {
            const randomImage = defaultImages[Math.floor(Math.random() * defaultImages.length)];

            await tasksCollection.updateOne(
                { _id: task._id },
                { $set: { imageUrl: randomImage } }
            );
            console.log(`Updated ${task.name} -> ${randomImage}`);
        }

        console.log(`Done.`);
        client.close();
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
