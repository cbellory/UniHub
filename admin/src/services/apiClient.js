import axios from 'axios';

// Создаем централизованный экземпляр axios
const apiClient = axios.create({
  // Указываем базовый URL вашего API, включая /api
  // Используем относительный путь, чтобы работать и локально, и на домене
  baseURL: '/api'
});

// Это "перехватчик" (interceptor). Он будет выполняться ПЕРЕД каждым запросом.
apiClient.interceptors.request.use(
  (config) => {
    // Получаем токен из localStorage
    const token = localStorage.getItem('token');

    // Если токен есть, добавляем его в заголовок Authorization
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config; // Возвращаем измененную конфигурацию запроса
  },
  (error) => {
    // В случае ошибки просто пробрасываем ее дальше
    return Promise.reject(error);
  }
);

export default apiClient;