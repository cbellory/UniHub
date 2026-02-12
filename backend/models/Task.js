const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  points: { type: Number, required: true },
  imageUrl: { type: String },
  secretCode: { type: String },
  description: { type: String },   // <-- ДОБАВИЛИ ЭТО
  tags: { type: [String], default: [] }, // <-- Added tags field
  type: {
    type: String,
    enum: ['auto', 'code', 'manual', 'quiz'],
    default: 'auto'
  },
  // Quiz Data
  quizData: [{
    question: String,
    options: [String],
    correctIndex: Number
  }],
  active: { type: Boolean, default: true },

  // --- Skill Tree Fields ---
  topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
  prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],

  createdAt: { type: Date, default: Date.now }
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;

