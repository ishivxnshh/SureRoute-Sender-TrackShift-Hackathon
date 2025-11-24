import { getDb } from './db/mongo.js';

// Mongo-backed workflow persistence. Each user has a single document in the
// `workflows` collection with their current list of workflows.

function workflowsCollection(db) {
  return db.collection('workflows');
}

export async function getUserWorkflows(userId) {
  const db = await getDb();
  const doc = await workflowsCollection(db).findOne({ userId });
  return doc?.workflows || [];
}

export async function saveUserWorkflows(userId, workflows) {
  const db = await getDb();
  await workflowsCollection(db).updateOne(
    { userId },
    { $set: { workflows, updatedAt: Date.now() } },
    { upsert: true },
  );
}

