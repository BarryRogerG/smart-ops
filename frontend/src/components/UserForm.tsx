import { useState, useEffect, useRef } from 'react';
import { User, UserRole } from '../types';
import { Button } from './Button';

interface UserFormProps {
  initialData: User | null;
  isCreating: boolean;
  isLoading?: boolean;
  onSubmit: (data: {
    name: string;
    email: string;
    role: UserRole;
    password?: string;
  }) => void;
  onCancel: () => void;
}

export function UserForm({ initialData, isCreating, isLoading = false, onSubmit, onCancel }: UserFormProps) {
  // Initialize form data from initialData or empty values
  const [formData, setFormData] = useState(() => ({
    name: '',
    email: '',
    role: 'user' as UserRole,
    password: '',
  }));

  // Track the previous initialData ID to avoid unnecessary updates
  const prevInitialDataId = useRef<string | undefined>(initialData?.id);

  // Update form data when initialData changes
  // Note: Using setState in effect is necessary here to sync form with prop changes
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    const currentId = initialData?.id;
    
    // Only update if the ID actually changed
    if (prevInitialDataId.current !== currentId) {
      prevInitialDataId.current = currentId;
      
      if (initialData) {
        // Editing mode - populate with user data
        setFormData({
          name: initialData.name,
          email: initialData.email,
          role: initialData.role,
          password: '',
        });
      } else if (isCreating) {
        // Creating mode - reset to empty
        setFormData({
          name: '',
          email: '',
          role: 'user',
          password: '',
        });
      }
    }
    
    // Reset form when switching to create mode
    if (isCreating && !initialData && prevInitialDataId.current !== undefined) {
      setFormData({
        name: '',
        email: '',
        role: 'user',
        password: '',
      });
      prevInitialDataId.current = undefined;
    }
  }, [initialData, isCreating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      email: '',
      role: 'user',
      password: '',
    });
    onCancel();
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {isCreating ? 'Create New User' : 'Edit User'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="user">User</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {!isCreating && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password (leave blank to keep current)
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        )}
        <div className="flex gap-4">
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
          >
            Save
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
