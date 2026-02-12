const mongoose = require('mongoose');

const taskSubmissionSchema = new mongoose.Schema({
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: true
    },
    walletAddress: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    submissionText: { type: String },
    proofImageUrl: { type: String }, // Путь к файлу на сервере
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    adminComment: { type: String }
});

// Индексы
taskSubmissionSchema.index({ status: 1 }); // Для быстрой фильтрации "Ожидающих"
taskSubmissionSchema.index({ walletAddress: 1, taskId: 1 }); // Поиск заявки конкретного юзера по таску

module.exports = mongoose.model('TaskSubmission', taskSubmissionSchema);
