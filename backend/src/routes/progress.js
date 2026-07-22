import express from "express";
import { db, touchStreak, addXp, resetState } from "../db.js";

const router = express.Router();

// Full progress blob, for the "download a backup (JSON)" button in Settings.
router.get("/export", (req, res) => {
  res.json(db.data);
});

// "Reset all progress" in Settings — wipes back to a fresh default.
router.post("/reset", async (req, res) => {
  resetState();
  await db.write();
  res.json({ ok: true });
});

router.get("/", (req, res) => {
  const wordCount = Object.keys(db.data.wordProgress).length;
  res.json({
    streak: db.data.streak,
    xp: db.data.xp,
    wordsLearned: wordCount,
    grammarCompleted: Object.keys(db.data.grammarProgress).length,
    listeningCompleted: Object.keys(db.data.listeningProgress).length,
    readingCompleted: Object.keys(db.data.readingProgress).length
  });
});

router.post("/touch", async (req, res) => {
  const { xp } = req.body;
  const streak = touchStreak();
  if (xp) addXp(xp);
  await db.write();
  res.json({ streak, xp: db.data.xp });
});

export default router;
