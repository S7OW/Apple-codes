import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../../../store/useStore';

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setUser = useStore((state) => state.setUser);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const sessionId = searchParams.get('sessionId');
        const errorParam = searchParams.get('error');

        if (errorParam) {
          setError('Authentication failed. Please try again.');
          setProcessing(false);
          setTimeout(() => navigate('/auth/signin'), 3000);
          return;
        }

        if (!sessionId) {
          setError('No session ID received from authentication provider.');
          setProcessing(false);
          setTimeout(() => navigate('/auth/signin'), 3000);
          return;
        }

        // Call backend Edge Function to capture Bawabah session
        const response = await fetch(
          `https://kweuhmazeiehftxvxabx.supabase.co/functions/v1/bawabah-callback?sessionId=${sessionId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          let errorMessage = 'Failed to authenticate';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = `Server error: ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();

        if (!data.loggedIn || !data.user) {
          throw new Error('Invalid response from authentication server');
        }

        // Store user data in localStorage (simulating Supabase session)
        const userId = data.user.id;
        const userEmail = data.user.email;
        const userName = data.user.name || userEmail.split('@')[0];

        localStorage.setItem('bawabah_user', JSON.stringify({
          id: userId,
          email: userEmail,
          full_name: userName,
          provider: data.user.provider || 'bawabah',
        }));

        const token = btoa(JSON.stringify({
          sub: userId,
          email: userEmail,
          user_metadata: {
            full_name: userName,
            provider: data.user.provider,
          },
          aud: 'authenticated',
          role: 'authenticated',
          exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
        }));

        localStorage.setItem('bawabah_token', token);
        localStorage.setItem('bawabah_auth_time', Date.now().toString());

        // Update global store
        setUser({
          id: userId,
          email: userEmail,
          full_name: userName,
        });

        // Redirect to dashboard
        navigate('/dashboard');
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setProcessing(false);
        setTimeout(() => navigate('/auth/signin'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center">
        {processing ? (
          <>
            <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 border-t-black dark:border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2 dark:text-white">Completing sign in...</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we set up your account
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-error-warning-line text-3xl text-red-600 dark:text-red-400"></i>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-red-600 dark:text-red-400">
              Authentication Error
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Redirecting to sign in page...
            </p>
          </>
        )}
      </div>
    </div>
  );
}