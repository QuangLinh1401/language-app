import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, auth } from "../api.js";
import Icon from "../components/Icon.jsx";

export default function Home() {
  const [progress, setProgress] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    api.progress.touch(5).then(() => api.progress.get()).then(setProgress);
    api.vocabulary.dailySession().then(setSession);
  }, []);

  const modules = [
    { to: "/vocabulary", iconName: "book", bg: "#EAF3F1", name: "Vocabulary", desc: "3000+ words, A1 to B2" },
    { to: "/grammar", iconName: "pencil-ruler", bg: "#F1EAF7", name: "Grammar", desc: "86 lessons, A1 to B2" },
    { to: "/listening", iconName: "headphones", bg: "#EAF0F7", name: "Listening", desc: "30 listening lessons" },
    { to: "/reading", iconName: "newspaper", bg: "#FCEFE6", name: "Reading", desc: "20 passages + quizzes" },
    { to: "/speaking", iconName: "mic", bg: "#FDEBEA", name: "Speaking", desc: "Shadowing & dialogues" },
    { to: "/progress", iconName: "chart", bg: "#FFF3E4", name: "Progress", desc: "See your learning stats" }
  ];

  return (
    <div>
      {/* paddingRight leaves room for the floating settings gear (top-right of the app shell) */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingRight: 44 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Hi {auth.username() || "there"} 👋</div>
          <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>Let's learn some English today</div>
        </div>
        <div className="pill" style={{ background: "#FFF3E4", borderColor: "#F3DCAE", color: "#B5720F" }}>
          <Icon name="flame" size={16} />
          {progress ? progress.streak.current : "…"} days
        </div>
      </div>

      <div className="goal-ticket">
        <div className="eyebrow">Quick stats</div>
        <h3>{progress ? `${progress.wordsLearned} words · ${progress.grammarCompleted} grammar lessons` : "Loading..."}</h3>
        <div style={{ fontSize: 12 }}>
          {progress ? `${progress.xp} XP earned — keep it up!` : ""}
        </div>
      </div>

      {session && session.due.length > 0 && (
        <Link to="/vocabulary/review" className="review-banner">
          <Icon name="repeat" size={20} />
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 12.5, display: "block" }}>{session.due.length} words to review</b>
            <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>Studied before, due again today</span>
          </div>
          <div style={{ fontSize: 16 }}>›</div>
        </Link>
      )}

      {session && session.newWords.length > 0 && (
        <Link to="/vocabulary/review" className="review-banner" style={{ background: "#EAF0F7", borderColor: "#CBDCF2" }}>
          <Icon name="sparkle" size={20} />
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 12.5, display: "block" }}>{session.newWords.length} new words to learn</b>
            <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>{session.newIntroducedToday}/{session.dailyNewLimit} introduced today</span>
          </div>
          <div style={{ fontSize: 16 }}>›</div>
        </Link>
      )}

      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 8 }}>
        Your 5 skills
      </div>
      <div className="module-grid">
        {modules.map((m) => (
          <Link key={m.to} to={m.to} className="mod-card">
            <div className="ic" style={{ background: m.bg }}>
              <Icon name={m.iconName} size={20} />
            </div>
            <div className="name">{m.name}</div>
            <div className="desc">{m.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
