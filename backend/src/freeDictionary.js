import fetch from "node-fetch";

const API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en";
const WIKI_URL = "https://en.wiktionary.org/api/rest_v1/page/definition";
const cache = new Map();

function stripHtml(s) {
  return (s || "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(entries) {
  const phonetics = [];
  const seenPhonetics = new Set();
  const meanings = [];
  const synonyms = new Set();
  const antonyms = new Set();
  let sourceUrl = null;

  for (const entry of entries) {
    for (const p of entry.phonetics || []) {
      const key = `${p.text || ""}|${p.audio || ""}`;
      if ((p.text || p.audio) && !seenPhonetics.has(key)) {
        seenPhonetics.add(key);
        phonetics.push({ text: p.text || "", audio: p.audio || "" });
      }
    }
    for (const m of entry.meanings || []) {
      const definitions = (m.definitions || []).map((d) => ({
        definition: d.definition,
        example: d.example || null
      }));
      // Surface example-bearing senses first so more real usage examples make the cut.
      definitions.sort((a, b) => (b.example ? 1 : 0) - (a.example ? 1 : 0));
      meanings.push({ partOfSpeech: m.partOfSpeech, definitions: definitions.slice(0, 10) });
      for (const s of m.synonyms || []) synonyms.add(s);
      for (const a of m.antonyms || []) antonyms.add(a);
    }
    if (!sourceUrl && entry.sourceUrls && entry.sourceUrls[0]) sourceUrl = entry.sourceUrls[0];
  }

  return {
    found: meanings.length > 0,
    phonetics: phonetics.slice(0, 3),
    meanings: meanings.slice(0, 8),
    synonyms: [...synonyms].slice(0, 10),
    antonyms: [...antonyms].slice(0, 10),
    sourceUrl
  };
}

async function fetchFromDictionaryApi(term) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(`${API_URL}/${encodeURIComponent(term)}`, { signal: controller.signal });
    if (!res.ok) return null;
    const data = await res.json();
    const result = normalize(Array.isArray(data) ? data : []);
    return result.found ? result : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Wiktionary's own REST API covers far more entries than dictionaryapi.dev —
// including compounds and phrasal verbs like "bus stop" or "get on".
async function fetchFromWiktionary(term) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const page = term.replace(/ /g, "_");
    const res = await fetch(`${WIKI_URL}/${encodeURIComponent(page)}`, {
      signal: controller.signal,
      headers: { accept: "application/json", "user-agent": "language-app (learning project)" }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const langEntries = data.en || [];
    const meanings = [];
    for (const e of langEntries) {
      const definitions = (e.definitions || [])
        .map((d) => {
          const def = stripHtml(d.definition);
          // Keep up to 3 usage examples per sense (they feed the Examples tab too).
          const raw = (d.parsedExamples || []).map((p) => p.example).concat(d.examples || []);
          const examples = [...new Set(raw.map(stripHtml).filter(Boolean))].slice(0, 3);
          return { definition: def, example: examples[0] || null, extraExamples: examples.slice(1) };
        })
        .filter((d) => d.definition);
      if (definitions.length > 0) {
        definitions.sort((a, b) => (b.example ? 1 : 0) - (a.example ? 1 : 0));
        meanings.push({
          partOfSpeech: (e.partOfSpeech || "").toLowerCase() || "phrase",
          definitions: definitions.slice(0, 10)
        });
      }
    }
    if (meanings.length === 0) return null;
    return {
      found: true,
      phonetics: [],
      meanings: meanings.slice(0, 6),
      synonyms: [],
      antonyms: [],
      sourceUrl: `https://en.wiktionary.org/wiki/${encodeURIComponent(page)}`
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchDictionaryEntry(word) {
  const key = word.toLowerCase().trim();
  if (cache.has(key)) return cache.get(key);

  // Our word list uses qualifiers like "trunk (car)" — look up the bare term.
  const clean = key.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim() || key;

  const notFound = { found: false, phonetics: [], meanings: [], synonyms: [], antonyms: [], sourceUrl: null };

  // dictionaryapi.dev first (has audio + synonyms), Wiktionary as fallback
  // (much wider coverage, especially multi-word entries).
  const result = (await fetchFromDictionaryApi(clean)) || (await fetchFromWiktionary(clean)) || notFound;
  cache.set(key, result);
  return result;
}
