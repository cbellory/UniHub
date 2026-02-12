import apiClient from './apiClient'; // Импортируем наш централизованный клиент

const API_URL = '/wallets'; // Используем только относительный путь

// Получение всех кошельков
export const getWallets = async () => {
  try {
    // Токен больше не нужно передавать, apiClient добавит его сам
    const response = await apiClient.get(API_URL);
    console.log('Получены кошельки:', response.data);
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении кошельков:', error.response?.data || error.message);
    throw error;
  }
};

// Удаление кошелька
export const deleteWallet = async (address) => {
  try {
    await apiClient.delete(`${API_URL}/${address}`);
    console.log(`Кошелек ${address} удален`);
  } catch (error) {
    console.error('Ошибка при удалении кошелька:', error.response?.data || error.message);
    throw error;
  }
};

// Обновление данных кошелька
export const updateWallet = async (address, updatedData) => {
  try {
    console.log('Отправка данных для обновления кошелька:', updatedData);
    const response = await apiClient.put(`${API_URL}/${address}`, updatedData);
    console.log('Ответ сервера после обновления кошелька:', response.data);
    return response.data;
  } catch (error) {
    console.error('Ошибка при обновлении кошелька:', error.response?.data || error.message);
    throw error;
  }
};

// Добавление нового кошелька
export const addWallet = async (walletData) => {
  try {
    const response = await apiClient.post(API_URL, walletData);
    console.log('Добавлен новый кошелек:', response.data);
    return response.data;
  } catch (error) {
    console.error('Ошибка при добавлении кошелька:', error.response?.data || error.message);
    throw error;
  }
};