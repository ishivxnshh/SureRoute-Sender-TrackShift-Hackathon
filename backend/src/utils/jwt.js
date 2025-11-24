import jwt from 'jsonwebtoken';

// This utility centralizes JWT creation and verification for SureRoute.
// We generate our OWN application token after verifying the user with Google
// (or email/password). The frontend uses this token for subsequent API calls
// so the user does NOT have to go through Google OAuth on every request.

const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-jwt-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function generateAuthToken(user) {
  // Minimal payload: we only store what we need for auth/UX.
  return jwt.sign(
    {
      sub: user.id,          // our internal user id
      email: user.email,     // convenient on frontend
      provider: user.oauth_provider || 'local',
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyAuthToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

// Express middleware used by protected routes (`/api/workflows`, `/auth/me`, etc.)
export function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const token = parts[1];
    const payload = verifyAuthToken(token);

    req.userId = payload.sub;
    req.token = token;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}


