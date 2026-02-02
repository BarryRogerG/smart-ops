import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useUsers } from '../hooks/useUsers';
import { User } from '../types';
import { Layout } from '../components/Layout';
import { UserTable } from '../components/UserTable';
import { UserForm } from '../components/UserForm';

export function Users() {
  const { user: currentUser } = useAuth();
  const { users, isLoading, loadUsers, createUser, updateUser, handleDelete } = useUsers();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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
    password: string;
  }) => {
    setIsSubmitting(true);
    try {
      if (isCreating) {
        await createUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role as 'user' | 'manager' | 'admin',
        });
        toast.success('User created successfully');
      } else if (editingUser) {
        await updateUser(editingUser.id, {
          name: formData.name,
          email: formData.email,
          role: formData.role as 'user' | 'manager' | 'admin',
          password: formData.password || undefined,
        });
        toast.success('User updated successfully');
      }
      setIsCreating(false);
      setEditingUser(null);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
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
      await handleDelete(userId);
      toast.success('User deleted successfully');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Failed to delete user');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8 text-center text-gray-500">Loading showcase data...</div>
      </Layout>
    );
  }

  // Ensure users is always an array, default to empty array if undefined
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
