import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, auth } from "../api.js";
import AnimatedIcon from "../components/AnimatedIcon.jsx";

export default function Home() {
  const [progress, setProgress] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    api.progress.touch(5).then(() => api.progress.get()).then(setProgress);
    api.vocabulary.dailySession().then(setSession);
  }, []);

  const modules = [
    { to: "/vocabulary", icon: "/icons/vocabulary.svg", anim: "/icons/vocabulary.lottie.json", bg: "#EAF3F1", name: "Vocabulary", desc: "5000 words, A1 to B2" },
    { to: "/grammar", icon: "/icons/grammar.svg", anim: "/icons/grammar.lottie.json", bg: "#F1EAF7", name: "Grammar", desc: "86 lessons, A1 to B2" },
    { to: "/listening", icon: "/icons/listening.svg", anim: "/icons/listening.lottie.json", bg: "#EAF0F7", name: "Listening", desc: "30 listening lessons" },
    { to: "/reading", icon: "/icons/reading.svg", bg: "#FCEFE6", name: "Reading", desc: "20 passages + quizzes" },
    { to: "/speaking", icon: "/icons/speaking.svg", anim: "/icons/speaking.lottie.json", bg: "#FDEBEA", name: "Speaking", desc: "Shadowing & dialogues" },
    { to: "/vocabulary/browse", icon: "/icons/browse.svg", anim: "/icons/browse.lottie.json", bg: "#E9F5EF", name: "Browse Words", desc: "Search & filter by status" },
    { to: "/progress", icon: "/icons/progress.svg", anim: "/icons/progress.lottie.json", bg: "#FFF3E4", name: "Progress", desc: "See your learning stats" }
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
          <AnimatedIcon src="/icons/fire.lottie.json" fallback="/icons/fire.svg" size={18} />
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
          <img src="/icons/repeat.svg" alt="" width={22} height={22} />
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 12.5, display: "block" }}>{session.due.length} words to review</b>
            <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>Studied before, due again today</span>
          </div>
          <div style={{ fontSize: 16 }}>›</div>
        </Link>
      )}

      {session && session.newWords.length > 0 && (
        <Link to="/vocabulary/review" className="review-banner" style={{ background: "#EAF0F7", borderColor: "#CBDCF2" }}>
          <AnimatedIcon src="/icons/sparkle.lottie.json" fallback="/icons/sparkle.svg" size={22} />
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 12.5, display: "block" }}>{session.newWords.length} new words to learn</b>
            <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>{session.newIntroducedToday}/{session.dailyNewLimit} introduced today</span>
          </div>
          <div style={{ fontSize: 16 }}>›</div>
        </Link>
      )}

      <div className="module-grid">
        {modules.map((m) => (
          <Link key={m.to} to={m.to} className="mod-card">
            <div className="ic" style={{ background: m.bg }}>
              {m.anim ? (
                <AnimatedIcon src={m.anim} fallback={m.icon} size={26} className="mod-icon" />
              ) : (
                <img src={m.icon} alt="" className="mod-icon" />
              )}
            </div>
            <div className="name">{m.name}</div>
            <div className="desc">{m.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
