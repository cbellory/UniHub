import apiClient from './apiClient'; // Импортируем наш новый централизованный клиент

const API_URL = '/admin-api'; // Используем только относительный путь

// --- Функции для работы с задачами ---

export const getTasks = async () => {
  try {
    const response = await apiClient.get(`${API_URL}/tasks`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении задач:', error.response?.data || error.message);
    throw error;
  }
};

export const addTask = async (task) => {
  try {
    const formData = new FormData();
    formData.append('name', task.name || '');
    formData.append('url', task.url || '');
    formData.append('points', task.points || 0);
    formData.append('secretCode', task.secretCode || '');
    formData.append('description', task.description || ''); // <-- ДОБАВЛЕНО
    formData.append('tags', task.tags || ''); // <-- ДОБАВЛЕНО tags
    formData.append('type', task.type || 'auto'); // <-- ДОБАВЛЕНО type
    if (task.image) {
      formData.append('image', task.image);
    }

    const response = await apiClient.post(`${API_URL}/tasks`, formData);
    return response.data;
  } catch (error) {
    console.error('Ошибка при добавлении задачи:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteTask = async (id) => {
  try {
    const response = await apiClient.delete(`${API_URL}/tasks/${id}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при удалении задачи:', error.response?.data || error.message);
    throw error;
  }
};

export const updateTask = async (id, task) => {
  try {
    const formData = new FormData();
    formData.append('name', task.name || '');
    formData.append('url', task.url || '');
    formData.append('points', task.points || 0);
    formData.append('secretCode', task.secretCode || '');
    formData.append('description', task.description || ''); // <-- ДОБАВЛЕНО
    formData.append('tags', task.tags || ''); // <-- ДОБАВЛЕНО tags
    formData.append('type', task.type || 'auto'); // <-- ДОБАВЛЕНО type
    if (task.image) {
      formData.append('image', task.image);
    }
    if (task.topic !== undefined) formData.append('topic', task.topic || '');
    if (task.prerequisites !== undefined) formData.append('prerequisites', JSON.stringify(task.prerequisites));

    const response = await apiClient.put(`${API_URL}/tasks/${id}`, formData);
    return response.data;
  } catch (error) {
    console.error('Ошибка при обновлении задачи:', error.response?.data || error.message);
    throw error;
  }
};



export const getUserDetails = async (address) => {
  try {
    const response = await apiClient.get(`${API_URL}/users/details/${address}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении деталей пользователя:', error.response?.data || error.message);
    throw error;
  }
};

// --- Функции для работы с пользователями админ-панели ---

export const getUsers = async () => {
  try {
    const response = await apiClient.get(`${API_URL}/users`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении списка пользователей:', error.response?.data || error.message);
    throw error;
  }
};

export const createUser = async (userData) => {
  try {
    const response = await apiClient.post(`${API_URL}/users`, userData);
    return response.data;
  } catch (error) {
    console.error('Ошибка при создании пользователя:', error.response?.data || error.message);
    throw error;
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const response = await apiClient.put(`${API_URL}/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    console.error('Ошибка при обновлении пользователя:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await apiClient.delete(`${API_URL}/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при удалении пользователя:', error.response?.data || error.message);
    throw error;
  }
};

// --- Функции для проверки заданий (Submissions) ---

export const getPendingSubmissions = async (filter) => {
  try {
    // filter object can be passed as query params if needed in future
    const response = await apiClient.get(`${API_URL}/submissions`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении заявок:', error.response?.data || error.message);
    throw error;
  }
};

export const reviewSubmission = async (submissionId, action, comment) => {
  try {
    const response = await apiClient.post(`${API_URL}/review-submission`, { submissionId, action, comment });
    return response.data;
  } catch (error) {
    console.error('Ошибка при проверке заявки:', error.response?.data || error.message);
    throw error;
  }
};