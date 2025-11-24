import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/mongo.js';

// Mongo-backed user model. We still keep the same public interface that the
// rest of the code uses, but data now lives in a proper NoSQL database
// instead of JSON files on disk.

function usersCollection(db) {
  return db.collection('users');
}

export async function findUserByEmail(email) {
  const db = await getDb();
  const lower = email.toLowerCase();
  return usersCollection(db).findOne({ email: lower });
}

export async function findUserById(id) {
  const db = await getDb();
  return usersCollection(db).findOne({ id });
}

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.createHmac('sha256', salt).update(password).digest('hex');
  return { salt, hash };
}

export function verifyPassword(password, passwordData) {
  if (!passwordData || !passwordData.salt || !passwordData.hash) return false;
  const { salt, hash } = passwordData;
  const newHash = crypto.createHmac('sha256', salt).update(password).digest('hex');
  return newHash === hash;
}

export async function createLocalUser({ email, name, password }) {
  const db = await getDb();
  const col = usersCollection(db);
  const id = uuidv4();
  const now = Date.now();
  const doc = {
    id,
    email: email.toLowerCase(),
    name: name || email,
    password,
    oauth_provider: null,
    oauth_id: null,
    profile_image: null,
    created_at: now,
    updated_at: now,
  };
  await col.insertOne(doc);
  return doc;
}

// Upsert helper for Google OAuth users.
export async function findOrCreateGoogleUser(profile) {
  const {
    sub,       // Google user ID
    email,
    name,
    picture,
  } = profile;

  const db = await getDb();
  const col = usersCollection(db);

  // Try to find by provider id first
  let user = await col.findOne({
    oauth_provider: 'google',
    oauth_id: sub,
  });

  const lowerEmail = email ? email.toLowerCase() : null;

  // Fallback: same email but no provider yet → link accounts.
  if (!user && lowerEmail) {
    user = await col.findOne({ email: lowerEmail });
  }

  const now = Date.now();

  if (!user) {
    const id = uuidv4();
    user = {
      id,
      email: lowerEmail,
      name: name || email || 'Google User',
      profile_image: picture || null,
      oauth_provider: 'google',
      oauth_id: sub,
      created_at: now,
      updated_at: now,
    };
    await col.insertOne(user);
  } else {
    const update = {
      oauth_provider: 'google',
      oauth_id: sub,
      name: name || user.name || email,
      profile_image: picture || user.profile_image || null,
      updated_at: now,
    };
    await col.updateOne({ id: user.id }, { $set: update });
    user = { ...user, ...update };
  }

  return user;
}

