const mongoose = require('mongoose');
const Task = require('../backend/models/Task');

mongoose.connect('mongodb://127.0.0.1:27018/walletsDB', { directConnection: true })
    .then(async () => {
        console.log('Connected to DB');
        const tasks = await Task.find({}, 'name type topic');
        console.log('--- ALL TASKS ---');
        tasks.forEach(t => {
            if (t.name.toLowerCase().includes('quiz') || t.name.toLowerCase().includes('test') || t.name.toLowerCase().includes('тест')) {
                console.log(`[CANDIDATE] ID: ${t._id} | Name: ${t.name} | Type: ${t.type}`);
            } else {
                console.log(`ID: ${t._id} | Name: ${t.name} | Type: ${t.type}`);
            }
        });
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
