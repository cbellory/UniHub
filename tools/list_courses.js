const mongoose = require('../backend/node_modules/mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const Course = require('../backend/models/Course');

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27018/walletsDB';

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('Connected to DB');
        const courses = await Course.find({});
        console.log('Courses found:', courses.length);
        courses.forEach(c => console.log(`- "${c.title}" (ID: ${c._id})`));
        mongoose.disconnect();
    })
    .catch(console.error);
