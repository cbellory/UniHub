const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  loginName: { 
    type: String,
    required: true,
    unique: true
  },
  password: { 
    type: String,
    required: true
  },
  role: { 
    type: String,
    enum: ['superadmin', 'admin', 'moderator'],
    required: true
  }
});

// Хэширование пароля перед сохранением
UserSchema.pre('save', async function (next) {
  try {
    // Проверяем, изменился ли пароль перед его хешированием
    if (!this.isModified('password')) return next();

    console.log(`Начинаем хеширование пароля для пользователя ${this.loginName}`);

    // Генерация соли и хеширование пароля
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    console.log(`Соль успешно сгенерирована для ${this.loginName}: ${salt}`);

    const hashedPassword = await bcrypt.hash(this.password, salt);
    console.log(`Пароль успешно хеширован для ${this.loginName}: ${hashedPassword}`);

    // Сохраняем хешированный пароль
    this.password = hashedPassword;
    next();
  } catch (error) {
    console.error('Ошибка при хешировании пароля:', error);
    next(error);
  }
});

// Метод для проверки пароля
UserSchema.methods.comparePassword = async function (password) {
  try {
    console.log(`Введённый пароль: ${password}`);
    console.log(`Хеш пароля из базы данных: ${this.password}`);
    
    // Сравниваем введённый пароль с хешем из базы данных
    const isMatch = await bcrypt.compare(password, this.password);
    console.log(`Результат сравнения пароля для ${this.loginName}: ${isMatch ? 'совпало' : 'не совпало'}`);
    
    return isMatch;
  } catch (error) {
    console.error('Ошибка при сравнении паролей:', error);
    throw error;
  }
};

module.exports = mongoose.model('User', UserSchema);
