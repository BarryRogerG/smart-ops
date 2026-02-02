import api from '../utils/api';
import { User, UserRole } from '../types';

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: UserRole;
  password?: string;
}

export const usersService = {
  async getAll(): Promise<User[]> {
    const response = await api.get<{ users: User[] }>('/users');
    return response.data.users;
  },

  async getById(id: string): Promise<User> {
    const response = await api.get<{ user: User }>(`/users/${id}`);
    return response.data.user;
  },

  async create(data: { name: string; email: string; role: string; password?: string }): Promise<User> {
    const response = await api.post<{ user: User }>('/users', data);
    return response.data.user;
  },

  async update(id: string, data: UpdateUserData): Promise<User> {
    const response = await api.put<{ user: User }>(`/users/${id}`, data);
    return response.data.user;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};
