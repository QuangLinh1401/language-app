import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, auth } from "../api.js";
import AnimatedIcon from "../components/AnimatedIcon.jsx";
import WordDetailModal from "../components/WordDetailModal.jsx";
import { speak } from "../speech.js";

// Last 7 calendar days as {label, active} — active days are inferred from the
// streak length ending on the last active date (no extra data needed).
function last7Days(streak) {
  const DAY = 86400000;
  const toKey = (d) => d.toISOString().slice(0, 10);
  const today = new Date();
  const last = streak.lastActiveDate;
  const current = streak.current || 0;
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY);
    const key = toKey(d);
    let active = false;
    if (last && current > 0) {
      const lastMs = new Date(last + "T00:00:00Z").getTime();
      const dMs = new Date(key + "T00:00:00Z").getTime();
      const diff = Math.round((lastMs - dMs) / DAY);
      active = diff >= 0 && diff < current;
    }
    days.push({ label: "SMTWTFS"[d.getDay()], active, isToday: i === 0 });
  }
  return days;
}

export default function Home() {
  const [progress, setProgress] = useState(null);
  const [session, setSession] = useState(null);
  const [wod, setWod] = useState(null);
  const [openWord, setOpenWord] = useState(false);

  useEffect(() => {
    // touch returns the full summary — one round trip instead of two.
    api.progress.touch(5).then(setProgress);
    api.vocabulary.dailySession().then(setSession);
    api.vocabulary.wordOfDay().then(setWod);
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

      {progress && (
        <div className="streak-week">
          {last7Days(progress.streak).map((d, i) => (
            <div key={i} className="streak-day">
              <div className={"streak-dot" + (d.active ? " on" : "") + (d.isToday ? " today" : "")}>
                {d.active ? "✓" : ""}
              </div>
              <span>{d.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="goal-ticket">
        <div className="eyebrow">Quick stats</div>
        <h3>{progress ? `${progress.wordsLearned} words · ${progress.grammarCompleted} grammar lessons` : "Loading..."}</h3>
        <div style={{ fontSize: 12 }}>
          {progress ? `${progress.xp} XP earned — keep it up!` : ""}
        </div>
      </div>

      {wod && (
        <div className="card" style={{ marginBottom: 16, cursor: "pointer" }} onClick={() => setOpenWord(true)}>
          <div style={{ fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 800, color: "var(--amber-deep)", marginBottom: 6 }}>
            ⭐ Word of the day
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <b style={{ fontFamily: "'Nunito',sans-serif", fontSize: 18, color: "var(--teal-deep)" }}>{wod.word}</b>
              <span style={{ fontSize: 11.5, color: "var(--ink-soft)", marginLeft: 8 }} className="ipa-text">{wod.ipa}</span>
              <div style={{ fontSize: 13, color: "var(--teal)", fontWeight: 700, marginTop: 2 }}>{wod.meaning}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-soft)", fontStyle: "italic", marginTop: 4 }}>"{wod.example}"</div>
            </div>
            <button
              aria-label="Pronounce"
              onClick={(e) => { e.stopPropagation(); speak(wod.word); }}
              style={{ background: "var(--teal-soft)", border: "none", borderRadius: "50%", width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >🔊</button>
          </div>
        </div>
      )}
      {openWord && wod && <WordDetailModal wordId={wod.id} onClose={() => setOpenWord(false)} />}

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
