import axios from 'axios';

const API_URL = 'https://cbellory.online'; // Адрес API

// Получение рейтинга пользователей (общедоступный метод)
export const getUserRating = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/users/rating`);
    console.log('Рейтинг пользователей получен:', response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Ошибка при получении рейтинга пользователей:', error.response.data);
    } else {
      console.error('Ошибка при получении рейтинга пользователей:', error.message);
    }
    throw error;
  }
};
