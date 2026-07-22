const KEY = "customExamples";

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

export function getCustomExample(wordId) {
  return readAll()[wordId] || "";
}

export function setCustomExample(wordId, text) {
  const all = readAll();
  const trimmed = text.trim();
  if (trimmed) all[wordId] = trimmed;
  else delete all[wordId];
  localStorage.setItem(KEY, JSON.stringify(all));
}
