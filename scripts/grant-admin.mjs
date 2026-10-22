// Grants (or revokes) the Garpuz administrator role by writing Auth app_metadata,
// which users cannot edit themselves. The person must have signed in with Google once.
//
//   npm run admin:grant -- someone@example.com
//   npm run admin:grant -- someone@example.com --revoke
//
// Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local. Run it only
// on a trusted machine: the service-role key bypasses every database policy.
import { createClient } from "@supabase/supabase-js";

const [email, flag] = process.argv.slice(2);
const revoke = flag === "--revoke";
if (!email || (flag && !revoke)) {
  console.error("Usage: npm run admin:grant -- <email> [--revoke]");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see .env.example).");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const target = email.trim().toLowerCase();

let user;
for (let page = 1; !user; page++) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) throw error;
  user = data.users.find((candidate) => candidate.email?.toLowerCase() === target);
  if (data.users.length < 1000) break;
}
if (!user) {
  console.error(`No user found for ${target}. Ask them to sign in with Google once, then run this again.`);
  process.exit(1);
}

// Supabase merges app_metadata, so the role is cleared by setting it to null.
const { error } = await supabase.auth.admin.updateUserById(user.id, { app_metadata: { role: revoke ? null : "admin" } });
if (error) throw error;
console.log(`${revoke ? "Revoked" : "Granted"} administrator role ${revoke ? "from" : "to"} ${target} (${user.id}). They must sign out and back in for it to take effect.`);
