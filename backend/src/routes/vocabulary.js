import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getDailyNewWordIds, addDailyNewWordIds, getDailyNewLimit, setDailyNewLimit } from "../db.js";
import { scheduleNext, isDue } from "../srs.js";
import { generateVocabPassage, generateWordDetail } from "../vocabAi.js";
import { fetchDictionaryEntry } from "../freeDictionary.js";
import { asyncHandler } from "../auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, "..", "..", "data", "vocabulary.json");
const vocabData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

const router = express.Router();

function allWords() {
  const words = [];
  for (const topic of vocabData.topics) {
    for (const w of topic.words) {
      words.push({ ...w, topicId: topic.id, topicName: topic.name });
    }
  }
  return words;
}

function wordStatus(progress) {
  if (!progress) return "new";
  if (progress.reps >= 3 && (progress.lastGrade === "good" || progress.lastGrade === "easy")) return "mastered";
  return "learning";
}

router.get("/topics", (req, res) => {
  const summary = vocabData.topics.map((t) => {
    const total = t.words.length;
    const learned = t.words.filter((w) => req.state.wordProgress[w.id]).length;
    return { id: t.id, name: t.name, emoji: t.emoji, total, learned };
  });
  res.json(summary);
});

router.get("/topics/:id", (req, res) => {
  const topic = vocabData.topics.find((t) => t.id === req.params.id);
  if (!topic) return res.status(404).json({ error: "Topic not found" });
  const words = topic.words
    .map((w) => {
      const progress = req.state.wordProgress[w.id] || null;
      return { ...w, progress, status: wordStatus(progress) };
    })
    .sort((a, b) => (a.frequency || 0) - (b.frequency || 0));
  res.json({ id: topic.id, name: topic.name, emoji: topic.emoji, words });
});

router.get("/stats", (req, res) => {
  const levels = ["A1", "A2", "B1", "B2"];
  const byLevel = {};
  for (const lv of levels) byLevel[lv] = { total: 0, new: 0, learning: 0, mastered: 0 };
  for (const w of allWords()) {
    const status = wordStatus(req.state.wordProgress[w.id]);
    byLevel[w.level].total += 1;
    byLevel[w.level][status] += 1;
  }
  const overall = { total: 0, new: 0, learning: 0, mastered: 0 };
  for (const lv of levels) {
    overall.total += byLevel[lv].total;
    overall.new += byLevel[lv].new;
    overall.learning += byLevel[lv].learning;
    overall.mastered += byLevel[lv].mastered;
  }
  res.json({ overall, byLevel });
});

router.get("/review", (req, res) => {
  const { level, status } = req.query;
  const limit = Math.min(parseInt(req.query.limit) || 30, 100);

  let words = allWords().map((w) => {
    const progress = req.state.wordProgress[w.id] || null;
    return { ...w, progress, status: wordStatus(progress) };
  });

  if (level) words = words.filter((w) => w.level === level);

  if (status === "new") {
    words = words.filter((w) => w.status === "new");
  } else if (status === "learning") {
    words = words.filter((w) => w.status === "learning");
  } else if (status === "mastered") {
    words = words.filter((w) => w.status === "mastered");
  } else if (status === "all") {
    // no extra filtering
  } else {
    // default & status=due: only words that have been studied before and are due again.
    // Brand-new words are handled separately via /daily-session so they don't flood the queue.
    words = words.filter((w) => w.progress && isDue(w.progress));
  }

  // most overdue / never-studied first
  words.sort((a, b) => (a.progress?.due || 0) - (b.progress?.due || 0));

  res.json({ count: words.length, words: words.slice(0, limit) });
});

router.get("/daily-session", asyncHandler(async (req, res) => {
  const { level } = req.query;
  const dailyNewLimit = getDailyNewLimit(req.state);

  let words = allWords().map((w) => {
    const progress = req.state.wordProgress[w.id] || null;
    return { ...w, progress, status: wordStatus(progress) };
  });
  if (level) words = words.filter((w) => w.level === level);

  const due = words
    .filter((w) => w.progress && isDue(w.progress))
    .sort((a, b) => a.progress.due - b.progress.due)
    .slice(0, 60);

  const introducedToday = getDailyNewWordIds(req.state);
  const alreadyPicked = words.filter((w) => w.status === "new" && introducedToday.includes(w.id));
  const remaining = Math.max(0, dailyNewLimit - introducedToday.length);

  const freshCandidates = words
    .filter((w) => w.status === "new" && !introducedToday.includes(w.id))
    .sort((a, b) => (a.frequency || 0) - (b.frequency || 0));
  const freshPicked = remaining > 0 ? freshCandidates.slice(0, remaining) : [];
  if (freshPicked.length > 0) {
    addDailyNewWordIds(req.state, freshPicked.map((w) => w.id));
    await req.saveState();
  }

  const newWords = [...alreadyPicked, ...freshPicked];

  res.json({
    due,
    newWords,
    dailyNewLimit,
    newIntroducedToday: getDailyNewWordIds(req.state).length
  });
}));

router.get("/settings", (req, res) => {
  res.json({ dailyNewLimit: getDailyNewLimit(req.state) });
});

router.put("/settings", asyncHandler(async (req, res) => {
  const { dailyNewLimit } = req.body;
  const n = parseInt(dailyNewLimit, 10);
  if (!Number.isInteger(n) || n < 1 || n > 200) {
    return res.status(400).json({ error: "dailyNewLimit must be an integer between 1 and 200" });
  }
  setDailyNewLimit(req.state, n);
  await req.saveState();
  res.json({ dailyNewLimit: n });
}));

router.get("/words/:id/detail", asyncHandler(async (req, res) => {
  const word = allWords().find((w) => w.id === req.params.id);
  if (!word) return res.status(404).json({ error: "Word not found" });
  const progress = req.state.wordProgress[word.id] || null;
  const [detail, dictionary] = await Promise.all([
    generateWordDetail(word),
    fetchDictionaryEntry(word.word)
  ]);
  res.json({ ...word, ...detail, dictionary, progress });
}));

router.post("/words/:id/grade", asyncHandler(async (req, res) => {
  const { grade } = req.body;
  if (!["forgot", "hard", "good", "easy"].includes(grade)) {
    return res.status(400).json({ error: "Invalid grade" });
  }
  const prevState = req.state.wordProgress[req.params.id];
  const nextState = scheduleNext(prevState, grade);
  req.state.wordProgress[req.params.id] = nextState;
  await req.saveState();
  res.json({ wordId: req.params.id, state: nextState });
}));

router.post("/practice-reading", asyncHandler(async (req, res) => {
  const { wordIds, level, count } = req.body;
  const words = allWords();

  let target = [];
  if (Array.isArray(wordIds) && wordIds.length > 0) {
    target = words.filter((w) => wordIds.includes(w.id));
  } else {
    let pool = words.map((w) => ({ ...w, progress: req.state.wordProgress[w.id] || null }));
    if (level) pool = pool.filter((w) => w.level === level);
    pool = pool
      .map((w) => ({ ...w, status: wordStatus(w.progress) }))
      .filter((w) => w.status !== "mastered")
      .sort((a, b) => (a.progress?.due || 0) - (b.progress?.due || 0));
    target = pool.slice(0, count || 8);
  }

  if (target.length === 0) return res.status(400).json({ error: "No words available to practice" });

  const passage = await generateVocabPassage(target);
  res.json(passage);
}));

export default router;
