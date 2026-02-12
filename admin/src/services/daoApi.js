import apiClient from './apiClient';

// Базовий URL для DAO, який ми зареєстрували в app.js (/api/dao)
const API_URL = '/dao';

/**
 * Створює нову пропозицію (голосовання).
 * Викликає захищений маршрут POST /api/dao/proposals
 * (apiClient автоматично додасть /api попереду та JWT токен)
 * @param {string} title - Заголовок
 * @param {string} description - Опис
 * @param {string[]} choices - Масив рядків з варіантами (напр., ["Так", "Ні"])
 * @returns {Promise<any>}
 */
export const createProposal = async (title, description, choices) => {
  try {
    const response = await apiClient.post(`${API_URL}/proposals`, {
      title,
      description,
      choices,
    });
    return response.data;
  } catch (error) {
    console.error('Помилка при створенні пропозиції (DAO):', error.response?.data || error.message);
    // Повертаємо помилку, щоб компонент міг її обробити
    throw error.response?.data || new Error('Помилка при створенні пропозиції');
  }
};

export const getProposals = async () => {
  const response = await apiClient.get(`${API_URL}/proposals`);
  return response.data;
};

export const closeProposal = async (id) => {
  const response = await apiClient.put(`${API_URL}/proposals/${id}/close`);
  return response.data;
};

export const deleteProposal = async (id) => {
  const response = await apiClient.delete(`${API_URL}/proposals/${id}`);
  return response.data;
};