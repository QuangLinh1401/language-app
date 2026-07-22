import fetch from "node-fetch";

const API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en";
const cache = new Map();

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
      meanings.push({ partOfSpeech: m.partOfSpeech, definitions: definitions.slice(0, 6) });
      for (const s of m.synonyms || []) synonyms.add(s);
      for (const a of m.antonyms || []) antonyms.add(a);
    }
    if (!sourceUrl && entry.sourceUrls && entry.sourceUrls[0]) sourceUrl = entry.sourceUrls[0];
  }

  return {
    found: meanings.length > 0,
    phonetics: phonetics.slice(0, 3),
    meanings: meanings.slice(0, 6),
    synonyms: [...synonyms].slice(0, 6),
    antonyms: [...antonyms].slice(0, 6),
    sourceUrl
  };
}

export async function fetchDictionaryEntry(word) {
  const key = word.toLowerCase().trim();
  if (cache.has(key)) return cache.get(key);

  const notFound = { found: false, phonetics: [], meanings: [], synonyms: [], antonyms: [], sourceUrl: null };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${API_URL}/${encodeURIComponent(key)}`, { signal: controller.signal });
    if (!res.ok) {
      cache.set(key, notFound);
      return notFound;
    }
    const data = await res.json();
    const result = normalize(Array.isArray(data) ? data : []);
    cache.set(key, result);
    return result;
  } catch (err) {
    return notFound;
  } finally {
    clearTimeout(timeout);
  }
}
