import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import StudySession from "../components/StudySession.jsx";
import { getCustomExample } from "../customExamples.js";
import Icon from "../components/Icon.jsx";

function speak(text) {
  if (!window.speechSynthesis) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = 0.95;
  window.speechSynthesis.speak(utter);
}

const levels = ["all", "A1", "A2", "B1", "B2"];
const statusTabs = [
  { id: "new", label: "New", icon: "sparkle" },
  { id: "learning", label: "Learning", icon: "book" },
  { id: "mastered", label: "Mastered", icon: "check" }
];

const PAGE_SIZE = 25;

export default function VocabBrowse() {
  const [level, setLevel] = useState("all");
  const [status, setStatus] = useState("learning");
  const [data, setData] = useState(null);
  const [openWord, setOpenWord] = useState(null);
  const [studyWords, setStudyWords] = useState(null);
  const [done, setDone] = useState(false);
  const [page, setPage] = useState(0);

  async function load() {
    setData(null);
    const opts = { status, limit: 100 };
    if (level !== "all") opts.level = level;
    const r = await api.vocabulary.review(opts);
    setData(r);
  }

  useEffect(() => {
    load();
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, status]);

  if (done) {
    return (
      <div>
        <div className="card" style={{ textAlign: "center", padding: "28px 16px" }}>
          <div style={{ fontSize: 32 }}>🎉</div>
          <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 17, margin: "10px 0 4px", color: "var(--teal-deep)" }}>
            Nice work!
          </div>
          <button className="btn-primary" onClick={() => { setDone(false); load(); }}>Back to browsing</button>
        </div>
      </div>
    );
  }

  if (studyWords) {
    return (
      <StudySession
        words={studyWords}
        onExit={() => setStudyWords(null)}
        onDone={() => { setStudyWords(null); setDone(true); }}
      />
    );
  }

  return (
    <div>
      <Link to="/vocabulary/review" className="backbtn">‹ Review</Link>
      <h1 className="page-title">Browse Vocabulary</h1>
      <p className="sub">See exactly which words you know, and pick any group to study</p>

      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {statusTabs.map((s) => (
          <button
            key={s.id}
            onClick={() => setStatus(s.id)}
            className="pill"
            style={{
              flex: 1, justifyContent: "center", cursor: "pointer",
              background: status === s.id ? "var(--teal)" : "#fff",
              color: status === s.id ? "#fff" : "var(--teal-deep)",
              border: "1px solid var(--line)"
            }}
          >
            <Icon name={s.icon} size={14} accent={status === s.id ? "nav" : undefined} /> {s.label}
          </button>
        ))}
      </div>

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

      {!data ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <div className="card" style={{ textAlign: "center", padding: "14px", marginBottom: 12 }}>
            <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 18, color: "var(--teal-deep)" }}>{data.count}</div>
            <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>
              {status} words{level !== "all" ? ` · Level ${level}` : ""}{data.count > data.words.length ? ` (showing first ${data.words.length})` : ""}
            </div>
          </div>

          {data.words.length > 0 && (
            <button
              className="btn-primary"
              style={{ marginBottom: 14 }}
              onClick={() => {
                const pool = data.words;
                const sample = pool.length > 20 ? [...pool].sort(() => Math.random() - 0.5).slice(0, 20) : pool;
                setStudyWords(sample);
              }}
            >
              Study these words
            </button>
          )}

          <div className="card" style={{ padding: 0 }}>
            {data.words.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE).map((w) => (
              <div key={w.id} className="word-list-row">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setOpenWord(openWord === w.id ? null : w.id)}>
                  <div>
                    <b style={{ fontSize: 13.5 }}>{w.word}</b>
                    <span style={{ fontSize: 11.5, color: "var(--ink-soft)", marginLeft: 8 }}>{w.ipa}</span>
                    <span className="pill" style={{ marginLeft: 8, padding: "2px 8px", fontSize: 10 }}>{w.level}</span>
                  </div>
                  <button
                    aria-label="Pronounce"
                    onClick={(e) => { e.stopPropagation(); speak(w.word); }}
                    style={{ background: "#EAF3F1", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  ><Icon name="speaker-wave" size={16} /></button>
                </div>
                {openWord === w.id && (
                  <div style={{ marginTop: 8, fontSize: 12.5 }}>
                    <div style={{ color: "var(--teal)", fontWeight: 700 }}>{w.meaning}</div>
                    <div style={{ color: "var(--ink-soft)", fontStyle: "italic", marginTop: 4 }}>{w.example}</div>
                    {w.phrase && <div style={{ color: "var(--ink-soft)", marginTop: 4 }}>💬 {w.phrase}</div>}
                    {w.family && <div style={{ color: "var(--ink-soft)", marginTop: 4 }}>🌱 {w.family}</div>}
                    {getCustomExample(w.id) && (
                      <div style={{ color: "var(--teal-deep)", marginTop: 4 }}>✏️ {getCustomExample(w.id)}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {data.words.length === 0 && (
              <div style={{ padding: 16, textAlign: "center", fontSize: 12.5, color: "var(--ink-soft)" }}>
                No words in this category yet.
              </div>
            )}
          </div>

          {data.words.length > PAGE_SIZE && (
            <div className="pager-row">
              <button className="pill" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>‹ Prev</button>
              <span style={{ fontSize: 11.5, color: "var(--ink-soft)", fontWeight: 700 }}>
                Page {page + 1}/{Math.ceil(data.words.length / PAGE_SIZE)}
              </span>
              <button
                className="pill"
                disabled={page >= Math.ceil(data.words.length / PAGE_SIZE) - 1}
                onClick={() => setPage((p) => Math.min(Math.ceil(data.words.length / PAGE_SIZE) - 1, p + 1))}
              >Next ›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
