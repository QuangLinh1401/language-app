import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, auth } from "../api.js";
import AnimatedIcon from "../components/AnimatedIcon.jsx";

export default function Home() {
  const [progress, setProgress] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // touch returns the full summary — one round trip instead of two.
    api.progress.touch(5).then(setProgress);
    api.vocabulary.dailySession().then(setSession);
  }, []);

  const modules = [
    { to: "/vocabulary", icon: "/icons/vocabulary.svg", anim: "/icons/vocabulary.lottie.json", bg: "var(--teal-soft)", name: "Vocabulary", desc: "5000 words, A1 to B2" },
    { to: "/grammar", icon: "/icons/grammar.svg", anim: "/icons/grammar.lottie.json", bg: "var(--violet-soft)", name: "Grammar", desc: "86 lessons, A1 to B2" },
    { to: "/listening", icon: "/icons/listening.svg", anim: "/icons/listening.lottie.json", bg: "var(--blue-soft)", name: "Listening", desc: "30 listening lessons" },
    { to: "/reading", icon: "/icons/reading.svg", bg: "var(--orange-soft)", name: "Reading", desc: "20 passages + quizzes" },
    { to: "/speaking", icon: "/icons/speaking.svg", anim: "/icons/speaking.lottie.json", bg: "var(--coral-soft)", name: "Speaking", desc: "Shadowing & dialogues" },
    { to: "/vocabulary/browse", icon: "/icons/browse.svg", anim: "/icons/browse.lottie.json", bg: "var(--mint-soft)", name: "Browse Words", desc: "Search & filter by status" },
    { to: "/progress", icon: "/icons/progress.svg", anim: "/icons/progress.lottie.json", bg: "var(--amber-soft)", name: "Progress", desc: "See your learning stats" }
  ];

  return (
    <div>
      {/* paddingRight leaves room for the floating settings gear (top-right of the app shell) */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingRight: 44 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Hi {auth.username() || "there"} 👋</div>
          <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>Let's learn some English today</div>
        </div>
        <div className="pill" style={{ background: "var(--amber-soft)", borderColor: "var(--amber-line)", color: "#B5720F" }}>
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
        <Link to="/vocabulary/review" className="review-banner" data-anim-hover>
          <AnimatedIcon src="/icons/hourglass.lottie.json" fallback="/icons/hourglass.svg" size={22} hover />
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 12.5, display: "block" }}>{session.due.length} words to review</b>
            <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>Studied before, due again today</span>
          </div>
          <div style={{ fontSize: 16 }}>›</div>
        </Link>
      )}

      {session && session.newWords.length > 0 && (
        <Link to="/vocabulary/review" className="review-banner" style={{ background: "var(--blue-soft)", borderColor: "var(--blue-line)" }}>
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
          <Link key={m.to} to={m.to} className="mod-card" data-anim-hover>
            <div className="ic" style={{ background: m.bg }}>
              {m.anim ? (
                <AnimatedIcon src={m.anim} fallback={m.icon} size={26} className="mod-icon" hover />
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
