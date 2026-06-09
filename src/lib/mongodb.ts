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

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

const globalForMongo = globalThis as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

if (process.env.NODE_ENV === "development") {
  if (!globalForMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalForMongo._mongoClientPromise = client.connect();
  }

  clientPromise = globalForMongo._mongoClientPromise!;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getDatabase() {
  const connectedClient = await clientPromise;
  return connectedClient.db(process.env.MONGODB_DB);
}

export default clientPromise;
