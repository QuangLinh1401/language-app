import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { asyncHandler } from "../auth.js";
import { scheduleNext } from "../srs.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, "..", "..", "data", "listening.json");
const listeningData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

const router = express.Router();

router.get("/", (req, res) => {
  const list = listeningData.lessons.map((l) => {
    const p = req.state.listeningProgress[l.id];
    return {
      id: l.id,
      level: l.level,
      topic: l.topic,
      title: l.title,
      completed: Boolean(p),
      wrongCount: (p?.wrongIds || []).length
    };
  });
  res.json(list);
});

router.get("/:id", (req, res) => {
  const lesson = listeningData.lessons.find((l) => l.id === req.params.id);
  if (!lesson) return res.status(404).json({ error: "Lesson not found" });
  res.json({ ...lesson, progress: req.state.listeningProgress[lesson.id] || null });
});

router.post("/:id/complete", asyncHandler(async (req, res) => {
  const { score } = req.body;
  const lesson = listeningData.lessons.find((l) => l.id === req.params.id);
  if (!lesson) return res.status(404).json({ error: "Lesson not found" });
  const validIds = new Set(lesson.questions.map((q) => q.id));
  const wrongIds = Array.isArray(req.body?.wrongIds)
    ? req.body.wrongIds.filter((id) => validIds.has(id)).slice(0, 50)
    : [];
  // A weak score (percent) brings the lesson back sooner (SRS "hard"),
  // a strong one pushes the next review further out ("good").
  const grade = score != null && score < 70 ? "hard" : "good";
  const prev = req.state.listeningProgress[req.params.id];
  req.state.listeningProgress[req.params.id] = {
    completedAt: Date.now(),
    score: score ?? null,
    wrongIds,
    ...scheduleNext(prev, grade)
  };
  await req.saveState();
  res.json({ ok: true });
}));

export default router;
