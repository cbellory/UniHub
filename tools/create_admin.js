const mongoose = require('../backend/node_modules/mongoose');
const User = require('../backend/models/User');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const generatePassword = (length = 10) => {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
};

const createAdmin = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const loginName = 'admin';
        // Generate a random password
        const password = generatePassword(12);

        let user = await User.findOne({ loginName });

        if (user) {
            console.log(`User '${loginName}' already exists. Updating password...`);
            user.password = password;
            user.role = 'superadmin'; // Ensure role is superadmin
            await user.save();
            console.log('--------------------------------------------------');
            console.log('Admin user updated successfully.');
            console.log(`Login:    ${loginName}`);
            console.log(`Password: ${password}`);
            console.log('--------------------------------------------------');
        } else {
            console.log(`Creating new user '${loginName}'...`);
            user = new User({
                loginName,
                password,
                role: 'superadmin'
            });
            await user.save();
            console.log('--------------------------------------------------');
            console.log('Admin user created successfully.');
            console.log(`Login:    ${loginName}`);
            console.log(`Password: ${password}`);
            console.log('--------------------------------------------------');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();
