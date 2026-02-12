import apiClient from './apiClient'; // Импортируем наш централизованный клиент

// --- ИЗМЕНЕНИЕ ЗДЕСЬ: Убран лишний /api в начале ---
const API_URL = '/admin/battlepass'; // Правильный относительный путь

// Получение уровней battlepass
export const fetchLevels = async () => {
  try {
    const response = await apiClient.get(`${API_URL}/levels`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении уровней Battle Pass:', error.response?.data || error.message);
    throw error;
  }
};

// Добавление нового уровня
export const addLevel = async (level) => {
  try {
    const response = await apiClient.post(`${API_URL}/levels`, level);
    return response.data;
  } catch (error) {
    console.error('Ошибка при добавлении уровня Battle Pass:', error.response?.data || error.message);
    throw error;
  }
};

// Обновление уровня по ID
export const updateLevel = async (id, level) => {
  try {
    const response = await apiClient.put(`${API_URL}/levels/${id}`, level);
    return response.data;
  } catch (error) {
    console.error('Ошибка при обновлении уровня Battle Pass:', error.response?.data || error.message);
    throw error;
  }
};

// Удаление уровня по ID
export const deleteLevel = async (id) => {
  try {
    const response = await apiClient.delete(`${API_URL}/levels/${id}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при удалении уровня Battle Pass:', error.response?.data || error.message);
    throw error;
  }
};