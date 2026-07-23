import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api, appLang } from "../api.js";
import StudySession from "../components/StudySession.jsx";
import { getCustomExample } from "../customExamples.js";
import Icon from "../components/Icon.jsx";
import AnimatedIcon from "../components/AnimatedIcon.jsx";
import Loading from "../components/Loading.jsx";
import Pager from "../components/Pager.jsx";
import { speak } from "../speech.js";


const levels = appLang() === "zh" ? ["all", "HSK1", "HSK2", "HSK3", "HSK4", "HSK5", "HSK6"] : ["all", "A1", "A2", "B1", "B2"];
const statusTabs = [
  { id: "new", label: "New", anim: "/icons/sparkle.lottie.json", svg: "/icons/sparkle.svg" },
  { id: "learning", label: "Learning", anim: "/icons/vocabulary.lottie.json", svg: "/icons/vocabulary.svg" },
  { id: "mastered", label: "Mastered", anim: "/icons/check.lottie.json", svg: "/icons/check.svg" }
];

// The 4 knowledge stages a studied word moves through (see backend wordStatus).
const STAGE_BADGES = {
  recognition: { label: "Lv1 · Seen", bg: "var(--violet-soft)", color: "#6D3FE0" },
  recall: { label: "Lv2 · Recall", bg: "var(--blue-soft)", color: "#2563A8" },
  context: { label: "Lv3 · Context", bg: "var(--orange-soft)", color: "#B5720F" },
  mastered: { label: "Lv4 · Mastered", bg: "var(--good-soft)", color: "#3E9142" }
};

function StageBadge({ status }) {
  const b = STAGE_BADGES[status];
  if (!b) return null;
  return (
    <span className="pill" style={{ marginLeft: 6, padding: "2px 8px", fontSize: 9.5, background: b.bg, color: b.color, borderColor: "transparent" }}>
      {b.label}
    </span>
  );
}

// Leech: a word forgotten 4+ times in a row — needs special attention.
function LeechBadge({ progress }) {
  if ((progress?.forgotStreak || 0) < 4) return null;
  return (
    <span className="pill" title="You've forgotten this word 4+ times in a row — open its details and try a new example or mnemonic" style={{ marginLeft: 6, padding: "2px 8px", fontSize: 9.5, background: "var(--bad-soft)", color: "var(--bad-deep)", borderColor: "transparent" }}>
      ⚠️ Tricky
    </span>
  );
}

const PAGE_SIZE = 25;

export default function VocabBrowse() {
  const [level, setLevel] = useState(() => (appLang() === "zh" ? "all" : localStorage.getItem("language-app-level") || "all"));
  const [status, setStatus] = useState("learning");
  const [data, setData] = useState(null);
  const [openWord, setOpenWord] = useState(null);
  const [studyWords, setStudyWords] = useState(null);
  const [done, setDone] = useState(false);
  const [page, setPage] = useState(0);
  const location = useLocation();
  const [query, setQuery] = useState(location.state?.q || "");
  const [searchResults, setSearchResults] = useState(null);
  const [searchPage, setSearchPage] = useState(0);
  const searchTimer = useRef(null);

  // Debounced search across all 5000 words (English word or Vietnamese meaning).
  useEffect(() => {
    clearTimeout(searchTimer.current);
    const q = query.trim();
    setSearchPage(0);
    if (q.length < 2) {
      setSearchResults(null);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      const r = await api.vocabulary.search(q);
      setSearchResults(r);
    }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [query]);

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

  const renderWordRow = (w) => (
    <div key={w.id} className="word-list-row">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setOpenWord(openWord === w.id ? null : w.id)}>
        <div>
          <b style={{ fontSize: 13.5 }}>{w.word}</b>
          <span style={{ fontSize: 11.5, color: "var(--ink-soft)", marginLeft: 8 }}>{w.ipa}</span>
          <span className="pill" style={{ marginLeft: 8, padding: "2px 8px", fontSize: 10 }}>{w.level}</span>
          <StageBadge status={w.status} />
          <LeechBadge progress={w.progress} />
        </div>
        <button
          aria-label="Pronounce"
          onClick={(e) => { e.stopPropagation(); speak(w.word); }}
          style={{ background: "var(--teal-soft)", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
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
  );

  const searching = query.trim().length >= 2;

  return (
    <div>
      <Link to="/" className="backbtn">‹ Home</Link>
      <h1 className="page-title">Browse Vocabulary</h1>
      <p className="sub">See exactly which words you know, and pick any group to study</p>

      <input
        className="text-input"
        style={{ width: "100%", marginBottom: 12 }}
        placeholder="🔍 Search all 5000 words (English or Vietnamese)..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
      />

      {searching ? (
        !searchResults ? (
          <Loading text="Searching..." />
        ) : (
          <>
            <div style={{ fontSize: 11.5, color: "var(--ink-soft)", fontWeight: 700, marginBottom: 8 }}>
              {searchResults.count} result{searchResults.count === 1 ? "" : "s"}
              {searchResults.count > searchResults.words.length ? ` (showing first ${searchResults.words.length})` : ""}
            </div>
            <div className="card" style={{ padding: 0 }}>
              {searchResults.words.slice(searchPage * PAGE_SIZE, searchPage * PAGE_SIZE + PAGE_SIZE).map(renderWordRow)}
              {searchResults.words.length === 0 && (
                <div style={{ padding: 16, textAlign: "center", fontSize: 12.5, color: "var(--ink-soft)" }}>
                  No words found for "{query.trim()}".
                </div>
              )}
            </div>
            <Pager
              page={searchPage}
              pageCount={Math.max(1, Math.ceil(searchResults.words.length / PAGE_SIZE))}
              onPage={setSearchPage}
            />
          </>
        )
      ) : (
      <>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {statusTabs.map((s) => (
          <button
            key={s.id}
            onClick={() => setStatus(s.id)}
            className="pill"
            data-anim-hover
            style={{
              flex: 1, justifyContent: "center", cursor: "pointer",
              background: status === s.id ? "var(--teal)" : "var(--card)",
              color: status === s.id ? "#fff" : "var(--teal-deep)",
              border: "1px solid var(--line)"
            }}
          >
            <AnimatedIcon src={s.anim} fallback={s.svg} size={16} hover /> {s.label}
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
              background: level === lv ? "var(--teal)" : "var(--card)",
              color: level === lv ? "#fff" : "var(--teal-deep)",
              border: "1px solid var(--line)"
            }}
          >
            {lv === "all" ? "All" : lv}
          </button>
        ))}
      </div>

      {!data ? (
        <Loading />
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
            {data.words.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE).map(renderWordRow)}
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
      </>
      )}
    </div>
  );
}
