import { useState } from "react";
import { api } from "../api.js";
import Icon from "./Icon.jsx";

export default function SettingsModal({ username, onClose, onReset, onLogout }) {
  const [busy, setBusy] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

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
            <Icon name="gear" size={22} /> Settings
          </h2>

          <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 6, marginBottom: 18 }}>
            Logged in as <b style={{ color: "var(--ink)" }}>{username}</b>. Your progress is saved
            to your account on the server (Neon Postgres).
          </div>

          <button
            className="btn-ghost"
            onClick={exportJson}
            disabled={busy === "export"}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <Icon name="chart" size={16} />
            {busy === "export" ? "Preparing file..." : "Download my data (JSON)"}
          </button>

          <button
            className="btn-ghost"
            onClick={onLogout}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <Icon name="cross" size={16} /> Log out
          </button>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
            {!confirmReset ? (
              <button
                className="btn-ghost"
                onClick={() => setConfirmReset(true)}
                style={{ borderColor: "var(--bad)", color: "var(--bad-deep)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <Icon name="cross" size={16} /> Reset all progress
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
