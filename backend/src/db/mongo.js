import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Simple MongoDB helper.
// We use a single shared client/DB instance for the whole backend so that
// models can call `getDb()` to read/write documents.

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sureroute';
const MONGODB_DB = process.env.MONGODB_DB || 'sureroute';

// Helper to log a safe version of the URI (no real username/password).
function getSafeMongoUri(uri) {
  try {
    // Replace "mongodb+srv://user:pass@" with "mongodb+srv://[user]:[password]@"
    return uri.replace(/:\/\/([^:]+):([^@]+)@/, '://[user]:[password]@');
  } catch {
    return uri;
  }
}

let client;
let db;

export async function getDb() {
  if (db) return db;

  if (!client) {
    console.log('[MongoDB] Creating new MongoClient...');
    console.log('[MongoDB] Using URI:', getSafeMongoUri(MONGODB_URI));
    console.log('[MongoDB] Target database:', MONGODB_DB);

    client = new MongoClient(MONGODB_URI);
    try {
      await client.connect();
      console.log('[MongoDB] Successfully connected to MongoDB.');
    } catch (err) {
      console.error('[MongoDB] Failed to connect to MongoDB:', err);
      throw err;
    }
  }

  db = client.db(MONGODB_DB);
  return db;
}


