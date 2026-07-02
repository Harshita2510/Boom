import { MongoClient, ServerApiVersion } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("Missing MONGODB_URI environment variable.");
}

const uri = process.env.MONGODB_URI;

// Allow opting out of strict TLS checks for local debugging only.
const tlsAllowInvalidCertificates = process.env.MONGODB_TLS_ALLOW_INVALID_CERTIFICATES === "true";
const tlsAllowInvalidHostnames = process.env.MONGODB_TLS_ALLOW_INVALID_HOSTNAMES === "true";
const enableInsecureTls = tlsAllowInvalidCertificates || tlsAllowInvalidHostnames;

const options: any = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
};

if (enableInsecureTls) {
  // enable TLS and relax validation when the corresponding env vars are set
  options.tls = true;
  options.tlsAllowInvalidCertificates = tlsAllowInvalidCertificates;
  options.tlsAllowInvalidHostnames = tlsAllowInvalidHostnames;
  console.warn("Warning: MongoDB TLS validation is disabled. This should only be used for local debugging.");
}

const globalForMongo = globalThis as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

function createClientPromise() {
  const client = new MongoClient(uri, options);

  return client.connect().catch((error) => {
    if (process.env.NODE_ENV === "development") {
      globalForMongo._mongoClientPromise = undefined;
    }

    throw error;
  });
}

function getClientPromise() {
  if (process.env.NODE_ENV === "development") {
    globalForMongo._mongoClientPromise ??= createClientPromise();
    return globalForMongo._mongoClientPromise;
  }

  return createClientPromise();
}

export async function getDatabase() {
  const clientPromise = getClientPromise();
  const connectedClient = await clientPromise;
  return connectedClient.db(process.env.MONGODB_DB);
}
