import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Simple MongoDB helper.
// We use a single shared client/DB instance for the whole backend so that
// models can call `getDb()` to read/write documents.

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sureroute';
const MONGODB_DB = process.env.MONGODB_DB || 'sureroute';

let client;
let db;

export async function getDb() {
  if (db) return db;

  if (!client) {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
  }

  db = client.db(MONGODB_DB);
  return db;
}


