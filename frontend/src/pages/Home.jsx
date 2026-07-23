import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, auth } from "../api.js";
import AnimatedIcon from "../components/AnimatedIcon.jsx";
import WordDetailModal from "../components/WordDetailModal.jsx";
import { speak } from "../speech.js";

export default function Home() {
  const [progress, setProgress] = useState(null);
  const [session, setSession] = useState(null);
  const [wod, setWod] = useState(null);
  const [openWord, setOpenWord] = useState(false);
  const [queue, setQueue] = useState(null);

  useEffect(() => {
    // touch returns the full summary — one round trip instead of two.
    api.progress.touch(5).then((p) => {
      setProgress(p);
      // Sync the placement-test level across devices.
      if (p.preferredLevel && !localStorage.getItem("language-app-level")) {
        localStorage.setItem("language-app-level", p.preferredLevel);
      }
    });
    api.vocabulary.dailySession().then(setSession);
    api.vocabulary.wordOfDay().then(setWod);
    api.reviewQueue().then(setQueue);
  }, []);

  const needsPlacement =
    progress && progress.wordsLearned === 0 && !progress.preferredLevel && !localStorage.getItem("language-app-level");

  const SKILL_ICONS = { grammar: "/icons/grammar.svg", listening: "/icons/listening.svg", reading: "/icons/reading.svg" };

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
          {progress?.streak?.freezes > 0 && (
            <span title="Streak freezes — each one saves your streak if you miss a single day" style={{ marginLeft: 2 }}>
              🧊{progress.streak.freezes > 1 ? `×${progress.streak.freezes}` : ""}
            </span>
          )}
        </div>
      </div>

      <div className="goal-ticket">
        <div className="eyebrow">Daily goal</div>
        <h3>{progress ? `${Math.min(progress.dailyXp, progress.dailyXpGoal)}/${progress.dailyXpGoal} XP today` : "Loading..."}</h3>
        {progress && (
          <div className="goal-bar">
            <div className="goal-bar-fill" style={{ width: `${Math.min(100, Math.round((progress.dailyXp / progress.dailyXpGoal) * 100))}%` }} />
          </div>
        )}
        <div style={{ fontSize: 12, marginTop: 8 }}>
          {progress
            ? progress.dailyXp >= progress.dailyXpGoal
              ? `🎉 Goal reached! ${progress.wordsLearned} words · ${progress.xp} XP total`
              : `${progress.wordsLearned} words learned · ${progress.xp} XP total`
            : ""}
        </div>
      </div>

      {needsPlacement && (
        <Link to="/placement" className="review-banner" style={{ background: "var(--violet-soft)", borderColor: "var(--line)" }}>
          <span style={{ fontSize: 22 }}>🧭</span>
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 12.5, display: "block" }}>New here? Find your level</b>
            <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>12 quick questions · sets the right difficulty for you</span>
          </div>
          <div style={{ fontSize: 16 }}>›</div>
        </Link>
      )}

      {(session?.due.length > 0 || queue?.count > 0) && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 800, color: "var(--teal-deep)", marginBottom: 8 }}>
            📅 Today's plan
          </div>
          {session?.due.length > 0 && (
            <>
              <Link to="/vocabulary/review" className="plan-row">
                <span className="plan-num">1</span>
                <span style={{ flex: 1 }}>Review <b>{session.due.length} due words</b></span>
                <span>›</span>
              </Link>
              <Link to="/vocabulary/practice" state={{ wordIds: session.due.slice(0, 8).map((w) => w.id) }} className="plan-row">
                <span className="plan-num">2</span>
                <span style={{ flex: 1 }}>Read those words <b>in a fresh passage</b></span>
                <span>›</span>
              </Link>
              <Link to="/speaking" className="plan-row">
                <span className="plan-num">3</span>
                <span style={{ flex: 1 }}>Then <b>say them out loud</b> in Speaking</span>
                <span>›</span>
              </Link>
            </>
          )}
          {queue?.items.map((it) => (
            <Link key={it.skill + it.id} to={it.to} className="plan-row">
              <img src={SKILL_ICONS[it.skill]} alt="" width={16} height={16} />
              <span style={{ flex: 1 }}>
                Re-do <b>{it.title}</b>
                <span style={{ color: "var(--ink-soft)", fontWeight: 600 }}> · {it.skill} due again</span>
              </span>
              <span>›</span>
            </Link>
          ))}
        </div>
      )}

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
