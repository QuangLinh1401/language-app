import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import StudySession from "../components/StudySession.jsx";
import Icon from "../components/Icon.jsx";
import Loading from "../components/Loading.jsx";

const levels = ["all", "A1", "A2", "B1", "B2"];

export default function VocabReview() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [level, setLevel] = useState("all");
  const [customWords, setCustomWords] = useState(null);
  const [words, setWords] = useState(null);
  const [done, setDone] = useState(false);

  const [limitSaving, setLimitSaving] = useState(false);

  useEffect(() => {
    api.vocabulary.dailySession().then(setSession);
  }, []);

  async function adjustLimit(delta) {
    if (!session || limitSaving) return;
    const next = Math.min(200, Math.max(1, session.dailyNewLimit + delta));
    if (next === session.dailyNewLimit) return;
    setLimitSaving(true);
    await api.vocabulary.updateSettings({ dailyNewLimit: next });
    const fresh = await api.vocabulary.dailySession();
    setSession(fresh);
    setLimitSaving(false);
  }

  async function loadAdvanced(lv) {
    const opts = { status: "mastered", limit: 30 };
    if (lv !== "all") opts.level = lv;
    const r = await api.vocabulary.review(opts);
    setCustomWords(r.words);
  }

  useEffect(() => {
    if (showAdvanced) loadAdvanced(level);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAdvanced, level]);

  if (!session) return <Loading text="Loading today's session..." />;

  if (done) {
    return (
      <div>
        <div className="card" style={{ textAlign: "center", padding: "28px 16px" }}>
          <div style={{ fontSize: 32 }}>🎉</div>
          <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 17, margin: "10px 0 4px", color: "var(--teal-deep)" }}>
            Review complete!
          </div>
          <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 16 }}>
            Come back tomorrow for your next session — little and often beats cramming.
          </div>
          <button className="btn-primary" onClick={() => navigate("/")}>Back to Home</button>
        </div>
      </div>
    );
  }

  if (words) {
    return (
      <StudySession
        words={words}
        onExit={() => setWords(null)}
        onDone={() => { setWords(null); setDone(true); }}
      />
    );
  }

  return (
    <div>
      <Link to="/" className="backbtn">‹ Home</Link>
      <h1 className="page-title">Review</h1>
      <p className="sub">Active recall + spaced repetition — a few minutes, every day</p>

      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="sparkle" size={22} />
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 13 }}>New words to learn</b>
            <div style={{ fontSize: 10.5, color: "var(--ink-soft)", marginTop: 2 }}>
              Words you've never studied · {session.newIntroducedToday}/{session.dailyNewLimit} introduced today
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
          <span style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: 700, flex: 1 }}>New words per day goal</span>
          <button
            className="icon-step"
            disabled={limitSaving || session.dailyNewLimit <= 1}
            onClick={() => adjustLimit(-5)}
          >
            −
          </button>
          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--teal-deep)", minWidth: 24, textAlign: "center" }}>
            {session.dailyNewLimit}
          </span>
          <button
            className="icon-step"
            disabled={limitSaving || session.dailyNewLimit >= 200}
            onClick={() => adjustLimit(5)}
          >
            +
          </button>
        </div>

        <button
          className="btn-primary"
          style={{ marginTop: 12 }}
          disabled={session.newWords.length === 0}
          onClick={() => setWords(session.newWords)}
        >
          {session.newWords.length > 0 ? `Learn ${session.newWords.length} new words` : "No new words available right now"}
        </button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="repeat" size={22} />
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 13 }}>Words to review</b>
            <div style={{ fontSize: 10.5, color: "var(--ink-soft)", marginTop: 2 }}>
              Words you've studied before that are due again
            </div>
          </div>
        </div>
        <button
          className="btn-primary"
          style={{ marginTop: 12 }}
          disabled={session.due.length === 0}
          onClick={() => setWords(session.due)}
        >
          {session.due.length > 0 ? `Review ${session.due.length} words` : "Nothing due right now 🎉"}
        </button>
        <button
          className="btn-ghost"
          disabled={session.due.length < 2}
          onClick={() => setWords([...session.due].sort(() => Math.random() - 0.5))}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          <Icon name="shuffle" size={15} /> Shuffle all topics
        </button>
      </div>

      <button className="btn-ghost" onClick={() => setShowAdvanced((s) => !s)}>
        {showAdvanced ? "Hide" : "Show"} mastered words
      </button>

      {showAdvanced && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6 }}>Level</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            {levels.map((lv) => (
              <button
                key={lv}
                onClick={() => setLevel(lv)}
                className="pill"
                style={{
                  cursor: "pointer",
                  background: level === lv ? "var(--teal)" : "#fff",
                  color: level === lv ? "#fff" : "var(--teal-deep)",
                  border: "1px solid var(--line)"
                }}
              >
                {lv === "all" ? "All" : lv}
              </button>
            ))}
          </div>

          {!customWords ? (
            <Loading />
          ) : (
            <>
              <div className="card" style={{ textAlign: "center", padding: "16px", marginBottom: 12 }}>
                <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 18, color: "var(--teal-deep)" }}>{customWords.length}</div>
                <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>mastered words for a quick refresher</div>
              </div>
              {customWords.length > 0 && (
                <button className="btn-primary" onClick={() => setWords(customWords)}>Refresh these words</button>
              )}
            </>
          )}
        </div>
      )}

      <div style={{ marginTop: 16, textAlign: "center" }}>
        <Link to="/vocabulary/browse" style={{ fontSize: 12, color: "var(--teal)", fontWeight: 700 }}>
          Browse all your vocabulary by status ›
        </Link>
      </div>
    </div>
  );
}
