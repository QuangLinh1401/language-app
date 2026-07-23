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
  const list = grammarData.lessons.map((l) => ({
    id: l.id,
    level: l.level,
    title: l.title,
    completed: Boolean(req.state.grammarProgress[l.id])
  }));
  res.json(list);
});

router.get("/:id", (req, res) => {
  const lesson = grammarData.lessons.find((l) => l.id === req.params.id);
  if (!lesson) return res.status(404).json({ error: "Lesson not found" });
  res.json(lesson);
});

router.post("/:id/complete", asyncHandler(async (req, res) => {
  const lesson = grammarData.lessons.find((l) => l.id === req.params.id);
  if (!lesson) return res.status(404).json({ error: "Lesson not found" });
  // Lessons follow the same spaced-repetition schedule as vocabulary —
  // each completion pushes the next review further out.
  const prev = req.state.grammarProgress[req.params.id];
  req.state.grammarProgress[req.params.id] = { completedAt: Date.now(), ...scheduleNext(prev, "good") };
  await req.saveState();
  res.json({ ok: true });
}));

export default router;
