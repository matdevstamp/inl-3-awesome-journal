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

export const env = {
  /** Which of the two demo instances this server is (hospital-s | ambulance-a). */
  serverId: optionalEnv("SERVER_ID", "hospital-s"),

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

  peerUrl: optionalEnv("PEER_URL", "http://localhost:3002"),
};
