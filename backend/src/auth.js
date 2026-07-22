import jwt from "jsonwebtoken";
import { loadState, saveState } from "./db.js";

// In production set JWT_SECRET in the environment (Vercel project settings).
// The fallback keeps local dev working without extra setup.
const JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret-change-me";
if (!process.env.JWT_SECRET) {
  console.warn("[auth] JWT_SECRET is not set — using an insecure dev fallback.");
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: "30d"
  });
}

// Verifies the Bearer token and attaches req.userId / req.username.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not logged in" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    req.username = payload.username;
    next();
  } catch {
    return res.status(401).json({ error: "Session expired, please log in again" });
  }
}

// Express 4 doesn't catch rejected promises from async handlers (the process
// would crash) — wrap them so errors reach the error middleware instead.
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// Loads the user's progress blob into req.state and provides req.saveState().
// Mount after requireAuth on every route that reads or writes progress.
export function withState(req, res, next) {
  loadState(req.userId)
    .then((state) => {
      req.state = state;
      req.saveState = () => saveState(req.userId, req.state);
      next();
    })
    .catch(next);
}
