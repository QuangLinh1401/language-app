const BASE = "/api";

const TOKEN_KEY = "language-app-token";
const USERNAME_KEY = "language-app-username";

export const auth = {
  token: () => localStorage.getItem(TOKEN_KEY),
  username: () => localStorage.getItem(USERNAME_KEY),
  save(token, username) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USERNAME_KEY, username);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
  }
};

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = auth.token();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { headers, ...options });
  if (res.status === 401 && !path.startsWith("/auth/")) {
    // Token missing/expired — drop it and send the user back to the login screen.
    auth.clear();
    window.dispatchEvent(new Event("auth-expired"));
    throw new Error("Not logged in");
  }
  if (!res.ok) {
    let message = `API error ${res.status}`;
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch {
      // non-JSON error body — keep the generic message
    }
    throw new Error(message);
  }
  return res.json();
}

export const api = {
  health: () => request("/health"),

  auth: {
    login: (username, password) =>
      request("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
    register: (username, password) =>
      request("/auth/register", { method: "POST", body: JSON.stringify({ username, password }) }),
    me: () => request("/auth/me")
  },

  progress: {
    get: () => request("/progress"),
    touch: (xp) => request("/progress/touch", { method: "POST", body: JSON.stringify({ xp }) }),
    export: () => request("/progress/export"),
    import: (state) => request("/progress/import", { method: "POST", body: JSON.stringify(state) }),
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
    grade: (wordId, grade, tier) =>
      request(`/vocabulary/words/${wordId}/grade`, { method: "POST", body: JSON.stringify({ grade, tier }) }),
    search: (q) => request(`/vocabulary/search?q=${encodeURIComponent(q)}`),
    wordOfDay: () => request("/vocabulary/word-of-day"),
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
