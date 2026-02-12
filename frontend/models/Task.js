// models/Task.js
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  points: { type: Number, required: true },
  imageUrl: { type: String },
  secretCode: { type: String },
  active: { type: Boolean, default: true },
  description: { type: String, default: '' } // <-- НАШЕ НОВОЕ ПОЛЕ
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;