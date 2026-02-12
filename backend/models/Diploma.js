const mongoose = require('mongoose');

const diplomaSchema = new mongoose.Schema({
    tokenId: { type: Number, required: true, unique: true },
    studentAddress: { type: String, required: true },
    metadataURI: { type: String, required: true },
    transactionHash: { type: String, required: true },
    blockNumber: { type: Number, required: true },

    // Метаданные диплома (дублируем для быстрого доступа)
    diplomaData: {
        university: { type: String },
        specialty: { type: String },
        graduationYear: { type: Number },
        averageGrade: { type: Number },
        honors: { type: String },
    },

    issuedAt: { type: Date, default: Date.now },
    issuedBy: { type: String }, // Адрес того, кто выдал диплом
});

// Индексы для быстрого поиска
diplomaSchema.index({ studentAddress: 1 });
diplomaSchema.index({ tokenId: 1 });

const Diploma = mongoose.model('Diploma', diplomaSchema);

module.exports = Diploma;
