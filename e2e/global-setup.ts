import { execSync } from "node:child_process";

/**
 * 1. Make sure the shared Postgres is up, migrated and seeded before the
 *    web servers boot (local runs only — CI provisions via the workflow's
 *    postgres service and its own env).
 * 2. Build the app once; the web servers below run `next start` from that
 *    build output, because Next 16 only allows one `next dev` per project.
 */
export default function globalSetup(): void {
  const commands: string[] = [];

  if (!process.env.CI && !process.env.DATABASE_URL) {
    commands.push("npm run db:up && npm run db:deploy && npm run db:seed");
  }
  commands.push("npm run build");

  for (const command of commands) {
    try {
      execSync(command, { stdio: "inherit", cwd: process.cwd() });
    } catch (error) {
      // Missing Docker or a failed build should fail loudly rather than
      // silently serving stale servers.
      console.error(`\n[global-setup] Command failed: ${command}\n`);
      throw error;
    }
  }
}
