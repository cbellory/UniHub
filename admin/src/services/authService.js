import apiClient from './apiClient'; // Импортируем наш "мозг"

/**
 * Отправляет запрос на авторизацию
 * @param {string} loginName - Имя пользователя
 * @param {string} password - Пароль
 * @returns {Promise<{token: string, role: string}>} - Возвращает токен и роль
 */
export const login = async (loginName, password) => {
  try {
    // --- ИЗМЕНЕНИЕ ЗДЕСЬ: Убран лишний /api в начале ---
    const response = await apiClient.post('/custom-auth/login', {
      loginName,
      password,
    });
    return response.data; 
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Помилка при авторизації';
    throw new Error(errorMessage);
  }
};