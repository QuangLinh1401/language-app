import express from "express";
import bcrypt from "bcryptjs";
import { sql, ensureTables, saveState, defaultState } from "../db.js";
import { signToken, requireAuth, asyncHandler } from "../auth.js";

const router = express.Router();

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

router.post("/register", asyncHandler(async (req, res) => {
  const { username, password } = req.body || {};
  if (!USERNAME_RE.test(username || "")) {
    return res.status(400).json({ error: "Username must be 3-20 characters (letters, numbers, _)" });
  }
  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  await ensureTables();
  const existing = await sql`select id from users where username = ${username.toLowerCase()}`;
  if (existing.length > 0) {
    return res.status(409).json({ error: "Username is already taken" });
  }

  const hash = await bcrypt.hash(password, 10);
  const [user] = await sql`
    insert into users (username, password_hash)
    values (${username.toLowerCase()}, ${hash})
    returning id, username
  `;

  // The very first account inherits the progress saved before logins existed
  // (the legacy single-user "default" row), so nothing is lost on upgrade.
  let seed = defaultState();
  const [{ count }] = await sql`select count(*)::int as count from users`;
  if (count === 1) {
    const legacy = await sql`select state from app_state where id = 'default'`;
    if (legacy.length > 0) seed = { ...seed, ...legacy[0].state };
  }
  await saveState(user.id, seed);

  res.json({ token: signToken(user), username: user.username });
}));

router.post("/login", asyncHandler(async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  await ensureTables();
  const rows = await sql`
    select id, username, password_hash from users where username = ${String(username).toLowerCase()}
  `;
  if (rows.length === 0 || !(await bcrypt.compare(password, rows[0].password_hash))) {
    return res.status(401).json({ error: "Wrong username or password" });
  }

  res.json({ token: signToken(rows[0]), username: rows[0].username });
}));

router.get("/me", requireAuth, (req, res) => {
  res.json({ username: req.username });
});

export default router;
