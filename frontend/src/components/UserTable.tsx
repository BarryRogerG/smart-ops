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
            // Force key to be a string
            const rowKey = String(user?.id || user?.email || index);
            
            // Format date to MM/DD/YYYY
            let formattedDate = '-';
            if (user?.createdAt) {
              try {
                const date = new Date(user.createdAt);
                if (!isNaN(date.getTime())) {
                  formattedDate = date.toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric',
                  });
                }
              } catch {
                formattedDate = '-';
              }
            }
            
            // Get role for badge styling
            const role = String(user?.role || 'user');
            const roleClass = 
              role === 'admin' || role === '"admin"'
                ? 'bg-red-100 text-red-800'
                : role === 'manager' || role === '"manager"'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800';
            
            return (
              <tr key={rowKey} className="hover:bg-gray-50">
                {/* Column 1: Name */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {String(user?.name || 'Unknown')}
                </td>
                
                {/* Column 2: Email */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {String(user?.email || 'No email')}
                </td>
                
                {/* Column 3: Role Badge */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${roleClass}`}>
                    {role}
                  </span>
                </td>
                
                {/* Column 4: Created Date (MM/DD/YYYY) */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formattedDate}
                </td>
                
                {/* Column 5: Actions */}
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
