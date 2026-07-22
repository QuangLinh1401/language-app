import { useState } from "react";
import { api } from "../api.js";
import Icon from "./Icon.jsx";

export default function SettingsModal({ onClose, onReset }) {
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
        <button className="modal-close" onClick={onClose} aria-label="Đóng">✕</button>
        <div className="modal-scroll">
          <h2 className="page-title" style={{ fontSize: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="gear" size={22} /> Cài đặt
          </h2>

          <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 6, marginBottom: 18 }}>
            Tiến độ học của bạn được lưu trên máy chủ (Neon Postgres).
          </div>

          <button
            className="btn-ghost"
            onClick={exportJson}
            disabled={busy === "export"}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <Icon name="chart" size={16} />
            {busy === "export" ? "Đang tạo file..." : "Tải bản sao dữ liệu (JSON)"}
          </button>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
            {!confirmReset ? (
              <button
                className="btn-ghost"
                onClick={() => setConfirmReset(true)}
                style={{ borderColor: "var(--bad)", color: "var(--bad-deep)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <Icon name="cross" size={16} /> Đặt lại toàn bộ tiến độ
              </button>
            ) : (
              <div className="card" style={{ borderColor: "var(--bad)" }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--bad-deep)", marginBottom: 4 }}>
                  Xoá sạch toàn bộ tiến độ?
                </div>
                <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginBottom: 12 }}>
                  Hành động này không thể hoàn tác. Nên tải bản sao JSON trước.
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-ghost" style={{ marginTop: 0 }} onClick={() => setConfirmReset(false)}>Huỷ</button>
                  <button
                    className="btn-primary"
                    style={{ background: "var(--bad)", boxShadow: "0 4px 0 var(--bad-deep)" }}
                    onClick={doReset}
                    disabled={busy === "reset"}
                  >
                    {busy === "reset" ? "Đang xoá..." : "Xoá tất cả"}
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
