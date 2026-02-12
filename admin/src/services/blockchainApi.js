import apiClient from './apiClient';

/**
 * API сервис для работы с блокчейн функциями
 * (токены и дипломы)
 */

// --- Токены (UniversityCoin) ---

/**
 * Выдать токены студенту
 */
export const mintTokens = async (studentAddress, amount, reason) => {
    try {
        const response = await apiClient.post('/tokens/mint', {
            studentAddress,
            amount,
            reason,
        });
        return response.data;
    } catch (error) {
        console.error('Ошибка при выдаче токенов:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Получить баланс токенов студента
 */
export const getTokenBalance = async (address) => {
    try {
        const response = await apiClient.get(`/tokens/balance/${address}`);
        return response.data;
    } catch (error) {
        console.error('Ошибка при получении баланса:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Синхронизировать баланс из блокчейна в базу данных
 */
export const syncTokenBalance = async (address) => {
    try {
        const response = await apiClient.post(`/tokens/sync/${address}`);
        return response.data;
    } catch (error) {
        console.error('Ошибка при синхронизации баланса:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Получить адреса контрактов
 */
export const getContractAddresses = async () => {
    try {
        const response = await apiClient.get('/tokens/contracts');
        return response.data;
    } catch (error) {
        console.error('Ошибка при получении адресов контрактов:', error.response?.data || error.message);
        throw error;
    }
};

// --- Дипломы (SoulboundDiploma NFT) ---

/**
 * Выдать диплом студенту
 */
export const mintDiploma = async (studentAddress, metadataURI, diplomaData, imageFile) => {
    try {
        const formData = new FormData();
        formData.append('studentAddress', studentAddress);
        formData.append('metadataURI', metadataURI);
        formData.append('diplomaData', JSON.stringify(diplomaData));

        if (imageFile) {
            formData.append('image', imageFile);
        }

        const response = await apiClient.post('/diploma/mint', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Ошибка при выдаче диплома:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Получить информацию о дипломе по tokenId
 */
export const getDiplomaInfo = async (tokenId) => {
    try {
        const response = await apiClient.get(`/diploma/${tokenId}`);
        return response.data;
    } catch (error) {
        console.error('Ошибка при получении информации о дипломе:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Получить все дипломы студента
 */
export const getStudentDiplomas = async (address) => {
    try {
        const response = await apiClient.get(`/diploma/student/${address}`);
        return response.data;
    } catch (error) {
        console.error('Ошибка при получении дипломов студента:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Получить все выданные дипломы (для админа)
 */
export const getAllDiplomas = async (page = 1, limit = 20) => {
    try {
        const response = await apiClient.get(`/diploma/all/list?page=${page}&limit=${limit}`);
        return response.data;
    } catch (error) {
        console.error('Ошибка при получении всех дипломов:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Проверить подлинность диплома
 */
export const verifyDiploma = async (tokenId) => {
    try {
        const response = await apiClient.get(`/diploma/verify/${tokenId}`);
        return response.data;
    } catch (error) {
        console.error('Ошибка при проверке диплома:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Удалить диплом
 */
export const deleteDiploma = async (id) => {
    try {
        const response = await apiClient.delete(`/diploma/${id}`);
        return response.data;
    } catch (error) {
        console.error('Ошибка при удалении диплома:', error.response?.data || error.message);
        throw error;
    }
};
