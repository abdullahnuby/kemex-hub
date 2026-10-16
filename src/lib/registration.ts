import "server-only";
import { database } from "@/lib/neon";

/**
 * Create small auth-supporting tables idempotently. Invites and the one-time
 * bootstrap flag live in Neon, not in ephemeral Vercel process memory.
 */
export async function registrationDatabase() {
  const sql = database();

  await sql`
    CREATE TABLE IF NOT EXISTS kemex_hub_auth_state (
      id smallint PRIMARY KEY CHECK (id = 1),
      bootstrap_completed boolean NOT NULL DEFAULT false
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS kemex_hub_registration_invites (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      token_hash text NOT NULL UNIQUE,
      created_by uuid REFERENCES user_accounts(id) ON DELETE SET NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz NOT NULL,
      used_at timestamptz
    )
  `;

  // Existing installations may already have users created from the CLI.
  // Mark bootstrap as completed in that case; never reopen it on later requests.
  await sql`
    INSERT INTO kemex_hub_auth_state (id, bootstrap_completed)
    SELECT 1, EXISTS (SELECT 1 FROM user_accounts)
    ON CONFLICT (id) DO NOTHING
  `;

  // Also cover accounts created later through the local CLI on an older install.
  await sql`
    UPDATE kemex_hub_auth_state
    SET bootstrap_completed = true
    WHERE id = 1
      AND bootstrap_completed = false
      AND EXISTS (SELECT 1 FROM user_accounts)
  `;

  return sql;
}
