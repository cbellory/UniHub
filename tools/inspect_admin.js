const mongoose = require('../backend/node_modules/mongoose');
const User = require('../backend/models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const inspectAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ loginName: 'admin' });
        if (user) {
            console.log('User found:', {
                loginName: user.loginName,
                password: user.password,
                role: user.role
            });
        } else {
            console.log('User admin not found');
        }
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

inspectAdmin();
