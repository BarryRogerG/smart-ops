import { User } from '../types';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  currentUserId?: string;
}

export function UserTable({ users, onEdit, onDelete, currentUserId }: UserTableProps) {
  // Nuclear Sanitization: Convert ANY value to a safe string for rendering
  const safeRender = (val: unknown): string => {
    if (val === null || val === undefined) {
      return '';
    }
    // If it's an object, JSON stringify it (handles nested objects)
    if (typeof val === 'object') {
      try {
        return JSON.stringify(val);
      } catch {
        return '[Object]';
      }
    }
    // Otherwise, convert to string
    return String(val ?? '');
  };

  // Universal data guard with optional chaining and nullish coalescing
  const safeUsers = (users ?? []) || [];

  if ((safeUsers?.length ?? 0) === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <p className="text-gray-500">No users found</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {(safeUsers || []).map((user, index) => {
            // Nuclear sanitization: wrap every field in safeRender
            const safeName = safeRender(user?.name);
            const safeEmail = safeRender(user?.email);
            const safeRole = safeRender(user?.role);
            const safeId = safeRender(user?.id || user?.email || `user-${index}`);
            
            // Safe date formatting
            let safeCreatedDate = '-';
            if (user?.createdAt) {
              try {
                const dateValue = safeRender(user.createdAt);
                if (dateValue && dateValue !== '-') {
                  safeCreatedDate = new Date(dateValue).toLocaleDateString();
                }
              } catch {
                safeCreatedDate = '-';
              }
            }
            
            return (
              <tr key={safeId} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {safeName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{safeEmail}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded ${
                      safeRole === 'admin' || safeRole === '"admin"' || safeRole.includes('admin')
                        ? 'bg-red-100 text-red-800'
                        : safeRole === 'manager' || safeRole === '"manager"' || safeRole.includes('manager')
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {safeRole}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {safeCreatedDate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => user && onEdit(user)}
                    className="text-indigo-600 hover:text-indigo-800 mr-4"
                  >
                    Edit
                  </button>
                  {safeId && safeId !== safeRender(currentUserId) && (
                    <button
                      onClick={() => safeId && onDelete(safeId)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
