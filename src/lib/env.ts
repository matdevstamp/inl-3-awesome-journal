/**
 * Typed access to environment variables. Validated once at first read so
 * a missing variable fails fast instead of at request time.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

function parsePort(value: string): number {
  const port = Number(value);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid port value: ${value}`);
  }
  return port;
}

function parsePositiveInt(value: string, name: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${name} value: ${value}`);
  }
  return parsed;
}

const serverId = optionalEnv("SERVER_ID", "hospital-s");

/** Which demo instance the configured peer is. Derived unless PEER_URL is set. */
const DEFAULT_PEER_URL: Record<string, string> = {
  "hospital-s": "http://localhost:3002",
  "ambulance-a": "http://localhost:3001",
};

export const env = {
  /** Which of the two demo instances this server is (hospital-s | ambulance-a). */
  serverId,

  port: parsePort(optionalEnv("PORT", "3001")),

  databaseUrl: optionalEnv(
    "DATABASE_URL",
    "postgresql://healthaccess:healthaccess@localhost:5432/healthaccess",
  ),

  /** Set lazily so server startup never fails when auth is unused. */
  get jwtSecret(): string {
    return requireEnv("JWT_SECRET");
  },

  jwtExpiresIn: optionalEnv("JWT_EXPIRES_IN", "24h"),

  peerUrl: optionalEnv("PEER_URL", DEFAULT_PEER_URL[serverId] ?? "http://localhost:3002"),

  /** How often the peer heartbeat pings the other server (ms). */
  peerHeartbeatMs: parsePositiveInt(optionalEnv("PEER_HEARTBEAT_MS", "10000"), "PEER_HEARTBEAT_MS"),
};
