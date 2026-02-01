import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { UserCog } from 'lucide-react';

export function DevelopmentRoleToggle() {
  const { user, toggleRole } = useAuth();

  // Only show in development mode
  if (import.meta.env.MODE !== 'development') {
    return null;
  }

  // Don't show if user is not logged in
  if (!user) {
    return null;
  }

  const handleToggle = () => {
    if (toggleRole) {
      toggleRole();
    }
  };

  const currentRole = user.role;
  const nextRole: UserRole = currentRole === 'admin' ? 'user' : 'admin';

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      <div className="bg-yellow-100 border-2 border-yellow-500 text-yellow-900 px-3 py-1 rounded-md text-xs font-semibold shadow-md">
        DEV: {currentRole.toUpperCase()} → {nextRole.toUpperCase()}
      </div>
      <button
        onClick={handleToggle}
        className="bg-yellow-500 hover:bg-yellow-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
        title={`Toggle role: ${currentRole} → ${nextRole}`}
        aria-label={`Toggle role from ${currentRole} to ${nextRole}`}
      >
        <UserCog className="h-5 w-5" />
        <span className="sr-only">Toggle Role ({currentRole} → {nextRole})</span>
      </button>
    </div>
  );
}
