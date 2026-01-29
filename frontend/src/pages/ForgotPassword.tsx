import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../utils/api';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email) {
      setError('Email is required');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
      toast.success('If an account with that email exists, a password reset link has been sent.');
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to send reset email. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-6">
        <h2 className="text-center text-3xl font-bold text-gray-900">
          Reset your password
        </h2>

        <p className="text-center text-gray-600 text-sm">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="bg-red-50 border-2 border-red-500 text-red-800 px-3 py-2 rounded-md text-center w-full"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="alert"
            aria-live="assertive"
            className="bg-green-50 border-2 border-green-500 text-green-800 px-3 py-2 rounded-md text-center w-full"
          >
            If an account with that email exists, a password reset link has been sent to your email.
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4 w-full" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="w-full px-3 py-2 border rounded-md"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 bg-indigo-600 text-white rounded-md disabled:opacity-50"
            >
              {isLoading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <div className="text-center text-sm">
          <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
