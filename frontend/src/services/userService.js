const API_URL = '/api/admin-api/users'; // Используем правильный маршрут API для пользователей

export const getUserRatings = async () => {
  const response = await fetch(`${API_URL}/ratings`);
  if (!response.ok) {
    throw new Error('Ошибка при получении рейтинга пользователей');
  }
  return response.json();
};
