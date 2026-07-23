import { neon } from "@neondatabase/serverless";

export function defaultState() {
  return {
    streak: { current: 0, lastActiveDate: null, freezes: 0 },
    xp: 0,
    dailyXp: { date: null, amount: 0 },
    wordProgress: {},
    grammarProgress: {},
    listeningProgress: {},
    readingProgress: {},
    // Tracks which brand-new words have already been introduced "today",
    // so the daily new-word cap holds even across page refreshes.
    dailyNewWords: { date: null, wordIds: [] },
    settings: { dailyNewLimit: 20, dailyXpGoal: 50 }
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

// Runs a query directly, only creating the tables (and retrying once) if the
// database says they're missing. Skips 3 roundtrips on every serverless cold
// start compared to always awaiting ensureTables() first.
export async function withTableRetry(fn) {
  try {
    return await fn();
  } catch (err) {
    if (/does not exist/i.test(err?.message || "")) {
      await ensureTables();
      return await fn();
    }
    throw err;
  }
}

// Loads one user's progress blob, seeding a fresh default row if missing.
export async function loadState(userId) {
  return withTableRetry(async () => {
    const rows = await sql`select state from user_state where user_id = ${userId}`;
    if (rows.length > 0) return { ...defaultState(), ...rows[0].state };
    const seed = defaultState();
    await sql`
      insert into user_state (user_id, state, updated_at)
      values (${userId}, ${JSON.stringify(seed)}::jsonb, now())
      on conflict (user_id) do nothing
    `;
    return seed;
  });
}

export async function saveState(userId, state) {
  return withTableRetry(async () => {
    await sql`
      insert into user_state (user_id, state, updated_at)
      values (${userId}, ${JSON.stringify(state)}::jsonb, now())
      on conflict (user_id) do update set state = excluded.state, updated_at = now()
    `;
  });
}

// ---- Helpers that operate on a loaded state object ----

const DAY_MS = 86400000;

// "Today" comes from the CLIENT's local date (YYYY-MM-DD) whenever possible:
// the server can't know the user's timezone, and using toISOString() put the
// day boundary at 7 AM for Vietnamese users. Falls back to UTC when absent.
export function validClientDate(d) {
  return typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
}

function shiftDate(dateStr, days) {
  const d = new Date(dateStr + "T00:00:00Z");
  return new Date(d.getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

export function touchStreak(state, clientDate) {
  const s = state.streak;
  if (s.freezes === undefined) s.freezes = 0; // older saves
  if (!state.activityDates) state.activityDates = [];
  if (!state.freezeDates) state.freezeDates = [];
  const today = validClientDate(clientDate) || todayKey();

  // Explicit activity log — the source of truth for "which days did I study",
  // instead of inferring backwards from the streak counter.
  if (!state.activityDates.includes(today)) {
    state.activityDates.push(today);
    if (state.activityDates.length > 60) state.activityDates = state.activityDates.slice(-60);
  }

  if (s.lastActiveDate === today) return s;

  const yesterday = shiftDate(today, -1);
  const dayBefore = shiftDate(today, -2);
  if (s.lastActiveDate === yesterday) {
    s.current += 1;
  } else if (s.lastActiveDate === dayBefore && s.freezes > 0) {
    // Missed exactly one day — a streak freeze keeps the run alive.
    // Frozen days are logged separately so they never masquerade as studied.
    s.freezes -= 1;
    state.freezeDates.push(yesterday);
    if (state.freezeDates.length > 30) state.freezeDates = state.freezeDates.slice(-30);
    s.current += 1;
  } else {
    s.current = 1;
  }
  // Earn a freeze at every 7-day milestone (bank up to 2).
  if (s.current > 0 && s.current % 7 === 0 && s.freezes < 2) s.freezes += 1;
  s.lastActiveDate = today;
  return s;
}

export function addXp(state, amount, clientDate) {
  state.xp += amount;
  const today = validClientDate(clientDate) || todayKey();
  if (!state.dailyXp || state.dailyXp.date !== today) {
    state.dailyXp = { date: today, amount: 0 };
  }
  state.dailyXp.amount += amount;
  return state.xp;
}

// Today's XP (resets when the client's day rolls over).
export function getDailyXp(state, clientDate) {
  const today = validClientDate(clientDate) || todayKey();
  if (!state.dailyXp || state.dailyXp.date !== today) return 0;
  return state.dailyXp.amount;
}

export function getDailyXpGoal(state) {
  if (!state.settings) state.settings = { dailyNewLimit: 20, dailyXpGoal: 50 };
  if (!state.settings.dailyXpGoal) state.settings.dailyXpGoal = 50;
  return state.settings.dailyXpGoal;
}

export function setDailyXpGoal(state, goal) {
  getDailyXpGoal(state);
  state.settings.dailyXpGoal = goal;
  return goal;
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// Returns the list of word ids already introduced as "new" today,
// resetting the tracker if the (client's) day has rolled over.
export function getDailyNewWordIds(state, clientDate) {
  const today = validClientDate(clientDate) || todayKey();
  if (!state.dailyNewWords || state.dailyNewWords.date !== today) {
    state.dailyNewWords = { date: today, wordIds: [] };
  }
  return state.dailyNewWords.wordIds;
}

export function addDailyNewWordIds(state, ids, clientDate) {
  const list = getDailyNewWordIds(state, clientDate);
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
