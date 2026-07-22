import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const legacyJsonPath = path.join(__dirname, "..", "data", "user-progress.json");

export function defaultState() {
  return {
    streak: { current: 0, lastActiveDate: null },
    xp: 0,
    wordProgress: {},
    grammarProgress: {},
    listeningProgress: {},
    readingProgress: {},
    // Tracks which brand-new words have already been introduced "today",
    // so the daily new-word cap holds even across page refreshes.
    dailyNewWords: { date: null, wordIds: [] },
    settings: { dailyNewLimit: 20 }
  };
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy backend/.env.example to backend/.env and add your Neon Postgres connection string."
  );
}

// Neon's serverless driver runs queries over HTTPS (port 443) instead of the
// Postgres wire protocol (5432), which many networks/firewalls block.
const sql = neon(connectionString);

// This app has a single user (by design), so all progress lives in one row.
const ROW_ID = "default";

await sql`
  create table if not exists app_state (
    id text primary key,
    state jsonb not null,
    updated_at timestamptz not null default now()
  )
`;

// Load the existing row, or seed it — migrating the old JSON file on first run
// so previously-saved progress (XP, streak, word progress) isn't lost.
async function loadInitialState() {
  const rows = await sql`select state from app_state where id = ${ROW_ID}`;
  if (rows.length > 0) return rows[0].state;

  let seed = defaultState();
  try {
    if (fs.existsSync(legacyJsonPath)) {
      const legacy = JSON.parse(fs.readFileSync(legacyJsonPath, "utf-8"));
      seed = { ...defaultState(), ...legacy };
      console.log("[db] Migrated existing user-progress.json into Neon.");
    }
  } catch (err) {
    console.error("[db] Could not read legacy JSON, seeding fresh state:", err.message);
  }

  await sql`insert into app_state (id, state) values (${ROW_ID}, ${JSON.stringify(seed)}::jsonb) on conflict (id) do nothing`;
  return seed;
}

// Same shape the rest of the app expects from the old lowdb instance:
// `db.data` is the in-memory state, `db.write()` persists it.
export const db = {
  data: await loadInitialState(),
  async write() {
    await sql`
      insert into app_state (id, state, updated_at)
      values (${ROW_ID}, ${JSON.stringify(this.data)}::jsonb, now())
      on conflict (id) do update set state = excluded.state, updated_at = now()
    `;
  }
};

// Replaces the whole progress blob with a fresh default (used by "reset
// progress" in Settings). Mutates in place so existing imports of `db` stay
// valid, then callers persist with db.write().
export function resetState() {
  db.data = defaultState();
}

export function touchStreak() {
  const today = new Date().toISOString().slice(0, 10);
  const last = db.data.streak.lastActiveDate;
  if (last === today) return db.data.streak;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (last === yesterday) {
    db.data.streak.current += 1;
  } else {
    db.data.streak.current = 1;
  }
  db.data.streak.lastActiveDate = today;
  return db.data.streak;
}

export function addXp(amount) {
  db.data.xp += amount;
  return db.data.xp;
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// Returns the list of word ids already introduced as "new" today,
// resetting the tracker if the day has rolled over.
export function getDailyNewWordIds() {
  const today = todayKey();
  if (!db.data.dailyNewWords || db.data.dailyNewWords.date !== today) {
    db.data.dailyNewWords = { date: today, wordIds: [] };
  }
  return db.data.dailyNewWords.wordIds;
}

export function addDailyNewWordIds(ids) {
  const list = getDailyNewWordIds();
  for (const id of ids) {
    if (!list.includes(id)) list.push(id);
  }
}

// Defensive getter: older save files may predate the settings field.
export function getDailyNewLimit() {
  if (!db.data.settings) db.data.settings = { dailyNewLimit: 20 };
  return db.data.settings.dailyNewLimit;
}

export function setDailyNewLimit(limit) {
  if (!db.data.settings) db.data.settings = { dailyNewLimit: 20 };
  db.data.settings.dailyNewLimit = limit;
  return db.data.settings.dailyNewLimit;
}
