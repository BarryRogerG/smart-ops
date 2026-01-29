





import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  // Autocomplete control: 
  // - Email: always allow autofill (users should be able to autofill email even after error)
  // - Password: disable only when there's an error (to prevent password save prompt on failed login)
  const autoCompleteEmail = 'email'; // Always allow email autofill
  const autoCompletePassword = error ? 'off' : 'current-password'; // Only disable password autocomplete on error

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
            data-lpignore="false"
          />

          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={autoCompletePassword}
            required
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Password"
            data-lpignore="false"
          />

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