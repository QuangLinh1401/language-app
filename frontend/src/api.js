const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

export const api = {
  health: () => request("/health"),

  progress: {
    get: () => request("/progress"),
    touch: (xp) => request("/progress/touch", { method: "POST", body: JSON.stringify({ xp }) }),
    export: () => request("/progress/export"),
    reset: () => request("/progress/reset", { method: "POST" })
  },

  vocabulary: {
    topics: () => request("/vocabulary/topics"),
    topic: (id) => request(`/vocabulary/topics/${id}`),
    stats: () => request("/vocabulary/stats"),
    dailySession: (level) => request(`/vocabulary/daily-session${level ? `?level=${level}` : ""}`),
    review: (opts = {}) => {
      const params = new URLSearchParams();
      if (opts.level) params.set("level", opts.level);
      if (opts.status) params.set("status", opts.status);
      if (opts.limit) params.set("limit", opts.limit);
      const qs = params.toString();
      return request(`/vocabulary/review${qs ? `?${qs}` : ""}`);
    },
    grade: (wordId, grade) =>
      request(`/vocabulary/words/${wordId}/grade`, { method: "POST", body: JSON.stringify({ grade }) }),
    practiceReading: (payload) =>
      request("/vocabulary/practice-reading", { method: "POST", body: JSON.stringify(payload) }),
    wordDetail: (wordId) => request(`/vocabulary/words/${wordId}/detail`),
    getSettings: () => request("/vocabulary/settings"),
    updateSettings: (payload) =>
      request("/vocabulary/settings", { method: "PUT", body: JSON.stringify(payload) })
  },

  grammar: {
    list: () => request("/grammar"),
    lesson: (id) => request(`/grammar/${id}`),
    complete: (id) => request(`/grammar/${id}/complete`, { method: "POST" })
  },

  listening: {
    list: () => request("/listening"),
    lesson: (id) => request(`/listening/${id}`),
    complete: (id, score) =>
      request(`/listening/${id}/complete`, { method: "POST", body: JSON.stringify({ score }) })
  },

  reading: {
    list: () => request("/reading"),
    passage: (id) => request(`/reading/${id}`),
    complete: (id, score, timeSeconds) =>
      request(`/reading/${id}/complete`, { method: "POST", body: JSON.stringify({ score, timeSeconds }) })
  },

  speaking: {
    shadowing: () => request("/speaking/shadowing"),
    dialogues: () => request("/speaking/dialogues")
  }
};
