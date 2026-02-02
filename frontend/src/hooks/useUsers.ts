import { useState, useCallback } from 'react';
import { usersService } from '../services/users';
import { User, UserRole } from '../types';
import { MOCK_USERS } from '../data/mockData';

interface CreateUserData {
  name: string;
  email: string;
  password?: string;
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
      // Ensure data is an array, fallback to mock data
      const userList = Array.isArray(data) && data.length > 0 ? data : MOCK_USERS;
      setUsers(userList);
      return userList;
    } catch (error) {
      console.error('Failed to load users:', error);
      // Use mock data on error for showcase mode
      setUsers(MOCK_USERS);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create user via admin endpoint (password auto-generated if not provided)
  const createUser = useCallback(async (userData: CreateUserData) => {
    // Optimistic update: Add temporary user to state immediately
    const tempUser: User = {
      id: `temp-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      createdAt: new Date().toISOString(),
    };
    
    // Add to state immediately for instant UI update
    setUsers((prevUsers) => {
      // Avoid duplicates
      const exists = prevUsers.some(u => u.email === userData.email);
      if (exists) return prevUsers;
      return [...prevUsers, tempUser];
    });
    
    try {
      const newUser = await usersService.create({
        name: userData.name,
        email: userData.email,
        role: userData.role,
        // Password is optional - backend will auto-generate if not provided
        ...(userData.password && { password: userData.password }),
      });
      
      // Replace temp user with real user from server
      setUsers((prevUsers) => {
        return prevUsers.map(u => u.id === tempUser.id ? newUser : u);
      });
      
      // Refetch users list to ensure we have the latest data
      await loadUsers();
      
      return newUser;
    } catch (error) {
      // On error, remove the optimistic update
      setUsers((prevUsers) => {
        return prevUsers.filter(u => u.id !== tempUser.id);
      });
      throw error;
    }
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
    createUser,
    updateUser,
    handleDelete,
  };
}
