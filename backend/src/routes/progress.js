import express from "express";
import { defaultState, touchStreak, addXp, getDailyXp, getDailyXpGoal, setDailyXpGoal } from "../db.js";
import { asyncHandler } from "../auth.js";

const router = express.Router();

// Full progress blob, for the "download a backup (JSON)" button in Settings.
router.get("/export", (req, res) => {
  res.json(req.state);
});

// Restore a backup made with /export — replaces the whole progress blob.
router.post("/import", asyncHandler(async (req, res) => {
  const incoming = req.body;
  const KNOWN_KEYS = [
    "streak", "xp", "wordProgress", "grammarProgress",
    "listeningProgress", "readingProgress", "dailyNewWords", "settings"
  ];
  if (
    !incoming || typeof incoming !== "object" || Array.isArray(incoming) ||
    !KNOWN_KEYS.some((k) => k in incoming)
  ) {
    return res.status(400).json({ error: "This file doesn't look like a valid backup" });
  }
  // Only accept known keys, layered over defaults so missing fields stay sane.
  const next = defaultState();
  for (const k of KNOWN_KEYS) {
    if (incoming[k] !== undefined) next[k] = incoming[k];
  }
  req.state = next;
  await req.saveState();
  res.json({ ok: true });
}));

// "Reset all progress" in Settings — wipes back to a fresh default.
router.post("/reset", asyncHandler(async (req, res) => {
  req.state = defaultState();
  await req.saveState();
  res.json({ ok: true });
}));

router.get("/", (req, res) => {
  const wordCount = Object.keys(req.state.wordProgress).length;
  res.json({
    streak: req.state.streak,
    xp: req.state.xp,
    dailyXp: getDailyXp(req.state),
    dailyXpGoal: getDailyXpGoal(req.state),
    wordsLearned: wordCount,
    grammarCompleted: Object.keys(req.state.grammarProgress).length,
    listeningCompleted: Object.keys(req.state.listeningProgress).length,
    readingCompleted: Object.keys(req.state.readingProgress).length
  });
});

// Returns the full progress summary so the Home screen needs just one call.
router.post("/touch", asyncHandler(async (req, res) => {
  const { xp } = req.body;
  const streak = touchStreak(req.state);
  if (xp) addXp(req.state, xp);
  await req.saveState();
  res.json({
    streak,
    xp: req.state.xp,
    dailyXp: getDailyXp(req.state),
    dailyXpGoal: getDailyXpGoal(req.state),
    wordsLearned: Object.keys(req.state.wordProgress).length,
    grammarCompleted: Object.keys(req.state.grammarProgress).length,
    listeningCompleted: Object.keys(req.state.listeningProgress).length,
    readingCompleted: Object.keys(req.state.readingProgress).length
  });
}));

// Adjust the daily XP goal (goal-gradient: a visible finish line each day).
router.put("/settings", asyncHandler(async (req, res) => {
  const n = parseInt(req.body.dailyXpGoal, 10);
  if (!Number.isInteger(n) || n < 10 || n > 1000) {
    return res.status(400).json({ error: "dailyXpGoal must be an integer between 10 and 1000" });
  }
  setDailyXpGoal(req.state, n);
  await req.saveState();
  res.json({ dailyXpGoal: n });
}));

export default router;
