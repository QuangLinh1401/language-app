import { useEffect, useState } from "react";
import { api } from "../api.js";
import Icon from "../components/Icon.jsx";

export default function Progress() {
  const [progress, setProgress] = useState(null);
  const [vocabStats, setVocabStats] = useState(null);

  useEffect(() => {
    api.progress.get().then(setProgress);
    api.vocabulary.stats().then(setVocabStats);
  }, []);

  if (!progress) return <div className="loading">Loading...</div>;

  return (
    <div>
      <h1 className="page-title">Your Progress</h1>
      <p className="sub">A summary of your whole learning journey</p>

      <div className="card icon-trigger" style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "center" }}><Icon name="flame" size={30} /></div>
        <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 20, color: "var(--teal-deep)" }}>
          {progress.streak.current} day streak
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{progress.xp} XP earned</div>
      </div>

      <div className="stat-grid">
        <div className="stat-card"><b>{progress.wordsLearned}</b><span>Words learned</span></div>
        <div className="stat-card"><b>{progress.grammarCompleted}</b><span>Grammar lessons done</span></div>
        <div className="stat-card"><b>{progress.listeningCompleted}</b><span>Listening lessons done</span></div>
        <div className="stat-card"><b>{progress.readingCompleted}</b><span>Reading passages done</span></div>
      </div>

      {vocabStats && (
        <>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-soft)", margin: "18px 0 8px" }}>
            Vocabulary breakdown ({vocabStats.overall.total} words)
          </div>
          <div className="stat-grid">
            <div className="stat-card"><b>{vocabStats.overall.mastered}</b><span>Mastered</span></div>
            <div className="stat-card"><b>{vocabStats.overall.learning}</b><span>Still learning</span></div>
            <div className="stat-card"><b>{vocabStats.overall.new}</b><span>Not started</span></div>
            <div className="stat-card"><b>{Math.round((vocabStats.overall.mastered / vocabStats.overall.total) * 100)}%</b><span>Mastery rate</span></div>
          </div>

          <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-soft)", margin: "18px 0 8px" }}>
            By level
          </div>
          <div className="card" style={{ padding: 0 }}>
            {["A1", "A2", "B1", "B2"].map((lv, i) => {
              const s = vocabStats.byLevel[lv];
              const pct = s.total ? Math.round((s.mastered / s.total) * 100) : 0;
              return (
                <div key={lv} style={{ padding: "12px 14px", borderBottom: i < 3 ? "1px solid var(--line)" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 6 }}>
                    <b>{lv}</b>
                    <span style={{ color: "var(--ink-soft)" }}>{s.mastered}/{s.total} mastered</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
