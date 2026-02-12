import axios from 'axios';

const API_URL = ''; // Адрес API

// Получение всех кошельков
export const getWallets = async () => {
  try {
    const response = await axios.get(`${API_URL}/wallets`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении кошельков:', error);
    throw error;
  }
};

// Удаление кошелька
export const deleteWallet = async (address) => {
  try {
    await axios.delete(`${API_URL}/wallets/${address}`);
  } catch (error) {
    console.error('Ошибка при удалении кошелька:', error);
    throw error;
  }
};

// Обновление кошелька
export const updateWallet = async (address, updatedData) => {
  try {
    const response = await axios.put(`${API_URL}/wallets/${address}`, updatedData);
    return response.data;
  } catch (error) {
    console.error('Ошибка при обновлении кошелька:', error);
    throw error;
  }
};
