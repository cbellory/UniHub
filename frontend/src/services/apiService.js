// src/services/apiService.js

const API_URL = process.env.REACT_APP_API_URL || "/api";

/**
 * Находит или регистрирует пользователя и сразу возвращает его полный профиль.
 * Это основной метод для входа в систему.
 */
export const getOrRegisterProfile = async (address, ip, referralAddress = null) => {
  console.log('Отправка на /api/register:', { address, ip, referral: referralAddress });
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, ip, referral: referralAddress }),
  });

  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(errorBody.message || 'Не вдалося отримати або зареєструвати профіль');
  }
  return response.json();
};

/**
 * Получает профиль уже существующего пользователя.
 */
export const fetchUserProfile = async (walletAddress) => {
  const response = await fetch(`${API_URL}/users/profile/${walletAddress}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Помилка при отриманні профілю');
  }
  return response.json();
};

/**
 * Получает список задач для пользователя.
 */
export const getTasks = async (walletAddress, filters = {}) => {
  let url = `${API_URL}/get-tasks/${walletAddress}`;

  // Build Query Params
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.status) params.append('status', filters.status);
  if (filters.type) params.append('type', filters.type);
  if (filters.tags && filters.tags.length > 0) params.append('tags', filters.tags.join(','));
  if (filters.min_points !== undefined) params.append('min_points', filters.min_points);
  if (filters.max_points !== undefined) params.append('max_points', filters.max_points);

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Помилка при отриманні завдань');
  }
  return response.json();
};

/**
 * Отправляет запрос на завершение задачи.
 */
export const completeTask = async (walletAddress, taskId, secretCode = null, quizAnswers = null) => {
  const body = { address: walletAddress, taskId };
  if (secretCode) {
    body.secretCode = secretCode;
  }
  if (quizAnswers) {
    body.quizAnswers = quizAnswers;
  }
  const response = await fetch(`${API_URL}/complete-task`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    // Attempt to parse error message if possible
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || 'Помилка при виконанні завдання');
  }
  return response.json();
};

/**
 * Получает прогресс Battle Pass.
 */
export const getBattlePassProgress = async (walletAddress) => {
  const response = await fetch(`${API_URL}/battlepass/progress/${walletAddress}`);
  if (!response.ok) {
    if (response.status === 404) return null; // Нормально для нового пользователя
    throw new Error('Помилка при отриманні прогресу Battle Pass');
  }
  return response.json();
}

/**
 * Отправка отчета о выполнении задания (Manual)
 */
export const submitTaskReport = async (walletAddress, taskId, text, file) => {
  const formData = new FormData();
  formData.append('address', walletAddress);
  formData.append('taskId', taskId);
  if (text) formData.append('submissionText', text);
  if (file) formData.append('proofImage', file);

  const response = await fetch(`${API_URL}/submit-task`, {
    method: "POST",
    body: formData, // Content-Type будет установлен автоматически браузером
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Error submitting report');
  }
  return response.json();
};

/**
 * Рассмотрение заявки администратором
 */
export const reviewSubmission = async (submissionId, action, comment) => {
  const response = await fetch(`${API_URL}/admin/review-submission`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ submissionId, action, comment }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Error reviewing submission');
  }
  return response.json();
};

export const getBadges = async () => {
  const response = await fetch(`${API_URL}/badges/all`);
  if (!response.ok) throw new Error('Failed to fetch badges');
  return response.json();
};

// --- SHOP API ---

export const getShopItems = async () => {
  const response = await fetch(`${API_URL}/shop/items`);
  if (!response.ok) throw new Error('Failed to fetch items');
  return response.json();
};


// COMPATIBILITY EXPORT
const api = {
  getOrRegisterProfile,
  fetchUserProfile,
  getTasks,
  completeTask,

  getBattlePassProgress,
  submitTaskReport,
  reviewSubmission,
  getBadges,

  getUserReferrals: async (address) => {
    const response = await fetch(`${API_URL}/users/referrals/${address}`);
    if (!response.ok) throw new Error('Failed to fetch referrals');
    // The endpoint returns { referrals: [...] }
    return response.json();
  },

  updateProfile: async (userData) => {
    const isFormData = userData instanceof FormData;
    const headers = isFormData ? {} : { 'Content-Type': 'application/json' };
    const body = isFormData ? userData : JSON.stringify(userData);

    const response = await fetch(`${API_URL}/users/update-profile`, {
      method: 'POST',
      headers,
      body
    });

    if (!response.ok) {
      throw new Error('Failed to update profile');
    }
    return response.json();
  },

  getShopItems: async () => {
    const response = await fetch(`${API_URL}/shop/items`);
    return response.json();
  },
  buyShopItem: async (itemId, addressVal, txHash) => {
    const address = addressVal || localStorage.getItem('walletAddress');
    if (!address) throw new Error("No wallet connected");

    const response = await fetch(`${API_URL}/shop/buy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, address, txHash })
    });
    return response.json();
  },
  equipShopItem: async (itemId, type, addressVal) => {
    const address = addressVal || localStorage.getItem('walletAddress');
    if (!address) throw new Error("No wallet connected");

    const response = await fetch(`${API_URL}/shop/equip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, type, address })
    });
    return response.json();
  },

  getPublicUserDetails: async (address) => {
    const response = await fetch(`${API_URL}/users/details/${address}`);
    if (!response.ok) throw new Error("Failed to load user details");
    return response.json();
  },

  getStudentTree: async (groupName) => {
    const response = await fetch(`${API_URL}/education/tree/${groupName}`);
    if (!response.ok) throw new Error("Failed to load education tree");
    return response.json();
  },

  syncBalance: async (address) => {
    if (!address) throw new Error("Address required");
    const response = await fetch(`${API_URL}/tokens/sync/${address}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.json();
  }
};

export default api;