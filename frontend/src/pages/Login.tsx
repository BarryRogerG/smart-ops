





import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Restore error from sessionStorage on mount only if it was set recently (within last 5 seconds)
  useEffect(() => {
    const persistedError = sessionStorage.getItem('loginError');
    const errorTimestamp = sessionStorage.getItem('loginErrorTimestamp');
    
    if (persistedError && errorTimestamp) {
      const timestamp = parseInt(errorTimestamp, 10);
      const now = Date.now();
      // Only restore if error was set within last 5 seconds (to handle remounts during login)
      if (now - timestamp < 5000) {
        setError(persistedError);
      } else {
        // Clear stale error
        sessionStorage.removeItem('loginError');
        sessionStorage.removeItem('loginErrorTimestamp');
      }
    }
  }, []);

  // Persist error to sessionStorage whenever it changes
  useEffect(() => {
    if (error) {
      sessionStorage.setItem('loginError', error);
      sessionStorage.setItem('loginErrorTimestamp', Date.now().toString());
    } else {
      sessionStorage.removeItem('loginError');
      sessionStorage.removeItem('loginErrorTimestamp');
    }
  }, [error]);

  // Use proper autocomplete values to allow legitimate autofill but prevent irrelevant suggestions
  const autoCompleteEmail = 'username'; // Use 'username' for login forms (standard)
  const autoCompletePassword = 'current-password'; // Standard for login password fields

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('=== LOGIN FORM SUBMITTED ===');
    console.log('Email:', email);
    console.log('Password length:', password.length);

    // Clear error and update autocomplete before submitting
    setError(null);
    sessionStorage.removeItem('loginError');
    sessionStorage.removeItem('loginErrorTimestamp');
    setIsLoading(true);

    console.log('Calling login function...');

    try {
      const result = await login(email, password);
      console.log('Login successful:', result);
      // Clear any persisted error on success
      sessionStorage.removeItem('loginError');
      sessionStorage.removeItem('loginErrorTimestamp');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('=== LOGIN ERROR CAUGHT ===');
      console.error('Error object:', err);
      console.error('Error response:', err?.response);
      console.error('Error message:', err?.message);
      console.error('Error code:', err?.code);
      
      const errorMessage = getLoginErrorMessage(err);
      console.log('Setting error message:', errorMessage);
      
      // Set error immediately and persist to sessionStorage with timestamp
      setError(errorMessage);
      sessionStorage.setItem('loginError', errorMessage);
      sessionStorage.setItem('loginErrorTimestamp', Date.now().toString());
      
      // Force a re-render to ensure error is displayed (in case component remounted)
      setTimeout(() => {
        const persistedError = sessionStorage.getItem('loginError');
        if (persistedError) {
          setError(persistedError);
        }
      }, 50);
    } finally {
      setIsLoading(false);
      console.log('Login attempt finished');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-6">
        <h2 className="text-center text-3xl font-bold text-gray-900">
          Sign in to SmartOps
        </h2>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="bg-red-50 border-2 border-red-500 text-red-800 px-3 py-2 rounded-md text-center w-full"
            style={{ boxSizing: 'border-box' }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 w-full" noValidate>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete={autoCompleteEmail}
            required
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Email"
          />

          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={autoCompletePassword}
              required
              className="w-full px-3 py-2 pr-10 border rounded-md"
              placeholder="Password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={0}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Eye className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-indigo-600 text-white rounded-md disabled:opacity-50"
          >
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-indigo-600 hover:text-indigo-800 font-medium">
              Sign Up
            </Link>
          </p>
          <p className="text-sm">
            <Link to="/forgot-password" className="text-indigo-600 hover:text-indigo-800 font-medium">
              Forgot Password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function getLoginErrorMessage(err: any): string {
  if (err?.response?.data?.error) return err.response.data.error;
  if (err?.code === 'ERR_NETWORK') return 'Cannot reach server.';
  if (err?.message) return err.message;
  return 'Login failed. Please try again.';
}