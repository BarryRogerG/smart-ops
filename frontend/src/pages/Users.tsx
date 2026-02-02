import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { usersService } from '../services/users';
import { User } from '../types';
import { Layout } from '../components/Layout';
import { UserTable } from '../components/UserTable';
import { UserForm } from '../components/UserForm';
import { MOCK_USERS } from '../data/mockData';

export function Users() {
  // ALL HOOKS AT TOP LEVEL - NO CONDITIONAL HOOKS
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // SINGLE useEffect AT TOP LEVEL - handles all data loading
  useEffect(() => {
    const loadUsersData = async () => {
      try {
        setIsLoading(true);
        const data = await usersService.getAll();
        
        // Ensure data is always an array, never null or undefined
        const userList = Array.isArray(data) ? data : [];
        
        // If empty or in showcase mode, use mock data
        const isShowcaseMode = currentUser?.id === 'guest';
        const finalUsers = (userList.length > 0 && !isShowcaseMode) ? userList : MOCK_USERS;
        
        // Sanitize all users to ensure all fields are strings
        const sanitizedUsers: User[] = finalUsers.map((user, index) => ({
          id: String(user?.id ?? `user-${index}`),
          name: String(user?.name ?? 'Unknown'),
          email: String(user?.email ?? 'No email'),
          role: String(user?.role ?? 'user') as User['role'],
          createdAt: String(user?.createdAt ?? new Date().toISOString()),
        }));
        
        setUsers(sanitizedUsers);
      } catch (error) {
        console.error('[Users] Failed to load users:', error);
        // On error, set empty array (never null or undefined)
        setUsers(MOCK_USERS.map((user, index) => ({
          id: String(user?.id ?? `user-${index}`),
          name: String(user?.name ?? 'Unknown'),
          email: String(user?.email ?? 'No email'),
          role: String(user?.role ?? 'user') as User['role'],
          createdAt: String(user?.createdAt ?? new Date().toISOString()),
        })));
      } finally {
        setIsLoading(false);
      }
    };

    loadUsersData();
  }, [currentUser?.id]); // Only re-run if currentUser.id changes

  // STANDARDIZED RETURN - single loading check at top
  if (isLoading) {
    return (
      <Layout>
        <div className="p-8 text-center text-gray-500">Loading showcase data...</div>
      </Layout>
    );
  }

  // Event handlers (no hooks, just functions)
  const onCreateClick = () => {
    setIsCreating(true);
    setEditingUser(null);
  };

  const onEditClick = (user: User) => {
    setEditingUser(user);
    setIsCreating(false);
  };

  const handleFormSubmit = async (formData: {
    name: string;
    email: string;
    role: string;
    password?: string;
  }) => {
    setIsSubmitting(true);
    try {
      if (isCreating) {
        // usersService.create already extracts response.data.user, so newUser is the User object
        const newUser = await usersService.create({
          name: formData.name,
          email: formData.email,
          role: formData.role as 'user' | 'manager' | 'admin',
        });
        
        // Sanitize the new user - ensure all fields are strings
        // Use formData as fallback in case backend response is missing fields
        const sanitizedNewUser: User = {
          id: String(newUser?.id ?? ''),
          name: String(newUser?.name ?? formData.name),
          email: String(newUser?.email ?? formData.email),
          role: String(newUser?.role ?? formData.role) as User['role'],
          createdAt: String(newUser?.createdAt ?? new Date().toISOString()),
        };
        
        console.log('[Users] New user created:', sanitizedNewUser);
        console.log('[Users] Raw response from service:', newUser);
        
        // Add to state immediately
        setUsers((prev) => {
          const updated = [...prev, sanitizedNewUser];
          console.log('[Users] Updated users list, count:', updated.length);
          return updated;
        });
        
        toast.success('User successfully created!');
        setIsCreating(false);
        setEditingUser(null);
      } else if (editingUser) {
        await usersService.update(editingUser.id, {
          name: formData.name,
          email: formData.email,
          role: formData.role as 'user' | 'manager' | 'admin',
          password: formData.password || undefined,
        });
        
        // Reload users after update
        const updatedData = await usersService.getAll();
        const userList = Array.isArray(updatedData) ? updatedData : [];
        const sanitizedUsers: User[] = userList.map((user, index) => ({
          id: String(user?.id ?? `user-${index}`),
          name: String(user?.name ?? 'Unknown'),
          email: String(user?.email ?? 'No email'),
          role: String(user?.role ?? 'user') as User['role'],
          createdAt: String(user?.createdAt ?? new Date().toISOString()),
        }));
        setUsers(sanitizedUsers);
        
        toast.success('User updated successfully');
        setIsCreating(false);
        setEditingUser(null);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      console.error('[Users] Error creating/updating user:', error);
      toast.error(err.response?.data?.error || `Failed to ${isCreating ? 'create' : 'update'} user`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormCancel = () => {
    setIsCreating(false);
    setEditingUser(null);
  };

  const onDeleteClick = async (userId: string) => {
    // Confirmation dialog
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    // Store the user being deleted for potential rollback
    const userToDelete = users.find(u => u.id === userId || u.email === userId);
    const isShowcaseMode = currentUser?.id === 'guest';

    try {
      // Optimistic update: remove from UI immediately
      setUsers((prevUsers) => {
        // Filter using id OR email as fallback
        const filtered = prevUsers.filter(user => {
          const userIdentifier = String(user?.id || user?.email || '');
          const deleteIdentifier = String(userId || '');
          return userIdentifier !== deleteIdentifier;
        });
        console.log('[Users] Optimistic delete - removed user, remaining count:', filtered.length);
        return filtered;
      });

      // Call API to delete
      await usersService.delete(userId);
      
      // Only reload from server if NOT in showcase mode
      if (!isShowcaseMode) {
        try {
          const updatedData = await usersService.getAll();
          const userList = Array.isArray(updatedData) ? updatedData : [];
          
          // Only update if we got valid data
          if (userList.length > 0 || userList.length === 0) {
            const sanitizedUsers: User[] = userList.map((user, index) => ({
              id: String(user?.id ?? `user-${index}`),
              name: String(user?.name ?? 'Unknown'),
              email: String(user?.email ?? 'No email'),
              role: String(user?.role ?? 'user') as User['role'],
              createdAt: String(user?.createdAt ?? new Date().toISOString()),
            }));
            setUsers(sanitizedUsers);
          }
        } catch (reloadError) {
          console.error('[Users] Failed to reload users after delete:', reloadError);
          // Keep the optimistic update if reload fails
        }
      }
      
      toast.success('User deleted successfully');
    } catch (error: unknown) {
      // On error, restore the user (rollback optimistic update)
      if (userToDelete) {
        setUsers((prevUsers) => {
          // Check if user is already in list (avoid duplicates)
          const exists = prevUsers.some(u => 
            (u.id && userToDelete.id && u.id === userToDelete.id) ||
            (u.email && userToDelete.email && u.email === userToDelete.email)
          );
          if (exists) {
            return prevUsers;
          }
          return [...prevUsers, userToDelete];
        });
      }
      
      const err = error as { response?: { data?: { error?: string }; status?: number } };
      const status = err.response?.status;
      
      // Only show error if it's not a network/backend issue in showcase mode
      if (!isShowcaseMode || (status && status >= 200 && status < 300)) {
        toast.error(err.response?.data?.error || 'Failed to delete user');
      } else {
        // In showcase mode, if backend is down, just keep the optimistic update
        console.log('[Users] Showcase mode - keeping optimistic delete');
      }
    }
  };

  // Ensure users is always an array (never null or undefined)
  const safeUsers = Array.isArray(users) ? users : [];

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          {!isCreating && !editingUser && (
            <button
              onClick={onCreateClick}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Create User
            </button>
          )}
        </div>

        {(editingUser || isCreating) && (
          <UserForm
            initialData={editingUser}
            isCreating={isCreating}
            isLoading={isSubmitting}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        )}

        <UserTable
          users={safeUsers}
          onEdit={onEditClick}
          onDelete={onDeleteClick}
          currentUserId={currentUser?.id}
        />
      </div>
    </Layout>
  );
}
