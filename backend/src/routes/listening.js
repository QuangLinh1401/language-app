import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "../db.js";

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
    completed: Boolean(db.data.listeningProgress[l.id])
  }));
  res.json(list);
});

router.get("/:id", (req, res) => {
  const lesson = listeningData.lessons.find((l) => l.id === req.params.id);
  if (!lesson) return res.status(404).json({ error: "Lesson not found" });
  res.json(lesson);
});

router.post("/:id/complete", async (req, res) => {
  const { score } = req.body;
  const lesson = listeningData.lessons.find((l) => l.id === req.params.id);
  if (!lesson) return res.status(404).json({ error: "Lesson not found" });
  db.data.listeningProgress[req.params.id] = { completedAt: Date.now(), score: score ?? null };
  await db.write();
  res.json({ ok: true });
});

export default router;
