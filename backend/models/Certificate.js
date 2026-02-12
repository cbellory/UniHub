const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
    tokenId: { type: Number, required: true, unique: true },
    studentAddress: { type: String, required: true },
    metadataURI: { type: String, required: true },
    transactionHash: { type: String, required: true },
    blockNumber: { type: Number, required: true },

    // Certificate metadata (duplicated for quick access)
    certificateData: {
        institution: { type: String }, // e.g., "Blockchain Academy"
        courseName: { type: String }, // e.g., "Smart Contracts Mastery"
        completionYear: { type: Number },
        averageGrade: { type: Number },
        honors: { type: String },
        imageUrl: { type: String }, // URL to certificate image
        description: { type: String }, // Achievement description
    },

    issuedAt: { type: Date, default: Date.now },
    issuedBy: { type: String }, // Address of issuer
});

// Indexes for fast lookup
certificateSchema.index({ studentAddress: 1 });
certificateSchema.index({ tokenId: 1 });

const Certificate = mongoose.model('Certificate', certificateSchema);

module.exports = Certificate;
