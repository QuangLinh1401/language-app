import { useEffect, useState } from "react";
import { api } from "../api.js";
import AnimatedIcon from "../components/AnimatedIcon.jsx";
import Loading from "../components/Loading.jsx";

export default function Progress() {
  const [progress, setProgress] = useState(null);
  const [vocabStats, setVocabStats] = useState(null);

  useEffect(() => {
    api.progress.get().then(setProgress);
    api.vocabulary.stats().then(setVocabStats);
  }, []);

  if (!progress) return <Loading />;

  return (
    <div>
      <h1 className="page-title">Your Progress</h1>
      <p className="sub">A summary of your whole learning journey</p>

      <div className="card icon-trigger" style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <AnimatedIcon src="/icons/fire.lottie.json" fallback="/icons/fire.svg" size={34} />
        </div>
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

      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-soft)", margin: "18px 0 8px" }}>
        Achievements
      </div>
      <div className="badge-grid">
        {[
          { emoji: "🔥", label: "3-day streak", ok: progress.streak.current >= 3 },
          { emoji: "🔥", label: "7-day streak", ok: progress.streak.current >= 7 },
          { emoji: "🔥", label: "30-day streak", ok: progress.streak.current >= 30 },
          { emoji: "🌱", label: "10 words", ok: progress.wordsLearned >= 10 },
          { emoji: "📚", label: "50 words", ok: progress.wordsLearned >= 50 },
          { emoji: "🏆", label: "250 words", ok: progress.wordsLearned >= 250 },
          { emoji: "⭐", label: "10 mastered", ok: (vocabStats?.overall.mastered || 0) >= 10 },
          { emoji: "🌟", label: "50 mastered", ok: (vocabStats?.overall.mastered || 0) >= 50 },
          { emoji: "✏️", label: "10 grammar", ok: progress.grammarCompleted >= 10 },
          { emoji: "🎓", label: "All 86 grammar", ok: progress.grammarCompleted >= 86 },
          { emoji: "🎧", label: "10 listening", ok: progress.listeningCompleted >= 10 },
          { emoji: "📖", label: "10 reading", ok: progress.readingCompleted >= 10 }
        ].map((b) => (
          <div key={b.label} className={"badge" + (b.ok ? "" : " locked")} title={b.ok ? "Unlocked!" : "Keep going!"}>
            <div className="emoji">{b.emoji}</div>
            <div className="label">{b.label}</div>
          </div>
        ))}
      </div>

      {vocabStats && (
        <>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-soft)", margin: "18px 0 8px" }}>
            Vocabulary breakdown ({vocabStats.overall.total} words)
          </div>
          <div style={{ fontSize: 10.5, color: "var(--ink-soft)", marginBottom: 8 }}>
            A word climbs 4 stages: Seen → Recall → Context → Mastered. It only counts
            as mastered after you use it correctly several times.
          </div>
          <div className="stat-grid">
            <div className="stat-card"><b>{vocabStats.overall.recognition}</b><span>Lv1 · Seen</span></div>
            <div className="stat-card"><b>{vocabStats.overall.recall}</b><span>Lv2 · Recall</span></div>
            <div className="stat-card"><b>{vocabStats.overall.context}</b><span>Lv3 · In context</span></div>
            <div className="stat-card"><b>{vocabStats.overall.mastered}</b><span>Lv4 · Mastered</span></div>
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
