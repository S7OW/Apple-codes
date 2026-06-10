import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../../../components/base/Input';
import Button from '../../../components/base/Button';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if already logged in as admin
    const adminSession = localStorage.getItem('admin_session');
    if (adminSession) {
      navigate('/dashboard/admin');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Admin credentials check (hardcoded for now, can be moved to env)
    const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME || 'admin';
    const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Store admin session
      const sessionData = {
        username,
        loginTime: new Date().toISOString(),
      };
      
      if (rememberMe) {
        localStorage.setItem('admin_session', JSON.stringify(sessionData));
      } else {
        sessionStorage.setItem('admin_session', JSON.stringify(sessionData));
      }

      navigate('/dashboard/admin');
    } else {
      setError('Invalid username or password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-2xl mb-4">
              <i className="ri-admin-line text-3xl text-white"></i>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
            <p className="text-gray-600 text-sm">Sign in to manage your store</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <i className="ri-error-warning-line text-red-600 text-xl flex-shrink-0 mt-0.5"></i>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              type="text"
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
            
            <Input
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-black bg-gray-100 border-gray-300 rounded focus:ring-black focus:ring-2 cursor-pointer"
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700 cursor-pointer select-none">
                Remember me
              </label>
            </div>

            {/* Submit Button */}
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="ri-loader-4-line animate-spin"></i>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <i className="ri-login-box-line"></i>
                  Sign In
                </span>
              )}
            </Button>
          </form>

          {/* Footer Note */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-xs text-gray-500">
              <i className="ri-shield-check-line mr-1"></i>
              Secure admin access only
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Default credentials: <span className="font-mono bg-white px-2 py-1 rounded">admin / admin123</span>
        </p>
      </div>
    </div>
  );
}