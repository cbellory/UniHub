const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const mongoose = require('../backend/node_modules/mongoose');
const Certificate = require('../backend/models/Certificate');
require('dotenv').config({ path: '../backend/.env' });

const API_BASE = 'http://localhost:5555';
const STUDENT_ADDRESS = '0x417339aAABc69BAE824A044F33D5D1b433F30885';
const MONGO_URI = (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27018/walletsDB').replace('localhost', '127.0.0.1');

async function reissueCertificate() {
    try {
        // 1. Cleanup old certificates
        console.log('🧹 Cleaning up old certificates for user...');
        await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        const deleteResult = await Certificate.deleteMany({ studentAddress: new RegExp(`^${STUDENT_ADDRESS}$`, 'i') });
        console.log(`✓ Deleted ${deleteResult.deletedCount} old certificates.`);
        await mongoose.disconnect();

        // 2. Issue new one
        console.log('\n🎓 Issuing CORRECT certificate (Year 2026)...');
        const form = new FormData();
        form.append('studentAddress', STUDENT_ADDRESS);

        const certificateData = {
            institution: 'IT HUB',
            courseName: 'Освитний IT Хаб',
            completionYear: 2026,
            averageGrade: 100,
            honors: 'З відзнакою',
            description: 'Студент: Мілінтєєв Данііл Дмитрович. Успішно завершив навчання.'
        };

        form.append('certificateData', JSON.stringify(certificateData));

        const imagePath = path.join(__dirname, '../frontend/public/logo512.png');
        if (fs.existsSync(imagePath)) {
            console.log('📸 Attaching image:', imagePath);
            form.append('image', fs.createReadStream(imagePath));
        }

        console.log('📤 Sending request...');
        const response = await axios.post(
            `${API_BASE}/api/certificates/mint`,
            form,
            {
                headers: form.getHeaders(),
                timeout: 30000
            }
        );

        if (response.data.success) {
            console.log('\n✅ New Certificate Issued!');
            console.log('Token ID:', response.data.data.tokenId);
            console.log('Metadata URI:', response.data.data.certificate.metadataURI);
        } else {
            console.error('❌ Failed:', response.data.message);
        }

    } catch (error) {
        console.error('❌ Error:', error.response ? error.response.data : error.message);
        if (mongoose.connection.readyState === 1) await mongoose.disconnect();
    }
}

reissueCertificate();
