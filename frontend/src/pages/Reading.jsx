import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import AnimatedIcon from "../components/AnimatedIcon.jsx";
import Loading from "../components/Loading.jsx";

export default function Reading() {
  const [passages, setPassages] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get("level") || "all";

  useEffect(() => {
    api.reading.list().then(setPassages);
  }, []);

  if (!passages) return <Loading text="Loading passages..." />;

  const levels = ["all", "A2", "B1", "B2"];
  const shown = filter === "all" ? passages : passages.filter((p) => p.level === filter);

  function setFilter(lv) {
    if (lv === "all") setSearchParams({});
    else setSearchParams({ level: lv });
  }

  return (
    <div>
      <h1 className="page-title">Reading</h1>
      <p className="sub">{passages.length} passages · read carefully, then answer the quiz</p>

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

      {shown.map((p) => (
        <Link key={p.id} to={`/reading/${p.id}`} className="topic-card" data-anim-hover>
          <div className="topic-emoji">
            {p.read ? (
              <AnimatedIcon src="/icons/check.lottie.json" fallback="/icons/check.svg" size={22} hover />
            ) : (
              <img src="/icons/reading.svg" alt="" width={22} height={22} style={{ display: "block" }} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 13 }}>{p.title}</b>
            <div style={{ fontSize: 10.5, color: "var(--ink-soft)", marginTop: 4 }}>
              {p.topic} · Level {p.level} · {p.wordCount} words
            </div>
            {p.read && (
              <div style={{ fontSize: 10.5, color: "var(--teal)", marginTop: 2, fontWeight: 700 }}>
                Score {p.score}/{p.totalQuestions || 5} · {Math.round(p.timeSeconds / 60)} min {p.timeSeconds % 60}s
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
