import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { isDue } from "../srs.js";

// Cross-skill review queue: grammar/listening/reading lessons that were
// completed before and are now due again (same spaced-repetition scheduling
// as vocabulary). Per-language: `?lang=zh` queues Chinese lessons only.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const load = (f) => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "data", f), "utf-8"));
const DATA = {
  en: { grammar: load("grammar.json"), listening: load("listening.json"), reading: load("reading.json") },
  zh: { grammar: load("grammar-zh.json"), listening: load("listening-zh.json"), reading: load("reading-zh.json") }
};

const router = express.Router();

router.get("/", (req, res) => {
  const lang = req.query.lang === "zh" ? "zh" : "en";
  const { grammar, listening, reading } = DATA[lang];
  const items = [];
  const push = (skill, id, title, level, to, p) => {
    if (p && p.due && isDue(p)) items.push({ skill, id, title, level, to, due: p.due });
  };
  for (const l of grammar.lessons) {
    push("grammar", l.id, l.title, l.level, `/grammar/${l.id}`, req.state.grammarProgress[l.id]);
  }
  for (const l of listening.lessons) {
    push("listening", l.id, l.title, l.level, `/listening/${l.id}`, req.state.listeningProgress[l.id]);
  }
  for (const p of reading.passages) {
    push("reading", p.id, p.title, p.level, `/reading/${p.id}`, req.state.readingProgress[p.id]);
  }
  items.sort((a, b) => a.due - b.due); // most overdue first
  res.json({ count: items.length, items: items.slice(0, 8) });
});

export default router;
