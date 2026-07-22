import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "../db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, "..", "..", "data", "reading.json");
const readingData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

const router = express.Router();

router.get("/", (req, res) => {
  const list = readingData.passages.map((p) => {
    const progress = db.data.readingProgress[p.id];
    return {
      id: p.id,
      level: p.level,
      topic: p.topic,
      title: p.title,
      wordCount: p.wordCount,
      totalQuestions: p.questions.length,
      read: Boolean(progress),
      score: progress ? progress.score : null,
      timeSeconds: progress ? progress.timeSeconds : null
    };
  });
  res.json(list);
});

router.get("/:id", (req, res) => {
  const passage = readingData.passages.find((p) => p.id === req.params.id);
  if (!passage) return res.status(404).json({ error: "Passage not found" });
  res.json(passage);
});

router.post("/:id/complete", async (req, res) => {
  const { score, timeSeconds } = req.body;
  const passage = readingData.passages.find((p) => p.id === req.params.id);
  if (!passage) return res.status(404).json({ error: "Passage not found" });
  db.data.readingProgress[req.params.id] = {
    completedAt: Date.now(),
    score: score ?? null,
    timeSeconds: timeSeconds ?? null
  };
  await db.write();
  res.json({ ok: true });
});

export default router;
