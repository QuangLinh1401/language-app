import fetch from "node-fetch";

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-5-20250929";

function hasApiKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

async function callClaude(messages, maxTokens = 1200) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, messages })
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API error ${res.status}: ${errText}`);
  }
  const data = await res.json();
  const textBlock = (data.content || []).find((b) => b.type === "text");
  return textBlock ? textBlock.text : "";
}

function boldWordInSentence(sentence, word) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\b(${escaped})\\b`, "i");
  if (re.test(sentence)) return sentence.replace(re, "**$1**");
  return `${sentence} (**${word}**)`;
}

function buildFallbackPassage(words) {
  const connectors = ["", "Also, ", "Meanwhile, ", "In fact, ", "Interestingly, ", "At the same time, ", "Later, ", "Of course, "];
  const sentences = words.map((w, i) => {
    const base = w.example.endsWith(".") || w.example.endsWith("!") || w.example.endsWith("?") ? w.example : w.example + ".";
    const bolded = boldWordInSentence(base, w.word);
    const connector = connectors[i % connectors.length];
    return connector ? connector + bolded[0].toLowerCase() + bolded.slice(1) : bolded;
  });
  const text = sentences.join(" ");

  const meaningPool = words.map((w) => w.meaning);
  const questions = words.slice(0, Math.min(5, words.length)).map((w, i) => {
    const distractors = meaningPool.filter((m) => m !== w.meaning);
    const shuffled = distractors.sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [...shuffled, w.meaning].sort(() => Math.random() - 0.5);
    return {
      id: `pq-${i + 1}`,
      prompt: `What does "${w.word}" mean?`,
      options,
      answer: w.meaning
    };
  });

  return {
    text,
    boldWords: words.map((w) => w.word),
    wordIds: words.map((w) => w.id),
    questions,
    isFallback: true
  };
}

const wordDetailCache = new Map();

function buildFallbackWordDetail(word) {
  return {
    word: word.word,
    ipa: word.ipa,
    meaning: word.meaning,
    level: word.level,
    partOfSpeech: null,
    usage: null,
    examples: [word.example, word.phrase].filter(Boolean),
    grammarNote: null,
    synonyms: [],
    collocations: [],
    isFallback: true
  };
}

export async function generateWordDetail(word) {
  if (wordDetailCache.has(word.id)) return wordDetailCache.get(word.id);
  if (!hasApiKey()) return buildFallbackWordDetail(word);

  const instruction = `You are helping a Vietnamese learner understand the English word "${word.word}" (level ${word.level}, meaning in Vietnamese: "${word.meaning}").

Write a detailed but compact explanation IN VIETNAMESE (except the English word itself and the example sentences, which must be in English) covering:
- The part of speech (as a short Vietnamese label, e.g. "danh từ", "động từ", "tính từ").
- A short, practical explanation of how/when to use this word (grammar patterns, common structures, countable/uncountable if relevant, common mistakes Vietnamese learners make).
- 3 natural example sentences in English using the word in different contexts (different from "${word.example}").
- A short grammar note if relevant (e.g. irregular forms, prepositions commonly used with it). If nothing notable, use an empty string.
- Up to 4 common synonyms (English words only, empty array if none fit).
- Up to 4 common collocations/phrases using this word (English, empty array if none).

Reply with ONLY valid JSON, no other text, in this exact structure:
{
  "partOfSpeech": "...",
  "usage": "...",
  "examples": ["...", "...", "..."],
  "grammarNote": "...",
  "synonyms": ["..."],
  "collocations": ["..."]
}`;

  try {
    const raw = await callClaude([{ role: "user", content: instruction }], 700);
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    const detail = {
      word: word.word,
      ipa: word.ipa,
      meaning: word.meaning,
      level: word.level,
      partOfSpeech: parsed.partOfSpeech || null,
      usage: parsed.usage || null,
      examples: Array.isArray(parsed.examples) ? parsed.examples : [],
      grammarNote: parsed.grammarNote || null,
      synonyms: Array.isArray(parsed.synonyms) ? parsed.synonyms : [],
      collocations: Array.isArray(parsed.collocations) ? parsed.collocations : [],
      isFallback: false
    };
    wordDetailCache.set(word.id, detail);
    return detail;
  } catch (err) {
    console.error("generateWordDetail failed, falling back:", err.message);
    return buildFallbackWordDetail(word);
  }
}

export async function generateVocabPassage(words) {
  if (!hasApiKey()) return buildFallbackPassage(words);

  const wordList = words.map((w) => `${w.word} (${w.meaning})`).join(", ");
  const instruction = `You are creating an English reading exercise for a Vietnamese learner. Write a short, natural, coherent English passage (150-220 words) that uses ALL of these words at least once: ${wordList}.

Wrap every occurrence of each target word in double asterisks like **word** (use the exact word form given, but you may conjugate/pluralize naturally and still bold it, e.g. **walked** for "walk").

The passage should read like a real short story or article, not a list of sentences. Pick a level of vocabulary and grammar complexity that roughly matches the target words themselves.

After the passage, write 4 multiple-choice comprehension questions about the passage's content (not just word definitions), each with 4 options and one correct answer.

Reply with ONLY valid JSON, no other text, in this exact structure:
{
  "text": "the passage with **bolded** target words",
  "questions": [
    {"prompt": "...", "options": ["...", "...", "...", "..."], "answer": "..."}
  ]
}`;

  try {
    const raw = await callClaude([{ role: "user", content: instruction }]);
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    parsed.questions = parsed.questions.map((q, i) => ({ id: `pq-${i + 1}`, ...q }));
    parsed.boldWords = words.map((w) => w.word);
    parsed.wordIds = words.map((w) => w.id);
    return parsed;
  } catch (err) {
    console.error("generateVocabPassage failed, falling back:", err.message);
    return buildFallbackPassage(words);
  }
}
