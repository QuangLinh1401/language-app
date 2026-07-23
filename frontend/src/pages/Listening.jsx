import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import Icon from "../components/Icon.jsx";
import AnimatedIcon from "../components/AnimatedIcon.jsx";
import Loading from "../components/Loading.jsx";
import Pager from "../components/Pager.jsx";

const PAGE_SIZE = 15;

export default function Listening() {
  const [lessons, setLessons] = useState(null);
  const [page, setPage] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get("level") || "all";

  useEffect(() => {
    api.listening.list().then(setLessons);
  }, []);

  useEffect(() => { setPage(0); }, [filter]);

  if (!lessons) return <Loading text="Loading lessons..." />;

  // Level pills come from the data itself (A1-B2 for English, HSK1 for Chinese).
  const distinctLevels = [...new Set(lessons.map((l) => l.level))];
  const levels = distinctLevels.length > 1 ? ["all", ...distinctLevels] : [];
  const shown = filter === "all" ? lessons : lessons.filter((l) => l.level === filter);
  const pageCount = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const paged = shown.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  function setFilter(lv) {
    if (lv === "all") setSearchParams({});
    else setSearchParams({ level: lv });
  }

  return (
    <div>
      <Link to="/" className="backbtn">‹ Home</Link>
      <h1 className="page-title">Listening</h1>
      <p className="sub">{lessons.length} listening lessons by topic and level</p>

      {levels.length > 0 && (
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {levels.map((lv) => (
          <button
            key={lv}
            onClick={() => setFilter(lv)}
            className="pill"
            style={{
              cursor: "pointer",
              background: filter === lv ? "var(--teal)" : "var(--card)",
              color: filter === lv ? "#fff" : "var(--teal-deep)",
              border: "1px solid var(--line)"
            }}
          >
            {lv === "all" ? "All" : lv}
          </button>
        ))}
      </div>
      )}

      {paged.map((l) => (
        <Link key={l.id} to={`/listening/${l.id}`} className="topic-card" data-anim-hover>
          <div className="topic-emoji">
            <AnimatedIcon src="/icons/listening.lottie.json" fallback="/icons/listening.svg" size={22} hover />
          </div>
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 13 }}>{l.title}</b>
            <div style={{ fontSize: 10.5, color: "var(--ink-soft)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
              <span>{l.topic} · Level {l.level}</span>
              {l.completed && <><span>· Completed</span><Icon name="check" size={13} /></>}
              {l.wrongCount > 0 && <span style={{ color: "var(--amber-deep)", fontWeight: 700 }}>· ⟳ {l.wrongCount} câu sai</span>}
            </div>
          </div>
        </Link>
      ))}

      <Pager page={page} pageCount={pageCount} onPage={setPage} />
    </div>
  );
}
