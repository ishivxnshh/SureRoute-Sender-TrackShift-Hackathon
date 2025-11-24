import querystring from 'querystring';

// This file contains small, focused helpers for the Google OAuth 2.0 flow.
// It does NOT store Google access / refresh tokens – we only use the ID token
// once to learn who the user is, then we switch over to SureRoute's own JWT.

const GOOGLE_AUTH_BASE = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

export function getGoogleAuthUrl(state) {
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_REDIRECT_URI,
  } = process.env;

  const params = {
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
    state,
  };

  return `${GOOGLE_AUTH_BASE}?${querystring.stringify(params)}`;
}

export async function exchangeCodeForTokens(code) {
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
  } = process.env;

  const body = {
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: GOOGLE_REDIRECT_URI,
    grant_type: 'authorization_code',
  };

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: querystring.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to exchange code for tokens: ${response.status} ${text}`);
  }

  return response.json();
}

export function decodeIdToken(idToken) {
  // ID token is a JWT. For this hackathon-style implementation we:
  // 1) Trust it because it came directly from Google's HTTPS token endpoint.
  // 2) Decode its payload locally to extract the user's profile.
  //
  // For production, you should verify the signature using Google's public keys.
  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid ID token format');
  }

  const payload = parts[1];
  const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
  return decoded;
}


