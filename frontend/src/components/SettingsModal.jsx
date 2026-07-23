import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import AnimatedIcon from "./AnimatedIcon.jsx";

const THEME_KEY = "language-app-theme";

export default function SettingsModal({ username, onClose, onReset, onLogout }) {
  const [busy, setBusy] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "light");
  const [xpGoal, setXpGoal] = useState(null);
  const [goalSaving, setGoalSaving] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    api.progress.get().then((p) => setXpGoal(p.dailyXpGoal || 50)).catch(() => {});
  }, []);

  async function adjustXpGoal(delta) {
    if (xpGoal == null || goalSaving) return;
    const next = Math.min(1000, Math.max(10, xpGoal + delta));
    if (next === xpGoal) return;
    setGoalSaving(true);
    try {
      await api.progress.updateSettings({ dailyXpGoal: next });
      setXpGoal(next);
    } finally {
      setGoalSaving(false);
    }
  }

  function applyTheme(next) {
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
    document.documentElement.dataset.theme = next;
  }

  async function importJson(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    setBusy("import");
    setImportMsg("");
    try {
      const text = await file.text();
      let state;
      try {
        state = JSON.parse(text);
      } catch {
        throw new Error("That file is not valid JSON.");
      }
      if (!window.confirm("Importing will REPLACE your current progress with this backup. Continue?")) {
        return;
      }
      await api.progress.import(state);
      onReset?.();
      onClose();
    } catch (err) {
      setImportMsg(err.message);
    } finally {
      setBusy("");
    }
  }

  async function exportJson() {
    setBusy("export");
    try {
      const state = await api.progress.export();
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `language-app-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy("");
    }
  }

  async function doReset() {
    setBusy("reset");
    try {
      await api.progress.reset();
      onReset?.();
      onClose();
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        <div className="modal-scroll">
          <h2 className="page-title" style={{ fontSize: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <AnimatedIcon src="/icons/gear.lottie.json" fallback="/icons/gear.svg" size={24} /> Settings
          </h2>

          <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 6, marginBottom: 18 }}>
            Logged in as <b style={{ color: "var(--ink)" }}>{username}</b>. Your progress is saved
            to your account on the server (Neon Postgres).
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6 }}>Theme</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button
              className="pill"
              onClick={() => applyTheme("light")}
              style={{
                flex: 1, justifyContent: "center", cursor: "pointer",
                background: theme === "light" ? "var(--teal)" : "var(--card)",
                color: theme === "light" ? "#fff" : "var(--teal-deep)",
                border: "1px solid var(--line)"
              }}
            >
              <img src="/icons/sun.svg" alt="" width={15} height={15} /> Light
            </button>
            <button
              className="pill"
              onClick={() => applyTheme("dark")}
              style={{
                flex: 1, justifyContent: "center", cursor: "pointer",
                background: theme === "dark" ? "var(--teal)" : "var(--card)",
                color: theme === "dark" ? "#fff" : "var(--teal-deep)",
                border: "1px solid var(--line)"
              }}
            >
              <img src="/icons/moon.svg" alt="" width={15} height={15} /> Dark
            </button>
          </div>

          <button
            className="btn-ghost"
            onClick={exportJson}
            disabled={busy === "export"}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <img src="/icons/save.svg" alt="" width={16} height={16} />
            {busy === "export" ? "Preparing file..." : "Download my data (JSON)"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingTop: 4 }}>
            <span style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 700, flex: 1 }}>Daily XP goal</span>
            <button className="icon-step" disabled={goalSaving || xpGoal == null || xpGoal <= 10} onClick={() => adjustXpGoal(-10)}>−</button>
            <span style={{ fontSize: 14, fontWeight: 800, color: "var(--teal-deep)", minWidth: 34, textAlign: "center" }}>
              {xpGoal == null ? "…" : xpGoal}
            </span>
            <button className="icon-step" disabled={goalSaving || xpGoal == null || xpGoal >= 1000} onClick={() => adjustXpGoal(10)}>+</button>
          </div>

          <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: "none" }} onChange={importJson} />
          <button
            className="btn-ghost"
            onClick={() => fileRef.current?.click()}
            disabled={busy === "import"}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <img src="/icons/folder.svg" alt="" width={16} height={16} />
            {busy === "import" ? "Importing..." : "Import data from backup (JSON)"}
          </button>
          {importMsg && (
            <div style={{ fontSize: 11.5, color: "var(--bad-deep)", fontWeight: 700, marginTop: 6, textAlign: "center" }}>
              {importMsg}
            </div>
          )}

          <button
            className="btn-ghost"
            onClick={onLogout}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <img src="/icons/door.svg" alt="" width={16} height={16} /> Log out
          </button>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
            {!confirmReset ? (
              <button
                className="btn-ghost"
                onClick={() => setConfirmReset(true)}
                style={{ borderColor: "var(--bad)", color: "var(--bad-deep)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <img src="/icons/trash.svg" alt="" width={16} height={16} /> Reset all progress
              </button>
            ) : (
              <div className="card" style={{ borderColor: "var(--bad)" }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--bad-deep)", marginBottom: 4 }}>
                  Delete all your progress?
                </div>
                <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginBottom: 12 }}>
                  This cannot be undone. Consider downloading a JSON backup first.
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-ghost" style={{ marginTop: 0 }} onClick={() => setConfirmReset(false)}>Cancel</button>
                  <button
                    className="btn-primary"
                    style={{ background: "var(--bad)", boxShadow: "0 4px 0 var(--bad-deep)" }}
                    onClick={doReset}
                    disabled={busy === "reset"}
                  >
                    {busy === "reset" ? "Deleting..." : "Delete everything"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
