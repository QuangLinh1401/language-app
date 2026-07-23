import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import Icon from "../components/Icon.jsx";
import Loading from "../components/Loading.jsx";
import Pager from "../components/Pager.jsx";

const PAGE_SIZE = 20;

export default function Grammar() {
  const [lessons, setLessons] = useState(null);
  const [page, setPage] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get("level") || "all";

  useEffect(() => {
    api.grammar.list().then(setLessons);
  }, []);

  useEffect(() => { setPage(0); }, [filter]);

  if (!lessons) return <Loading text="Loading lessons..." />;

  const levels = ["all", "A1", "A2", "B1", "B2"];
  const shown = filter === "all" ? lessons : lessons.filter((l) => l.level === filter);
  const pageCount = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const paged = shown.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  function setFilter(lv) {
    if (lv === "all") setSearchParams({});
    else setSearchParams({ level: lv });
  }

  return (
    <div>
      <h1 className="page-title">Grammar</h1>
      <p className="sub">{lessons.length} lessons from A1 to B2</p>

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {levels.map((lv) => (
          <button
            key={lv}
            onClick={() => setFilter(lv)}
            className="pill"
            style={{
              cursor: "pointer",
              background: filter === lv ? "var(--teal)" : "#fff",
              color: filter === lv ? "#fff" : "var(--teal-deep)",
              border: "1px solid var(--line)"
            }}
          >
            {lv === "all" ? "All" : lv}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {paged.map((l, i) => (
          <Link
            key={l.id}
            to={`/grammar/${l.id}`}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "13px 14px", textDecoration: "none", color: "inherit",
              borderBottom: i < paged.length - 1 ? "1px solid var(--line)" : "none"
            }}
          >
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{l.title}</div>
              <div style={{ fontSize: 10.5, color: "var(--ink-soft)" }}>Level {l.level}</div>
            </div>
            <div style={{ fontSize: 16, display: "flex", alignItems: "center" }}>{l.completed ? <Icon name="check" size={18} /> : "›"}</div>
          </Link>
        ))}
      </div>

      <Pager page={page} pageCount={pageCount} onPage={setPage} />
    </div>
  );
}
