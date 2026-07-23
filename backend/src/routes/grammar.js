import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { asyncHandler } from "../auth.js";
import { scheduleNext } from "../srs.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, "..", "..", "data", "grammar.json");
const grammarData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

const router = express.Router();

router.get("/", (req, res) => {
  const list = grammarData.lessons.map((l) => {
    const p = req.state.grammarProgress[l.id];
    return {
      id: l.id,
      level: l.level,
      title: l.title,
      completed: Boolean(p),
      wrongCount: (p?.wrongIds || []).length
    };
  });
  res.json(list);
});

router.get("/:id", (req, res) => {
  const lesson = grammarData.lessons.find((l) => l.id === req.params.id);
  if (!lesson) return res.status(404).json({ error: "Lesson not found" });
  res.json({ ...lesson, progress: req.state.grammarProgress[lesson.id] || null });
});

router.post("/:id/complete", asyncHandler(async (req, res) => {
  const lesson = grammarData.lessons.find((l) => l.id === req.params.id);
  if (!lesson) return res.status(404).json({ error: "Lesson not found" });
  // Which exercises were missed — kept so the learner can retry just those.
  const validIds = new Set(lesson.exercises.map((e) => e.id));
  const wrongIds = Array.isArray(req.body?.wrongIds)
    ? req.body.wrongIds.filter((id) => validIds.has(id)).slice(0, 50)
    : [];
  // Lessons follow the same spaced-repetition schedule as vocabulary; a lesson
  // with mistakes comes back sooner.
  const prev = req.state.grammarProgress[req.params.id];
  const grade = wrongIds.length >= Math.ceil(lesson.exercises.length / 2) ? "hard" : "good";
  req.state.grammarProgress[req.params.id] = { completedAt: Date.now(), wrongIds, ...scheduleNext(prev, grade) };
  await req.saveState();
  res.json({ ok: true });
}));

export default router;
