import apiClient from './apiClient';

const BASE_URL = '/admin-api/dashboard';

export const getDashboardStats = async () => {
    try {
        const response = await apiClient.get(`${BASE_URL}/stats`);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
        throw error;
    }
};

export const getPerformanceMetrics = async () => {
    try {
        const response = await apiClient.get(`${BASE_URL}/performance`);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch performance metrics", error);
        throw error;
    }
};

export const getActivityChart = async () => {
    try {
        const response = await apiClient.get(`${BASE_URL}/activity`);
        return response.data;
    } catch (error) {
        console.error("Failed to fetch activity chart", error);
        return []; // Return empty on fail to prevent UI crash
    }
};
