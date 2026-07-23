import express from "express";
import { defaultState, touchStreak, addXp, getDailyXp, getDailyXpGoal, setDailyXpGoal, validClientDate, todayKey } from "../db.js";
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
    dailyXp: getDailyXp(req.state, req.query.date),
    dailyXpGoal: getDailyXpGoal(req.state),
    wordsLearned: wordCount,
    grammarCompleted: Object.keys(req.state.grammarProgress).length,
    listeningCompleted: Object.keys(req.state.listeningProgress).length,
    readingCompleted: Object.keys(req.state.readingProgress).length
  });
});

// Returns the full progress summary so the Home screen needs just one call.
// `date` is the client's LOCAL date (YYYY-MM-DD) — the server must not decide
// when "today" starts for the user.
router.post("/touch", asyncHandler(async (req, res) => {
  const { xp, date } = req.body;
  const streak = touchStreak(req.state, date);
  if (xp) addXp(req.state, xp, date);
  await req.saveState();
  res.json({
    streak,
    xp: req.state.xp,
    dailyXp: getDailyXp(req.state, date),
    dailyXpGoal: getDailyXpGoal(req.state),
    preferredLevel: req.state.settings?.preferredLevel || null,
    studyPlan: req.state.settings?.studyPlan || null,
    wordsLearned: Object.keys(req.state.wordProgress).length,
    grammarCompleted: Object.keys(req.state.grammarProgress).length,
    listeningCompleted: Object.keys(req.state.listeningProgress).length,
    readingCompleted: Object.keys(req.state.readingProgress).length
  });
}));

// Adjust progress settings: daily XP goal and/or preferred CEFR level.
router.put("/settings", asyncHandler(async (req, res) => {
  const out = {};
  if (req.body.dailyXpGoal !== undefined) {
    const n = parseInt(req.body.dailyXpGoal, 10);
    if (!Number.isInteger(n) || n < 10 || n > 1000) {
      return res.status(400).json({ error: "dailyXpGoal must be an integer between 10 and 1000" });
    }
    setDailyXpGoal(req.state, n);
    out.dailyXpGoal = n;
  }
  if (req.body.preferredLevel !== undefined) {
    if (!["A1", "A2", "B1", "B2"].includes(req.body.preferredLevel)) {
      return res.status(400).json({ error: "preferredLevel must be A1, A2, B1 or B2" });
    }
    req.state.settings.preferredLevel = req.body.preferredLevel;
    out.preferredLevel = req.body.preferredLevel;
  }
  // Study plan: a concrete target (words in N days) that daily activity rolls
  // up into. Pass null to clear.
  if (req.body.studyPlan !== undefined) {
    if (req.body.studyPlan === null) {
      req.state.settings.studyPlan = null;
      out.studyPlan = null;
    } else {
      const targetWords = parseInt(req.body.studyPlan.targetWords, 10);
      const days = parseInt(req.body.studyPlan.days, 10);
      if (!Number.isInteger(targetWords) || targetWords < 50 || targetWords > 5000 ||
          !Number.isInteger(days) || days < 7 || days > 365) {
        return res.status(400).json({ error: "studyPlan needs targetWords (50-5000) and days (7-365)" });
      }
      req.state.settings.studyPlan = {
        targetWords,
        days,
        startDate: validClientDate(req.body.date) || todayKey(),
        startWords: Object.keys(req.state.wordProgress).length
      };
      out.studyPlan = req.state.settings.studyPlan;
    }
  }
  if (Object.keys(out).length === 0) {
    return res.status(400).json({ error: "Nothing to update" });
  }
  await req.saveState();
  res.json(out);
}));

export default router;
