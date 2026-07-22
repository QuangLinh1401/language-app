import express from "express";
import { defaultState, touchStreak, addXp } from "../db.js";
import { asyncHandler } from "../auth.js";

const router = express.Router();

// Full progress blob, for the "download a backup (JSON)" button in Settings.
router.get("/export", (req, res) => {
  res.json(req.state);
});

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
    wordsLearned: wordCount,
    grammarCompleted: Object.keys(req.state.grammarProgress).length,
    listeningCompleted: Object.keys(req.state.listeningProgress).length,
    readingCompleted: Object.keys(req.state.readingProgress).length
  });
});

router.post("/touch", asyncHandler(async (req, res) => {
  const { xp } = req.body;
  const streak = touchStreak(req.state);
  if (xp) addXp(req.state, xp);
  await req.saveState();
  res.json({ streak, xp: req.state.xp });
}));

export default router;
