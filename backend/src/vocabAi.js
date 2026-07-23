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

function isChinese(word) {
  return word.id.startsWith("zh-");
}

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
    antonyms: [],
    distinguish: null,
    compounds: [],
    senses: [],
    characters: [],
    collocations: [],
    isFallback: true
  };
}

function buildEnglishInstruction(word) {
  return `You are helping a Vietnamese learner understand the English word "${word.word}" (level ${word.level}, meaning in Vietnamese: "${word.meaning}").

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
}

// Chinese words need different fields than English: pinyin is already shown
// elsewhere, so what's missing is the measure word (量词) for nouns, HSK-style
// grammar patterns, examples that carry pinyin + Vietnamese translation
// together (the UI only has room for one example string per line), and — for
// words that behave as more than one part of speech (e.g. 要 as verb, noun,
// and conjunction) — separate numbered senses per part of speech, each with
// its own example, rather than one flattened definition.
function buildChineseInstruction(word) {
  return `You are helping a Vietnamese learner of Mandarin Chinese understand the word "${word.word}" (pinyin: ${word.ipa}, HSK level ${word.level}, meaning in Vietnamese: "${word.meaning}").

Write a detailed but compact explanation IN VIETNAMESE (except the Chinese characters and pinyin themselves) covering:
- "partOfSpeech": a short summary label listing every part of speech this word can act as, separated by " · " (e.g. "động từ · danh từ · liên từ"). If it's a noun that takes a specific measure word (量词), append it, e.g. "danh từ · lượng từ: 个/张/本".
- "senses": group the word's distinct meanings BY PART OF SPEECH — one entry per part of speech the word actually functions as (most words only have 1, but polyfunctional words like 要 need several). Each entry has:
  - "partOfSpeech": Vietnamese label for this specific role (e.g. "Động từ", "Danh từ", "Liên từ", "Tính từ", "Phó từ").
  - "meanings": array of distinct senses under that part of speech, each with "meaning" (short Vietnamese gloss) and "example" formatted as exactly "<Chinese sentence> (<pinyin>) – <Vietnamese translation>". Cover the genuinely common, distinct senses (usually 1-4 per part of speech) — don't pad with near-duplicates.
- "usage": a short, practical usage note: register (formal/informal/written/spoken), common sentence patterns, and mistakes Vietnamese learners often make with it.
- "grammarNote": a short grammar note if relevant (e.g. sentence pattern like "把...了", verb-object separability, whether it needs 了/过/着, word order quirks). Empty string if nothing notable.
- "synonyms": up to 4 common near-synonyms (Chinese characters only, empty array if none fit).
- "antonyms": up to 4 common antonyms (Chinese characters only, empty array if none fit — many words genuinely have none).
- "distinguish": if this word is commonly confused with ONE specific near-synonym, a short Vietnamese note contrasting them (e.g. how "要" differs from "想"). Empty string if there's no notable confusion pair.
- "compounds": up to 6 common multi-character words that contain "${word.word}" as one of their characters (e.g. for 要: 需要, 重要, 主要), each formatted as "<compound word> (<pinyin>) – <Vietnamese meaning>". Empty array only if truly none exist.
- "collocations": up to 4 common fixed phrases or sentence patterns using this word (not full compound words, but usage patterns like "要么...要么..."), each formatted as "<Chinese phrase> (<pinyin>) – <Vietnamese meaning>" (empty array if none).
- "characters": one entry per DISTINCT character in "${word.word}" (skip repeats), each with:
  - "char": the character itself.
  - "hanViet": its Sino-Vietnamese reading (âm Hán Việt), in Vietnamese, e.g. "YẾU" for 要. Uppercase, single word/syllable.
  - "radical": the character's radical/bộ thủ, formatted as "<radical character> (bộ <Vietnamese radical name>)", e.g. "襾 (bộ á)". If you're not confident, give your best standard answer rather than leaving it blank.
  - "strokeCount": total stroke count as an integer.
  - "componentMeaning": for compound words only (2+ distinct characters), a one-line Vietnamese note on how the character contributes to the word's overall meaning. Empty string for single-character words.

Reply with ONLY valid JSON, no other text, in this exact structure:
{
  "partOfSpeech": "...",
  "senses": [{ "partOfSpeech": "...", "meanings": [{ "meaning": "...", "example": "..." }] }],
  "usage": "...",
  "grammarNote": "...",
  "synonyms": ["..."],
  "antonyms": ["..."],
  "distinguish": "...",
  "compounds": ["..."],
  "collocations": ["..."],
  "characters": [{ "char": "...", "hanViet": "...", "radical": "...", "strokeCount": 0, "componentMeaning": "..." }]
}`;
}

export async function generateWordDetail(word) {
  if (wordDetailCache.has(word.id)) return wordDetailCache.get(word.id);
  if (!hasApiKey()) return buildFallbackWordDetail(word);

  const chinese = isChinese(word);
  const instruction = chinese ? buildChineseInstruction(word) : buildEnglishInstruction(word);

  try {
    const raw = await callClaude([{ role: "user", content: instruction }], chinese ? 1800 : 700);
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    const senses = Array.isArray(parsed.senses)
      ? parsed.senses
          .filter((s) => s && typeof s.partOfSpeech === "string")
          .map((s) => ({
            partOfSpeech: s.partOfSpeech,
            meanings: Array.isArray(s.meanings)
              ? s.meanings
                  .filter((m) => m && m.meaning)
                  .map((m) => ({ meaning: m.meaning, example: m.example || "" }))
              : []
          }))
      : [];
    // Examples tab falls back to senses' examples when the flat list (English-only) is empty.
    const flatExamples = Array.isArray(parsed.examples)
      ? parsed.examples
      : senses.flatMap((s) => s.meanings.map((m) => m.example).filter(Boolean));
    const characters = Array.isArray(parsed.characters)
      ? parsed.characters
          .filter((c) => c && c.char)
          .map((c) => ({
            char: c.char,
            hanViet: c.hanViet || "",
            radical: c.radical || "",
            strokeCount: Number.isFinite(c.strokeCount) ? c.strokeCount : null,
            componentMeaning: c.componentMeaning || ""
          }))
      : [];
    const detail = {
      word: word.word,
      ipa: word.ipa,
      meaning: word.meaning,
      level: word.level,
      partOfSpeech: parsed.partOfSpeech || null,
      senses,
      usage: parsed.usage || null,
      examples: flatExamples,
      grammarNote: parsed.grammarNote || null,
      synonyms: Array.isArray(parsed.synonyms) ? parsed.synonyms : [],
      antonyms: Array.isArray(parsed.antonyms) ? parsed.antonyms : [],
      distinguish: parsed.distinguish || null,
      compounds: Array.isArray(parsed.compounds) ? parsed.compounds : [],
      collocations: Array.isArray(parsed.collocations) ? parsed.collocations : [],
      characters,
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
