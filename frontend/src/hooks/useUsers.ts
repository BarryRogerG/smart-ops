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
      console.log('[useUsers] Loading users from API...');
      const data = await usersService.getAll();
      // Ensure data is an array, fallback to mock data
      const userList = Array.isArray(data) && data.length > 0 ? data : MOCK_USERS;
      console.log('[useUsers] Users loaded from API, count:', userList.length);
      setUsers(userList);
      console.log('[useUsers] Users state updated, current state:', userList);
      return userList;
    } catch (error) {
      console.error('[useUsers] Failed to load users:', error);
      // Use mock data on error for showcase mode
      console.log('[useUsers] Using mock data fallback, count:', MOCK_USERS.length);
      setUsers(MOCK_USERS);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create user via admin endpoint (password auto-generated if not provided)
  const createUser = useCallback(async (userData: CreateUserData) => {
    // Optimistic update: Add temporary user to state immediately for instant UI
    const tempUser: User = {
      id: `temp-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      createdAt: new Date().toISOString(),
    };
    
    console.log('[useUsers] Optimistic update - adding temp user:', tempUser);
    
    // Add to state immediately for instant UI update (showcase mode)
    setUsers((prevUsers) => {
      // Avoid duplicates
      const exists = prevUsers.some(u => u.email === userData.email);
      if (exists) {
        console.log('[useUsers] User with email already exists, skipping optimistic update');
        return prevUsers;
      }
      const updated = [...prevUsers, tempUser];
      console.log('[useUsers] Optimistic update applied, new count:', updated.length);
      return updated;
    });
    
    try {
      // API call to create user (returns status 201 on success)
      const newUser = await usersService.create({
        name: userData.name,
        email: userData.email,
        role: userData.role,
        // Password is optional - backend will auto-generate if not provided
        ...(userData.password && { password: userData.password }),
      });
      
      console.log('[useUsers] User created via API, received:', newUser);
      
      // Replace temp user with real user from server
      setUsers((prevUsers) => {
        const updated = prevUsers.map(u => u.id === tempUser.id ? newUser : u);
        console.log('[useUsers] Replaced temp user with real user, count:', updated.length);
        return updated;
      });
      
      // Refetch users list to ensure we have the latest data from server
      const refreshedUsers = await loadUsers();
      console.log('[useUsers] Users list refreshed after creation, count:', refreshedUsers?.length ?? 0);
      
      return newUser;
    } catch (error) {
      console.error('[useUsers] Error creating user, removing optimistic update:', error);
      // On error, remove the optimistic update
      setUsers((prevUsers) => {
        const updated = prevUsers.filter(u => u.id !== tempUser.id);
        console.log('[useUsers] Removed temp user after error, count:', updated.length);
        return updated;
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
