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
  const list = listeningData.lessons.map((l) => ({
    id: l.id,
    level: l.level,
    topic: l.topic,
    title: l.title,
    completed: Boolean(req.state.listeningProgress[l.id])
  }));
  res.json(list);
});

router.get("/:id", (req, res) => {
  const lesson = listeningData.lessons.find((l) => l.id === req.params.id);
  if (!lesson) return res.status(404).json({ error: "Lesson not found" });
  res.json(lesson);
});

router.post("/:id/complete", asyncHandler(async (req, res) => {
  const { score } = req.body;
  const lesson = listeningData.lessons.find((l) => l.id === req.params.id);
  if (!lesson) return res.status(404).json({ error: "Lesson not found" });
  // A weak score brings the lesson back sooner (SRS "hard"), a strong one
  // pushes the next review further out ("good").
  const grade = score != null && lesson.questions.length > 0 && score / lesson.questions.length < 0.7 ? "hard" : "good";
  const prev = req.state.listeningProgress[req.params.id];
  req.state.listeningProgress[req.params.id] = {
    completedAt: Date.now(),
    score: score ?? null,
    ...scheduleNext(prev, grade)
  };
  await req.saveState();
  res.json({ ok: true });
}));

export default router;
