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
        const response = await usersService.create({
          name: formData.name,
          email: formData.email,
          role: formData.role as 'user' | 'manager' | 'admin',
        });
        
        // usersService.create returns response.data.user, so response is already the User object
        // But ensure we handle both cases: direct User or { user: User }
        const userData = (response as any)?.user || response;
        
        // Sanitize the new user - ensure all fields are strings
        const sanitizedNewUser: User = {
          id: String(userData?.id ?? ''),
          name: String(userData?.name ?? formData.name),
          email: String(userData?.email ?? formData.email),
          role: String(userData?.role ?? formData.role) as User['role'],
          createdAt: String(userData?.createdAt ?? new Date().toISOString()),
        };
        
        console.log('[Users] New user created:', sanitizedNewUser);
        
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
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await usersService.delete(userId);
      
      // Reload users after delete
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
      
      toast.success('User deleted successfully');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Failed to delete user');
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
