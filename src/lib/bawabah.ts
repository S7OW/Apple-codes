const BAWABAH_BASE_URL = 'https://api.bawabah.app';
const BAWABAH_APP_ID = 'mREft20T';
const BAWABAH_APP_SECRET = '3B3MZcdq31RTc82KA91ypB9m2l3SplTlffloMPApBpc';
const REDIRECT_URI = 'https://kmwmhe.readdy.co/auth/callback';

export interface BawabahUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: 'google' | 'apple';
}

export const bawabahAuth = {
  signInWithGoogle: () => {
    const authUrl = new URL(`${BAWABAH_BASE_URL}/oauth/authorize`);
    authUrl.searchParams.set('app_id', BAWABAH_APP_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('provider', 'google');
    authUrl.searchParams.set('scope', 'email profile');
    window.location.href = authUrl.toString();
  },

  signInWithApple: () => {
    const authUrl = new URL(`${BAWABAH_BASE_URL}/oauth/authorize`);
    authUrl.searchParams.set('app_id', BAWABAH_APP_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('provider', 'apple');
    authUrl.searchParams.set('scope', 'email name');
    window.location.href = authUrl.toString();
  },

  handleCallback: async (code: string): Promise<BawabahUser> => {
    const response = await fetch(`${BAWABAH_BASE_URL}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: BAWABAH_APP_ID,
        app_secret: BAWABAH_APP_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange authorization code');
    }

    const data = await response.json();
    return data.user;
  },

  createSupabaseSession: async (bawabahUser: BawabahUser) => {
    const userId = crypto.randomUUID();

    localStorage.setItem('bawabah_user', JSON.stringify({
      id: userId,
      email: bawabahUser.email,
      full_name: bawabahUser.name,
      picture: bawabahUser.picture,
      provider: bawabahUser.provider,
    }));

    const token = btoa(JSON.stringify({
      sub: userId,
      email: bawabahUser.email,
      user_metadata: {
        full_name: bawabahUser.name,
        picture: bawabahUser.picture,
        provider: bawabahUser.provider,
      },
      aud: 'authenticated',
      role: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
    }));

    localStorage.setItem('bawabah_token', token);
    localStorage.setItem('bawabah_auth_time', Date.now().toString());

    return {
      user: {
        id: userId,
        email: bawabahUser.email,
        user_metadata: {
          full_name: bawabahUser.name,
          picture: bawabahUser.picture,
        },
      },
      session: {
        access_token: token,
        user: { id: userId, email: bawabahUser.email },
      },
    };
  },

  getSession: () => {
    const userStr = localStorage.getItem('bawabah_user');
    const token = localStorage.getItem('bawabah_token');
    const authTime = localStorage.getItem('bawabah_auth_time');

    if (!userStr || !token || !authTime) return null;

    const sessionAge = Date.now() - parseInt(authTime, 10);
    if (sessionAge > 24 * 60 * 60 * 1000) {
      bawabahAuth.signOut();
      return null;
    }

    const user = JSON.parse(userStr);
    return { user, session: { access_token: token, user } };
  },

  signOut: () => {
    localStorage.removeItem('bawabah_user');
    localStorage.removeItem('bawabah_token');
    localStorage.removeItem('bawabah_auth_time');
  },

  isAuthenticated: (): boolean => bawabahAuth.getSession() !== null,
};
