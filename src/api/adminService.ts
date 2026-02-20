import api from './axiosConfig';

export interface UserAdminResponseDTO {
    id: number;
    username: string;
    balance: number;
    role: string;
}

export interface UserCarStatsDTO {
    username: string;
    ownedCount: number;
    onSaleCount: number;
    waitingCount: number;
}

export const adminService = {
    getAllUsers: async (): Promise<UserAdminResponseDTO[]> => {
        const response = await api.get('/admin/users');
        return response.data;
    },

    updateUserRole: async (userId: number, newRole: string): Promise<string> => {
        const response = await api.patch('/admin/users/role', {
            userId,
            newRole
        });
        return response.data;
    },

    getUserCarStats: async (): Promise<UserCarStatsDTO[]> => {
        const response = await api.get('/admin/car-stats');
        return response.data;
    }
};