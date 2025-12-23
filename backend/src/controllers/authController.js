import dotenv from 'dotenv';
dotenv.config();

// Controllers encapsulate the auth logic so routes stay thin.
// This file handles BOTH local email/password auth and Google OAuth.

import {
  findUserByEmail,
  findUserById,
  hashPassword,
  verifyPassword,
  findOrCreateGoogleUser,
  createLocalUser,
} from '../models/user.js';

import { generateAuthToken } from '../utils/jwt.js';
import { getGoogleAuthUrl, exchangeCodeForTokens, decodeIdToken } from '../utils/googleOAuth.js';
import crypto from 'crypto';

// -------- Local email/password auth --------

export async function signup(req, res) {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, error: 'User with this email already exists' });
    }

    const passwordData = hashPassword(password);
    const user = await createLocalUser({ email, name, password: passwordData });

    const token = generateAuthToken(user);

    res.json({
      success: true,
      token,
      user: publicUser(user),
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, error: 'Failed to sign up' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = await findUserByEmail(email);
    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const token = generateAuthToken(user);

    res.json({
      success: true,
      token,
      user: publicUser(user),
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Failed to log in' });
  }
}

export async function me(req, res) {
  try {
    const user = await findUserById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, user: publicUser(user) });
  } catch (err) {
    console.error('Auth me error:', err);
    res.status(500).json({ success: false, error: 'Failed to load user' });
  }
}

export async function logout(_req, res) {
  // With pure JWT auth there is nothing to invalidate server-side in this
  // minimal implementation. The frontend simply discards the token.
  res.json({ success: true });
}

// -------- Google OAuth 2.0 flow --------

// Step 1: redirect the user to Google's consent screen.
// Route: GET /auth/google
export async function startGoogleOAuth(_req, res) {
  try {
    // `state` protects against CSRF and can also encode return URLs.
    const state = crypto.randomBytes(16).toString('hex');
    const url = getGoogleAuthUrl(state);
    // In a more advanced setup we'd persist `state` in a store or cookie
    // and validate it in the callback.
    res.redirect(url);
  } catch (err) {
    console.error('Error starting Google OAuth:', err);
    res.status(500).send('Failed to start Google OAuth');
  }
}

// Step 2: handle Google callback with ?code=...
// Route: GET /auth/google/callback
export async function handleGoogleCallback(req, res) {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).send('Missing authorization code');
    }

    // 1) Exchange authorization code for tokens (access token + ID token).
    const tokenResponse = await exchangeCodeForTokens(code);

    // 2) Decode ID token to obtain the user profile from Google.
    const idToken = tokenResponse.id_token;
    if (!idToken) {
      throw new Error('Missing ID token from Google');
    }

    const profile = decodeIdToken(idToken);

    // 3) Upsert user in our own database.
    const user = await findOrCreateGoogleUser(profile);

    // 4) Generate OUR app's JWT. We do NOT keep Google access/refresh tokens.
    const appToken = generateAuthToken(user);

    // 5) Redirect back to frontend with the app token.
    const frontendBase =
      process.env.FRONTEND_BASE_URL || 'http://localhost:3000';

    // Token is returned once in the URL; frontend will read it and then
    // immediately scrub it from the address bar.
    const redirectUrl = `${frontendBase}/?authToken=${encodeURIComponent(
      appToken,
    )}`;

    res.redirect(redirectUrl);
  } catch (err) {
    // Log full stack for debugging
    console.error('Google OAuth callback error:', err && err.stack ? err.stack : err);

    // In development, return the error message to help debugging in the browser.
    if (process.env.NODE_ENV !== 'production') {
      const msg = typeof err === 'string' ? err : (err && err.message) ? err.message : 'Unknown error';
      res.status(500).send(`Google OAuth failed: ${msg}`);
    } else {
      res.status(500).send('Google OAuth failed');
    }
  }
}

// Helper to return a safe, public representation of a user.
function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    profile_image: user.profile_image || null,
    oauth_provider: user.oauth_provider || null,
    oauth_id: user.oauth_id || null,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}


