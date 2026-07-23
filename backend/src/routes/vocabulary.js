import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getDailyNewWordIds, addDailyNewWordIds, getDailyNewLimit, setDailyNewLimit, validClientDate } from "../db.js";
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

// 4-tier vocabulary knowledge model (simplified Vocabulary Knowledge Scale):
//   recognition -> recall -> context -> production
// Each tier counts correct answers in that kind of exercise. A word is only
// "mastered" after repeated correct *production* use — finishing a game alone
// doesn't count as knowing the word.
const TIERS = ["recognition", "recall", "context", "production"];

function tierCounts(progress) {
  const t = (progress && progress.tiers) || {};
  return {
    recognition: t.recognition || 0,
    // Legacy save files predate tiers: their flashcard reps were recall-style,
    // so map them in rather than resetting everyone to zero.
    recall: t.recall !== undefined ? t.recall : progress ? Math.min(progress.reps || 0, 3) : 0,
    context: t.context || 0,
    production: t.production || 0
  };
}

function wordStatus(progress) {
  if (!progress) return "new";
  const t = tierCounts(progress);
  if (t.production >= 3) return "mastered";
  if (t.context >= 2) return "context";
  if (t.recall >= 2) return "recall";
  return "recognition";
}

// Statuses that mean "started but not yet mastered".
const LEARNING_STATUSES = ["recognition", "recall", "context"];

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
  const empty = () => ({ total: 0, new: 0, recognition: 0, recall: 0, context: 0, mastered: 0, learning: 0 });
  const byLevel = {};
  for (const lv of levels) byLevel[lv] = empty();
  for (const w of allWords()) {
    const status = wordStatus(req.state.wordProgress[w.id]);
    byLevel[w.level].total += 1;
    byLevel[w.level][status] += 1;
    if (LEARNING_STATUSES.includes(status)) byLevel[w.level].learning += 1;
  }
  const overall = empty();
  for (const lv of levels) {
    for (const key of Object.keys(overall)) overall[key] += byLevel[lv][key];
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
    words = words.filter((w) => LEARNING_STATUSES.includes(w.status));
  } else if (TIERS.includes(status) || status === "mastered") {
    words = words.filter((w) => w.status === status);
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
  const { level, date } = req.query; // date = client's local YYYY-MM-DD
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

  const introducedToday = getDailyNewWordIds(req.state, date);
  const alreadyPicked = words.filter((w) => w.status === "new" && introducedToday.includes(w.id));
  const remaining = Math.max(0, dailyNewLimit - introducedToday.length);

  const freshCandidates = words
    .filter((w) => w.status === "new" && !introducedToday.includes(w.id))
    .sort((a, b) => (a.frequency || 0) - (b.frequency || 0));
  const freshPicked = remaining > 0 ? freshCandidates.slice(0, remaining) : [];
  if (freshPicked.length > 0) {
    addDailyNewWordIds(req.state, freshPicked.map((w) => w.id), date);
    await req.saveState();
  }

  const newWords = [...alreadyPicked, ...freshPicked];

  res.json({
    due,
    newWords,
    dailyNewLimit,
    newIntroducedToday: getDailyNewWordIds(req.state, date).length
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
  const { grade, tier } = req.body;
  if (!["forgot", "hard", "good", "easy"].includes(grade)) {
    return res.status(400).json({ error: "Invalid grade" });
  }
  if (tier !== undefined && !TIERS.includes(tier)) {
    return res.status(400).json({ error: "Invalid tier" });
  }
  const prevState = req.state.wordProgress[req.params.id];
  const nextState = scheduleNext(prevState, grade);
  // Carry tier progress forward, then apply this answer to its tier:
  // correct (good/easy) climbs, forgot slips back, hard holds steady.
  const tiers = tierCounts(prevState);
  if (tier) {
    if (grade === "good" || grade === "easy") tiers[tier] += 1;
    else if (grade === "forgot") tiers[tier] = Math.max(0, tiers[tier] - 1);
  }
  nextState.tiers = tiers;
  req.state.wordProgress[req.params.id] = nextState;
  await req.saveState();
  res.json({ wordId: req.params.id, state: nextState, status: wordStatus(nextState) });
}));

// Word of the day: deterministic daily pick keyed by the CLIENT's local date,
// so it flips at the user's midnight, not 7 AM Vietnam time (UTC boundary).
router.get("/word-of-day", (req, res) => {
  const words = allWords();
  const today = validClientDate(req.query.date) || new Date().toISOString().slice(0, 10);
  let h = 0;
  for (const ch of today) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const w = words[h % words.length];
  const progress = req.state.wordProgress[w.id] || null;
  res.json({ ...w, progress, status: wordStatus(progress) });
});

// Search across all 5000 words by English word or Vietnamese meaning.
router.get("/search", (req, res) => {
  const q = (req.query.q || "").trim().toLowerCase();
  if (!q) return res.json({ count: 0, words: [] });
  const matches = allWords().filter(
    (w) => w.word.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q)
  );
  // Words starting with the query first, then by frequency.
  matches.sort((a, b) => {
    const aStarts = a.word.toLowerCase().startsWith(q) ? 0 : 1;
    const bStarts = b.word.toLowerCase().startsWith(q) ? 0 : 1;
    if (aStarts !== bStarts) return aStarts - bStarts;
    return (a.frequency || 0) - (b.frequency || 0);
  });
  const words = matches.slice(0, 50).map((w) => {
    const progress = req.state.wordProgress[w.id] || null;
    return { ...w, progress, status: wordStatus(progress) };
  });
  res.json({ count: matches.length, words });
});

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
