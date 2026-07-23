import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, auth, localDate } from "../api.js";
import AnimatedIcon from "../components/AnimatedIcon.jsx";
import WordDetailModal from "../components/WordDetailModal.jsx";

// Rough overall CEFR estimate from how much of each level's vocabulary has
// reached recall/context/mastered — no separate test needed.
function estimateCefr(stats) {
  if (!stats) return null;
  const order = ["A1", "A2", "B1", "B2"];
  const known = (lv) => {
    const s = stats.byLevel[lv];
    return s.total ? (s.recall + s.context + s.mastered) / s.total : 0;
  };
  let now = null;
  for (const lv of order) {
    if (known(lv) >= 0.3) now = lv;
    else break;
  }
  if (!now) return { now: "starter", next: known("A1") >= 0.05 ? "A1" : null };
  const next = order[order.indexOf(now) + 1];
  return { now, next: next && known(next) >= 0.08 ? next : null };
}

// Where you stand against the study plan (targetWords in N days).
function planStatus(plan, wordsLearned) {
  const DAY = 86400000;
  const start = new Date(plan.startDate + "T00:00:00Z").getTime();
  const now = new Date(localDate() + "T00:00:00Z").getTime();
  const elapsed = Math.max(1, Math.round((now - start) / DAY) + 1);
  const totalWeeks = Math.ceil(plan.days / 7);
  const week = Math.min(totalWeeks, Math.ceil(elapsed / 7));
  const expected = plan.targetWords * Math.min(1, elapsed / plan.days);
  const got = Math.max(0, wordsLearned - plan.startWords);
  const pct = Math.min(100, Math.round((got / plan.targetWords) * 100));
  if (got >= plan.targetWords) return { week, totalWeeks, got, pct, emoji: "🏆", label: "Goal complete!" };
  if (got >= expected * 1.15) return { week, totalWeeks, got, pct, emoji: "🚀", label: "Ahead" };
  if (got >= expected * 0.85) return { week, totalWeeks, got, pct, emoji: "✅", label: "On track" };
  return { week, totalWeeks, got, pct, emoji: "⏰", label: "Behind" };
}

// Circular XP progress ring for the compact daily-goal strip.
function Ring({ pct, size = 46 }) {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.3)" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        stroke="var(--amber)" strokeWidth={stroke} fill="none"
        strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, pct) / 100)}
        strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.4s ease" }}
      />
      <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="900" fontFamily="Nunito, sans-serif">
        {pct >= 100 ? "✓" : `${Math.min(99, pct)}%`}
      </text>
    </svg>
  );
}

const PLAN_TARGETS = [250, 500, 1000, 2000];
const PLAN_DURATIONS = [
  { days: 30, label: "1 month" },
  { days: 60, label: "2 months" },
  { days: 90, label: "3 months" },
  { days: 180, label: "6 months" }
];

const SKILL_ICONS = { grammar: "/icons/grammar.svg", listening: "/icons/listening.svg", reading: "/icons/reading.svg" };

const MODULES = [
  { to: "/vocabulary", icon: "/icons/vocabulary.svg", anim: "/icons/vocabulary.lottie.json", bg: "var(--teal-soft)", name: "Vocabulary", desc: "5000 words, A1 to B2" },
  { to: "/grammar", icon: "/icons/grammar.svg", anim: "/icons/grammar.lottie.json", bg: "var(--violet-soft)", name: "Grammar", desc: "86 lessons, A1 to B2" },
  { to: "/listening", icon: "/icons/listening.svg", anim: "/icons/listening.lottie.json", bg: "var(--blue-soft)", name: "Listening", desc: "30 listening lessons" },
  { to: "/reading", icon: "/icons/reading.svg", bg: "var(--orange-soft)", name: "Reading", desc: "20 passages + quizzes" },
  { to: "/speaking", icon: "/icons/speaking.svg", anim: "/icons/speaking.lottie.json", bg: "var(--coral-soft)", name: "Speaking", desc: "Shadowing & dialogues" },
  { to: "/vocabulary/browse", icon: "/icons/browse.svg", anim: "/icons/browse.lottie.json", bg: "var(--mint-soft)", name: "Browse Words", desc: "Search & filter by status" },
  { to: "/progress", icon: "/icons/progress.svg", anim: "/icons/progress.lottie.json", bg: "var(--amber-soft)", name: "Progress", desc: "See your learning stats" }
];

export default function Home() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(null);
  const [session, setSession] = useState(null);
  const [queue, setQueue] = useState(null);
  const [stats, setStats] = useState(null);

  // Quick dictionary
  const [q, setQ] = useState("");
  const [hits, setHits] = useState(null);
  const [openSearchWord, setOpenSearchWord] = useState(null);
  const searchTimer = useRef(null);

  // Study plan modal
  const [showGoal, setShowGoal] = useState(false);
  const [planTarget, setPlanTarget] = useState(500);
  const [planDays, setPlanDays] = useState(90);
  const [planSaving, setPlanSaving] = useState(false);

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
    api.reviewQueue().then(setQueue);
    api.vocabulary.stats().then(setStats);
  }, []);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    const term = q.trim();
    if (term.length < 2) {
      setHits(null);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      const r = await api.vocabulary.search(term);
      setHits(r.words.slice(0, 6));
    }, 250);
    return () => clearTimeout(searchTimer.current);
  }, [q]);

  async function startPlan() {
    setPlanSaving(true);
    try {
      const r = await api.progress.updateSettings({
        studyPlan: { targetWords: planTarget, days: planDays },
        date: localDate()
      });
      setProgress((p) => ({ ...p, studyPlan: r.studyPlan }));
      setShowGoal(false);
    } finally {
      setPlanSaving(false);
    }
  }

  async function removePlan() {
    if (!window.confirm("Remove your study plan?")) return;
    await api.progress.updateSettings({ studyPlan: null });
    setProgress((p) => ({ ...p, studyPlan: null }));
    setShowGoal(false);
  }

  const needsPlacement =
    progress && progress.wordsLearned === 0 && !progress.preferredLevel && !localStorage.getItem("language-app-level");

  const cefr = estimateCefr(stats);
  const plan = progress?.studyPlan ? planStatus(progress.studyPlan, progress.wordsLearned) : null;
  const xpPct = progress ? Math.round((progress.dailyXp / progress.dailyXpGoal) * 100) : 0;

  // Today's plan — one card, no duplicate banners elsewhere.
  const planRows = [];
  if (session?.due.length > 0) {
    planRows.push({ key: "due", to: "/vocabulary/review", label: <>Review <b>{session.due.length} due words</b></> });
  }
  if (session?.newWords.length > 0) {
    planRows.push({
      key: "new", to: "/vocabulary/review",
      label: <>Learn <b>{session.newWords.length} new words</b> <span style={{ color: "var(--ink-soft)", fontWeight: 600 }}>({session.newIntroducedToday}/{session.dailyNewLimit} today)</span></>
    });
  }
  if (session?.due.length > 0) {
    planRows.push({
      key: "read", to: "/vocabulary/practice", state: { wordIds: session.due.slice(0, 8).map((w) => w.id) },
      label: <>Read those words <b>in a fresh passage</b></>
    });
    planRows.push({ key: "speak", to: "/speaking", label: <>Then <b>say them out loud</b> in Speaking</> });
  }

  return (
    <div>
      {/* 1. Header + streak + goal button (settings gear floats top-right) */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10, paddingRight: 44 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Hi {auth.username() || "there"} 👋</div>
          <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>Let's learn some English today</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <div className="pill" style={{ background: "var(--amber-soft)", borderColor: "var(--amber-line)", color: "#B5720F" }}>
            <AnimatedIcon src="/icons/fire.lottie.json" fallback="/icons/fire.svg" size={18} />
            {progress ? progress.streak.current : "…"}
            {progress?.streak?.freezes > 0 && (
              <span title="Streak freezes — each one saves your streak if you miss a single day">
                🧊{progress.streak.freezes > 1 ? `×${progress.streak.freezes}` : ""}
              </span>
            )}
          </div>
          <button
            className="pill"
            onClick={() => setShowGoal(true)}
            title={plan ? "Your study plan" : "Set a study goal"}
            style={{ cursor: "pointer", padding: "6px 10px", background: plan ? "var(--teal)" : "var(--card)", color: plan ? "#fff" : "var(--teal-deep)", borderColor: plan ? "var(--teal)" : "var(--line)" }}
          >
            🎯
          </button>
        </div>
      </div>

      {/* 2. Compact daily goal strip */}
      <div className="goal-strip">
        <Ring pct={xpPct} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 14.5, fontFamily: "'Nunito',sans-serif" }}>
            {progress ? `${Math.min(progress.dailyXp, progress.dailyXpGoal)}/${progress.dailyXpGoal} XP today` : "Loading..."}
            {progress && progress.dailyXp >= progress.dailyXpGoal && " 🎉"}
          </div>
          <div style={{ fontSize: 10.5, opacity: 0.9, marginTop: 2 }}>
            {plan
              ? `🎯 Week ${plan.week}/${plan.totalWeeks} · ${plan.emoji} ${plan.label} · ${plan.got}/${progress.studyPlan.targetWords} words`
              : progress ? `${progress.wordsLearned} words · ${progress.xp} XP total` : ""}
          </div>
          {cefr && (
            <div style={{ fontSize: 10.5, opacity: 0.85, marginTop: 1 }}>
              🎓 {cefr.now === "starter" ? "Just starting out" : `Level ~${cefr.now}`}{cefr.next ? ` → ${cefr.next}` : ""}
            </div>
          )}
        </div>
      </div>

      {/* 3. Quick dictionary */}
      <div style={{ position: "relative", marginBottom: 12 }}>
        <input
          className="text-input"
          placeholder="🔍 Quick dictionary — English or Vietnamese..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
        {hits && q.trim().length >= 2 && (
          <div className="search-pop">
            {hits.map((w) => (
              <div key={w.id} className="search-pop-row" onClick={() => setOpenSearchWord(w.id)}>
                <b>{w.word}</b>
                <span style={{ color: "var(--ink-soft)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.meaning}</span>
                <span className="pill" style={{ padding: "1px 7px", fontSize: 9.5 }}>{w.level}</span>
              </div>
            ))}
            {hits.length === 0 && (
              <div className="search-pop-row" style={{ color: "var(--ink-soft)", cursor: "default" }}>No matches found.</div>
            )}
            <div
              className="search-pop-row"
              style={{ color: "var(--teal-deep)", fontWeight: 800, justifyContent: "center" }}
              onClick={() => navigate("/vocabulary/browse", { state: { q: q.trim() } })}
            >
              See all in Browse ›
            </div>
          </div>
        )}
      </div>
      {openSearchWord && <WordDetailModal wordId={openSearchWord} onClose={() => setOpenSearchWord(null)} />}

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

      {/* 4. Today's plan */}
      {(planRows.length > 0 || queue?.items.length > 0) && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 800, color: "var(--teal-deep)", marginBottom: 8 }}>
            📅 Today's plan
          </div>
          {planRows.map((r, i) => (
            <Link key={r.key} to={r.to} state={r.state} className="plan-row">
              <span className="plan-num">{i + 1}</span>
              <span style={{ flex: 1 }}>{r.label}</span>
              <span>›</span>
            </Link>
          ))}
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

      {/* 5. Fresh reading */}
      <Link to="/vocabulary/practice" className="card" style={{ display: "block", marginBottom: 12, textDecoration: "none", color: "inherit" }}>
        <div style={{ fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 800, color: "var(--coral-deep)", marginBottom: 6 }}>
          📰 Fresh reading for today
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, fontSize: 12.5, color: "var(--ink-soft)" }}>
            A new short passage built from <b style={{ color: "var(--ink)" }}>the words you're learning right now</b> — different every visit, with a mini quiz.
          </div>
          <span style={{ fontSize: 16 }}>›</span>
        </div>
      </Link>

      {/* 6. Main navigation */}
      <div className="module-grid">
        {MODULES.map((m) => (
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

      {/* Study plan modal (🎯 button) */}
      {showGoal && (
        <div className="modal-overlay" onClick={() => setShowGoal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <button className="modal-close" onClick={() => setShowGoal(false)} aria-label="Close">✕</button>
            <div className="modal-scroll" style={{ paddingTop: 24 }}>
              <h2 className="page-title" style={{ fontSize: 20 }}>🎯 Study goal</h2>

              {progress?.studyPlan && plan && (
                <div className="card" style={{ margin: "12px 0", background: "var(--teal-soft)", borderColor: "var(--teal)" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--teal-deep)" }}>
                    {progress.studyPlan.targetWords} words in {Math.round(progress.studyPlan.days / 30)} month{progress.studyPlan.days > 45 ? "s" : ""}
                  </div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    Week {plan.week}/{plan.totalWeeks} · {plan.emoji} {plan.label} · {plan.got}/{progress.studyPlan.targetWords} words ({plan.pct}%)
                  </div>
                  <button className="btn-ghost" style={{ marginTop: 10, borderColor: "var(--bad)", color: "var(--bad-deep)" }} onClick={removePlan}>
                    Remove this plan
                  </button>
                </div>
              )}

              <div style={{ fontSize: 11.5, color: "var(--ink-soft)", margin: "10px 0 8px" }}>
                {progress?.studyPlan ? "Or start a new one:" : "Daily XP feels better when it adds up to something big."}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 4 }}>Learn</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                {PLAN_TARGETS.map((t) => (
                  <button key={t} className="pill" onClick={() => setPlanTarget(t)} style={{ cursor: "pointer", background: planTarget === t ? "var(--teal)" : "var(--card)", color: planTarget === t ? "#fff" : "var(--teal-deep)", border: "1px solid var(--line)" }}>
                    {t} words
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 4 }}>in</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                {PLAN_DURATIONS.map((d) => (
                  <button key={d.days} className="pill" onClick={() => setPlanDays(d.days)} style={{ cursor: "pointer", background: planDays === d.days ? "var(--teal)" : "var(--card)", color: planDays === d.days ? "#fff" : "var(--teal-deep)", border: "1px solid var(--line)" }}>
                    {d.label}
                  </button>
                ))}
              </div>
              <button className="btn-primary" disabled={planSaving} onClick={startPlan} style={{ marginBottom: 20 }}>
                {planSaving ? "Starting..." : `Start: ${planTarget} words in ${PLAN_DURATIONS.find((d) => d.days === planDays)?.label}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
