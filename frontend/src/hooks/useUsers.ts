import { useState, useCallback } from 'react';
import { usersService } from '../services/users';
import api from '../utils/api';
import { User, UserRole } from '../types';

interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

interface UpdateUserData {
  name: string;
  email: string;
  role: UserRole;
  password?: string;
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    try {
      const data = await usersService.getAll();
      // Ensure data is an array, default to empty array if undefined
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load users:', error);
      // On error, set empty array to prevent crashes
      setUsers([]);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCreate = useCallback(async (userData: CreateUserData) => {
    await api.post('/auth/register', {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role,
    });
    await loadUsers();
  }, [loadUsers]);

  // 1. Cleaner Create
const createUser = useCallback(async (userData: CreateUserData) => {
  await api.post('/auth/register', userData);
  await loadUsers();
}, [loadUsers]);

// 2. Cleaner Update
const updateUser = useCallback(async (userId: string, userData: UpdateUserData) => {
  // Use a clean object instead of 'any'
  const payload = { ...userData };
  if (!payload.password) delete payload.password; // Don't send empty password strings
  
  await usersService.update(userId, payload);
  await loadUsers();
}, [loadUsers]);

  const handleDelete = useCallback(async (userId: string) => {
    await usersService.delete(userId);
    await loadUsers();
  }, [loadUsers]);

  return {
    users,
    isLoading,
    loadUsers,
    handleCreate,
    createUser,
    updateUser,
    handleDelete,
  };
}
