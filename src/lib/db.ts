import { MongoClient, Db, MongoClientOptions } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/visutale";

const clientOptions: MongoClientOptions = {
  maxPoolSize: 20,
  minPoolSize: 0,
  maxIdleTimeMS: 60000,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
};

let client: MongoClient;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined;
  // eslint-disable-next-line no-var
  var _indexesEnsured: boolean | undefined;
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClient) {
    global._mongoClient = new MongoClient(uri, clientOptions);
  }
  client = global._mongoClient;
} else {
  client = new MongoClient(uri, clientOptions);
}

export const db: Db = client.db();

/**
 * Ensures optimal MongoDB indexes for Better Auth collections and user isolation.
 * Runs asynchronously and idempotently without keeping open lingering sockets in CLI/test modes.
 */
export async function ensureDbIndexes(targetDb: Db = db): Promise<void> {
  if (global._indexesEnsured) {
    return;
  }

  try {
    const sessionCollection = targetDb.collection("session");
    const userCollection = targetDb.collection("user");
    const accountCollection = targetDb.collection("account");
    const verificationCollection = targetDb.collection("verification");

    await Promise.allSettled([
      // Session lookup and expiration indexes
      sessionCollection.createIndex({ token: 1 }, { unique: true }),
      sessionCollection.createIndex({ userId: 1 }),
      sessionCollection.createIndex({ expiresAt: 1 }),

      // User lookup by email
      userCollection.createIndex({ email: 1 }, { unique: true }),

      // Account linking and lookup
      accountCollection.createIndex({ userId: 1 }),
      accountCollection.createIndex({ providerId: 1, accountId: 1 }),

      // Verification lookup
      verificationCollection.createIndex({ identifier: 1 }),
    ]);

    global._indexesEnsured = true;
  } catch (error) {
    console.warn("MongoDB index verification notice:", error);
  }
}

export { client };
