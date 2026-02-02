import { User } from '../types';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  currentUserId?: string;
}

// Bulletproof data extraction: handles nested objects and ensures string output
function extractStringValue(value: unknown, fallback: string = ''): string {
  if (value === null || value === undefined) {
    return fallback;
  }
  
  // If it's already a string, return it
  if (typeof value === 'string') {
    return value;
  }
  
  // If it's a number, convert to string
  if (typeof value === 'number') {
    return String(value);
  }
  
  // If it's an object, try to extract nested values
  if (typeof value === 'object') {
    // Try common nested object patterns
    if ('label' in value && typeof value.label === 'string') {
      return value.label;
    }
    if ('value' in value && typeof value.value === 'string') {
      return value.value;
    }
    if ('name' in value && typeof value.name === 'string') {
      return value.name;
    }
    if ('text' in value && typeof value.text === 'string') {
      return value.text;
    }
    // Last resort: JSON stringify (but limit length)
    try {
      const str = JSON.stringify(value);
      return str.length > 50 ? str.substring(0, 50) + '...' : str;
    } catch {
      return fallback;
    }
  }
  
  // Fallback: convert to string
  return String(value);
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
            // Bulletproof data extraction with object guards
            const rawName = user?.name;
            const rawEmail = user?.email;
            const rawRole = user?.role;
            const rawId = user?.id;
            const rawCreatedAt = user?.createdAt;
            
            // Extract string values (handles nested objects)
            const safeName = extractStringValue(rawName, 'Unknown');
            const safeEmail = extractStringValue(rawEmail, 'No email');
            const safeRole = extractStringValue(rawRole, 'user');
            const safeId = extractStringValue(rawId, `temp-${index}`);
            
            // Ensure all are strings (double safety)
            const finalName = String(safeName || '');
            const finalEmail = String(safeEmail || '');
            const finalRole = String(safeRole || 'user');
            const finalId = String(safeId || user?.email || `user-${index}`);
            
            // Safe date formatting
            let safeCreatedDate = '-';
            if (rawCreatedAt) {
              try {
                const dateValue = typeof rawCreatedAt === 'string' ? rawCreatedAt : String(rawCreatedAt);
                safeCreatedDate = new Date(dateValue).toLocaleDateString();
              } catch {
                safeCreatedDate = '-';
              }
            }
            
            return (
              <tr key={finalId} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {finalName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{finalEmail}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded ${
                      finalRole === 'admin'
                        ? 'bg-red-100 text-red-800'
                        : finalRole === 'manager'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {finalRole}
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
                  {finalId && finalId !== String(currentUserId || '') && (
                    <button
                      onClick={() => finalId && onDelete(finalId)}
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
