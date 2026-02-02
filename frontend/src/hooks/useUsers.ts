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
      const rawUserList = Array.isArray(data) && data.length > 0 ? data : MOCK_USERS;
      
      // Sanitize all user objects to ensure all fields are strings
      const userList: User[] = rawUserList.map((user, index) => ({
        id: String(user?.id ?? `user-${index}`),
        name: String(user?.name ?? 'Unknown'),
        email: String(user?.email ?? 'No email'),
        role: String(user?.role ?? 'user') as UserRole,
        createdAt: user?.createdAt ? String(user.createdAt) : new Date().toISOString(),
      }));
      
      console.log('[useUsers] Users loaded from API, count:', userList.length);
      console.log('[useUsers] Sanitized user list:', userList);
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
    // Ensure all fields are strings to prevent React Error #310
    const tempUser: User = {
      id: String(`temp-${Date.now()}`),
      name: String(userData.name ?? ''),
      email: String(userData.email ?? ''),
      role: String(userData.role ?? 'user') as UserRole,
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
      const response = await usersService.create({
        name: userData.name,
        email: userData.email,
        role: userData.role,
        // Password is optional - backend will auto-generate if not provided
        ...(userData.password && { password: userData.password }),
      });
      
      // Ensure we have the user object, not the entire response
      // usersService.create should return User, but sanitize to be safe
      const newUser: User = response && typeof response === 'object' && 'id' in response
        ? {
            id: String(response.id ?? ''),
            name: String(response.name ?? ''),
            email: String(response.email ?? ''),
            role: String(response.role ?? 'user') as UserRole,
            createdAt: response.createdAt ? String(response.createdAt) : new Date().toISOString(),
          }
        : response as User;
      
      console.log('[useUsers] User created via API, received:', newUser);
      console.log('[useUsers] Sanitized user object:', newUser);
      
      // Replace temp user with real user from server (only add user object, not response)
      setUsers((prevUsers) => {
        const updated = prevUsers.map(u => u.id === tempUser.id ? newUser : u);
        console.log('[useUsers] Replaced temp user with real user, count:', updated.length);
        console.log('[useUsers] Updated users array:', updated);
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
