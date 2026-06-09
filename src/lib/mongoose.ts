import mongoose from "mongoose";

if (!process.env.MONGODB_URI) {
  throw new Error("Missing MONGODB_URI environment variable.");
}

const mongoUri = process.env.MONGODB_URI;

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cached = globalForMongoose.mongooseCache ?? {
  conn: null,
  promise: null
};

if (!globalForMongoose.mongooseCache) {
  globalForMongoose.mongooseCache = cached;
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  cached.promise ??= mongoose.connect(mongoUri, {
    dbName: process.env.MONGODB_DB
  });

  cached.conn = await cached.promise;
  return cached.conn;
}
