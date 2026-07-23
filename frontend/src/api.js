const BASE = "/api";

// The user's LOCAL date (YYYY-MM-DD) — sent with daily-reset requests so the
// server never has to guess the timezone ("en-CA" formats as YYYY-MM-DD).
export function localDate() {
  return new Date().toLocaleDateString("en-CA");
}

// Current study language: "en" (English) or "zh" (Chinese, HSK).
export function appLang() {
  return localStorage.getItem("language-app-mode") === "zh" ? "zh" : "en";
}

export function setAppLang(lang) {
  localStorage.setItem("language-app-mode", lang === "zh" ? "zh" : "en");
}

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

async function request(path, options = {}, retried = false) {
  const headers = { "Content-Type": "application/json" };
  const token = auth.token();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, { headers, ...options });
  } catch (err) {
    // Network failure (offline, DNS, aborted) — retry once after a short wait.
    if (!retried) {
      await new Promise((r) => setTimeout(r, 800));
      return request(path, options, true);
    }
    window.dispatchEvent(new CustomEvent("api-error", { detail: "Mất kết nối mạng — kiểm tra internet rồi thử lại." }));
    throw err;
  }

  // Transient server errors (cold start, gateway hiccup) also get one retry.
  if (res.status >= 500 && !retried) {
    await new Promise((r) => setTimeout(r, 800));
    return request(path, options, true);
  }

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
    if (res.status >= 500) {
      window.dispatchEvent(new CustomEvent("api-error", { detail: "Máy chủ đang gặp trục trặc — thử lại nhé." }));
    }
    throw new Error(message);
  }
  window.dispatchEvent(new Event("api-ok"));
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
    touch: (xp) => request("/progress/touch", { method: "POST", body: JSON.stringify({ xp, date: localDate() }) }),
    export: () => request("/progress/export"),
    updateSettings: (payload) =>
      request("/progress/settings", { method: "PUT", body: JSON.stringify(payload) }),
    import: (state) => request("/progress/import", { method: "POST", body: JSON.stringify(state) }),
    reset: () => request("/progress/reset", { method: "POST" })
  },

  vocabulary: {
    topics: () => request(`/vocabulary/topics?lang=${appLang()}`),
    topic: (id) => request(`/vocabulary/topics/${id}`),
    stats: () => request(`/vocabulary/stats?lang=${appLang()}`),
    dailySession: (level) =>
      request(`/vocabulary/daily-session?date=${localDate()}&lang=${appLang()}${level ? `&level=${level}` : ""}`),
    review: (opts = {}) => {
      const params = new URLSearchParams();
      params.set("lang", appLang());
      if (opts.level) params.set("level", opts.level);
      if (opts.status) params.set("status", opts.status);
      if (opts.limit) params.set("limit", opts.limit);
      return request(`/vocabulary/review?${params.toString()}`);
    },
    grade: (wordId, grade, tier) =>
      request(`/vocabulary/words/${wordId}/grade`, { method: "POST", body: JSON.stringify({ grade, tier }) }),
    search: (q) => request(`/vocabulary/search?q=${encodeURIComponent(q)}&lang=${appLang()}`),
    wordOfDay: () => request(`/vocabulary/word-of-day?date=${localDate()}&lang=${appLang()}`),
    practiceReading: (payload) =>
      request("/vocabulary/practice-reading", { method: "POST", body: JSON.stringify({ ...payload, lang: appLang() }) }),
    wordDetail: (wordId) => request(`/vocabulary/words/${wordId}/detail`),
    getSettings: () => request("/vocabulary/settings"),
    updateSettings: (payload) =>
      request("/vocabulary/settings", { method: "PUT", body: JSON.stringify(payload) })
  },

  grammar: {
    list: () => request(`/grammar?lang=${appLang()}`),
    lesson: (id) => request(`/grammar/${id}`),
    complete: (id, wrongIds = []) =>
      request(`/grammar/${id}/complete`, { method: "POST", body: JSON.stringify({ wrongIds }) })
  },

  listening: {
    list: () => request(`/listening?lang=${appLang()}`),
    lesson: (id) => request(`/listening/${id}`),
    complete: (id, score, wrongIds = []) =>
      request(`/listening/${id}/complete`, { method: "POST", body: JSON.stringify({ score, wrongIds }) })
  },

  reading: {
    list: () => request(`/reading?lang=${appLang()}`),
    passage: (id) => request(`/reading/${id}`),
    complete: (id, score, timeSeconds, wrongIds = []) =>
      request(`/reading/${id}/complete`, { method: "POST", body: JSON.stringify({ score, timeSeconds, wrongIds }) })
  },

  speaking: {
    shadowing: () => request(`/speaking/shadowing?lang=${appLang()}`),
    dialogues: () => request(`/speaking/dialogues?lang=${appLang()}`)
  },

  reviewQueue: () => request(`/review-queue?lang=${appLang()}`)
};
