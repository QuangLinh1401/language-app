import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { asyncHandler } from "../auth.js";
import { scheduleNext } from "../srs.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const load = (f) => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "data", f), "utf-8"));
const DATA = { en: load("reading.json"), zh: load("reading-zh.json") };

const ALL_PASSAGES = [...DATA.en.passages, ...DATA.zh.passages];
const langOf = (req) => (req.query.lang === "zh" ? "zh" : "en");

const router = express.Router();

router.get("/", (req, res) => {
  const list = DATA[langOf(req)].passages.map((p) => {
    const progress = req.state.readingProgress[p.id];
    return {
      id: p.id,
      level: p.level,
      topic: p.topic,
      title: p.title,
      wordCount: p.wordCount,
      totalQuestions: p.questions.length,
      read: Boolean(progress),
      score: progress ? progress.score : null,
      timeSeconds: progress ? progress.timeSeconds : null,
      wrongCount: (progress?.wrongIds || []).length
    };
  });
  res.json(list);
});

router.get("/:id", (req, res) => {
  const passage = ALL_PASSAGES.find((p) => p.id === req.params.id);
  if (!passage) return res.status(404).json({ error: "Passage not found" });
  res.json({ ...passage, progress: req.state.readingProgress[passage.id] || null });
});

router.post("/:id/complete", asyncHandler(async (req, res) => {
  const { score, timeSeconds } = req.body;
  const passage = ALL_PASSAGES.find((p) => p.id === req.params.id);
  if (!passage) return res.status(404).json({ error: "Passage not found" });
  const validIds = new Set(passage.questions.map((q) => q.id));
  const wrongIds = Array.isArray(req.body?.wrongIds)
    ? req.body.wrongIds.filter((id) => validIds.has(id)).slice(0, 50)
    : [];
  const grade = score != null && passage.questions.length > 0 && score / passage.questions.length < 0.7 ? "hard" : "good";
  const prev = req.state.readingProgress[req.params.id];
  req.state.readingProgress[req.params.id] = {
    completedAt: Date.now(),
    score: score ?? null,
    timeSeconds: timeSeconds ?? null,
    wrongIds,
    ...scheduleNext(prev, grade)
  };
  await req.saveState();
  res.json({ ok: true });
}));

export default router;
