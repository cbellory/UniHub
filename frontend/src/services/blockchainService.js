/**
 * API сервис для работы с блокчейн функциями (студенческий интерфейс)
 */

const API_BASE_URL = '/api';

// --- Токены ---

export const getMyTokenBalance = async (address) => {
    try {
        const response = await fetch(`${API_BASE_URL}/tokens/balance/${address}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Ошибка при получении баланса');
        return data;
    } catch (error) {
        console.error('Ошибка при получении баланса:', error);
        throw error;
    }
};

// --- Дипломы ---

export const getMyDiplomas = async (address) => {
    try {
        const response = await fetch(`${API_BASE_URL}/diploma/student/${address}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Помилка при отримані сертифікатів');
        return data;
    } catch (error) {
        console.error('Помилка при отримані сертифікатів:', error);
        throw error;
    }
};

export const getDiplomaDetails = async (tokenId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/diploma/${tokenId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Помилка при отримані інфармації про сертифікат');
        return data;
    } catch (error) {
        console.error('Помилка при отримані інфармації про сертифікат:', error);
        throw error;
    }
};

export const verifyMyDiploma = async (tokenId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/diploma/verify/${tokenId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Помилка при перевірці сертифіката');
        return data;
    } catch (error) {
        console.error('Помилка при перевірці сертифіката:', error);
        throw error;
    }
};
