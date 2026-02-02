import { User } from '../types';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  currentUserId?: string;
}

export function UserTable({ users, onEdit, onDelete, currentUserId }: UserTableProps) {
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
            // Data sanitization: ensure all fields are strings
            const safeName = String(user?.name ?? 'Unknown');
            const safeEmail = String(user?.email ?? 'No email');
            const safeRole = String(user?.role ?? 'user');
            const safeId = String(user?.id ?? `temp-${index}`);
            
            return (
              <tr key={safeId} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {safeName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{safeEmail}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded ${
                      safeRole === 'admin'
                        ? 'bg-red-100 text-red-800'
                        : safeRole === 'manager'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {safeRole}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => user && onEdit(user)}
                    className="text-indigo-600 hover:text-indigo-800 mr-4"
                  >
                    Edit
                  </button>
                  {safeId && safeId !== String(currentUserId ?? '') && (
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
