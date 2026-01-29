import api from '../utils/api';
import { User } from '../types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('authService.login called');
    console.log('API base URL:', import.meta.env.VITE_API_URL || 'http://localhost:3001/api');
    console.log('Full URL will be:', `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/login`);
    console.log('Request payload:', { email: credentials.email, password: '***' });
    
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      console.log('API response received:', response);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data;
    } catch (error: any) {
      console.error('authService.login API error:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        response: error?.response,
        status: error?.response?.status,
        data: error?.response?.data,
      });
      throw error;
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<{ user: User }>('/auth/me');
    return response.data.user;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/forgot-password', { email });
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getStoredUser(): User | null {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr || userStr.trim() === '') {
        return null;
      }
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing stored user:', error);
      // Clear invalid data
      localStorage.removeItem('user');
      return null;
    }
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
