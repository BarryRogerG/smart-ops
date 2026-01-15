import api from '../utils/api';
import { DashboardData } from '../types';

export const dashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    const response = await api.get<DashboardData>('/dashboard');
    return response.data;
  },
};
