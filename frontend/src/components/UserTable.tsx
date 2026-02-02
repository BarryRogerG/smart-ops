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
            // SURGICAL ISOLATION: Start with just the index to verify the table structure works
            // Force key to be a string
            const rowKey = String(user?.id || user?.email || index);
            
            return (
              <tr key={rowKey} className="hover:bg-gray-50">
                {/* Step 1: Basic test - just show index */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  User {index}
                </td>
                
                {/* Step 2: Add name back with type check */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {typeof user?.name === 'string' ? user.name : 'Invalid Name'}
                </td>
                
                {/* Step 3: Add email with type check */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {typeof user?.email === 'string' ? user.email : 'Invalid Email'}
                </td>
                
                {/* Step 4: Role - plain span, no badge component, force to string */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800">
                    {String(user?.role || '')}
                  </span>
                </td>
                
                {/* Step 5: Created date - simple string conversion */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user?.createdAt ? String(user.createdAt) : '-'}
                </td>
                
                {/* Step 6: Actions - simplified */}
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => user && onEdit(user)}
                    className="text-indigo-600 hover:text-indigo-800 mr-4"
                  >
                    Edit
                  </button>
                  {rowKey && rowKey !== String(currentUserId || '') && (
                    <button
                      onClick={() => rowKey && onDelete(rowKey)}
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
