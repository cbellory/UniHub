const mongoose = require('mongoose');

// Эта схема описывает одно "Предложение" (голосование) в нашей системе DAO
const proposalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Название голосования обязательно'],
  },
  description: {
    type: String,
    required: [true, 'Описание голосования обязательно'],
  },
  // Варианты выбора, например: [{ name: "Да", votes: 1500 }, { name: "Нет", votes: 200 }]
  choices: [
    {
      name: String, // Название варианта (напр., "Да")
      votes: { type: Number, default: 0 }, // Общая "сила голосов", отданных за этот вариант
    },
  ],
  // Массив адресов кошельков, которые уже проголосовали
  // Это нужно, чтобы один пользователь не мог проголосовать дважды
  voters: {
    type: [String],
    default: [],
  },
  // Статус голосования
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Индексируем адреса проголосовавших для быстрого поиска
proposalSchema.index({ 'voters': 1 });

const Proposal = mongoose.model('Proposal', proposalSchema);

module.exports = Proposal;