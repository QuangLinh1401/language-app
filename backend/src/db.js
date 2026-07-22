import { neon } from "@neondatabase/serverless";

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
export const sql = neon(connectionString);

// Schema setup runs once per process (serverless instances are reused, so in
// practice this is rare). `create table if not exists` keeps it idempotent.
let tablesReady = null;
export function ensureTables() {
  if (!tablesReady) {
    tablesReady = (async () => {
      await sql`
        create table if not exists users (
          id serial primary key,
          username text unique not null,
          password_hash text not null,
          created_at timestamptz not null default now()
        )
      `;
      await sql`
        create table if not exists user_state (
          user_id integer primary key references users(id) on delete cascade,
          state jsonb not null,
          updated_at timestamptz not null default now()
        )
      `;
      // Legacy single-user table from before accounts existed; kept so the
      // first registered user can inherit that progress (see auth route).
      await sql`
        create table if not exists app_state (
          id text primary key,
          state jsonb not null,
          updated_at timestamptz not null default now()
        )
      `;
    })();
  }
  return tablesReady;
}

// Loads one user's progress blob, seeding a fresh default row if missing.
export async function loadState(userId) {
  await ensureTables();
  const rows = await sql`select state from user_state where user_id = ${userId}`;
  if (rows.length > 0) return { ...defaultState(), ...rows[0].state };
  const seed = defaultState();
  await saveState(userId, seed);
  return seed;
}

export async function saveState(userId, state) {
  await ensureTables();
  await sql`
    insert into user_state (user_id, state, updated_at)
    values (${userId}, ${JSON.stringify(state)}::jsonb, now())
    on conflict (user_id) do update set state = excluded.state, updated_at = now()
  `;
}

// ---- Helpers that operate on a loaded state object ----

export function touchStreak(state) {
  const today = new Date().toISOString().slice(0, 10);
  const last = state.streak.lastActiveDate;
  if (last === today) return state.streak;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (last === yesterday) {
    state.streak.current += 1;
  } else {
    state.streak.current = 1;
  }
  state.streak.lastActiveDate = today;
  return state.streak;
}

export function addXp(state, amount) {
  state.xp += amount;
  return state.xp;
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// Returns the list of word ids already introduced as "new" today,
// resetting the tracker if the day has rolled over.
export function getDailyNewWordIds(state) {
  const today = todayKey();
  if (!state.dailyNewWords || state.dailyNewWords.date !== today) {
    state.dailyNewWords = { date: today, wordIds: [] };
  }
  return state.dailyNewWords.wordIds;
}

export function addDailyNewWordIds(state, ids) {
  const list = getDailyNewWordIds(state);
  for (const id of ids) {
    if (!list.includes(id)) list.push(id);
  }
}

// Defensive getter: older save files may predate the settings field.
export function getDailyNewLimit(state) {
  if (!state.settings) state.settings = { dailyNewLimit: 20 };
  return state.settings.dailyNewLimit;
}

export function setDailyNewLimit(state, limit) {
  if (!state.settings) state.settings = { dailyNewLimit: 20 };
  state.settings.dailyNewLimit = limit;
  return state.settings.dailyNewLimit;
}
