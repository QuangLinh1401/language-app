import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import WordDetailModal from "../components/WordDetailModal.jsx";
import Icon from "../components/Icon.jsx";
import AnimatedIcon from "../components/AnimatedIcon.jsx";
import { TOPIC_MEDIA } from "../topicIcons.js";
import Loading from "../components/Loading.jsx";

function speak(text) {
  if (!window.speechSynthesis) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = 0.95;
  window.speechSynthesis.speak(utter);
}

const PAGE_SIZE = 25;

export default function VocabTopic() {
  const { topicId } = useParams();
  const [topic, setTopic] = useState(null);
  const [openWord, setOpenWord] = useState(null);
  const [page, setPage] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const levelFilter = searchParams.get("level") || "all";

  useEffect(() => {
    api.vocabulary.topic(topicId).then(setTopic);
  }, [topicId]);

  useEffect(() => { setPage(0); }, [topicId, levelFilter]);

  if (!topic) return <Loading />;

  const levels = ["all", "A1", "A2", "B1", "B2"];
  const shown = levelFilter === "all" ? topic.words : topic.words.filter((w) => w.level === levelFilter);
  const pageCount = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const paged = shown.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  function setLevelFilter(lv) {
    if (lv === "all") setSearchParams({});
    else setSearchParams({ level: lv });
  }

  return (
    <div>
      <Link to="/vocabulary" className="backbtn">‹ Vocabulary</Link>
      <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 8 }} data-anim-hover>
        {TOPIC_MEDIA[topicId]?.anim ? (
          <AnimatedIcon src={TOPIC_MEDIA[topicId].anim} fallback={TOPIC_MEDIA[topicId].svg} size={28} hover />
        ) : (
          <img src={TOPIC_MEDIA[topicId]?.svg} alt="" width={28} height={28} style={{ display: "block" }} />
        )}
        {topic.name}
      </h1>
      <p className="sub">{topic.words.length} words · A1 to B2</p>

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {levels.map((lv) => (
          <button
            key={lv}
            onClick={() => setLevelFilter(lv)}
            className="pill"
            style={{
              cursor: "pointer",
              background: levelFilter === lv ? "var(--teal)" : "#fff",
              color: levelFilter === lv ? "#fff" : "var(--teal-deep)",
              border: "1px solid var(--line)"
            }}
          >
            {lv === "all" ? "All" : lv}
          </button>
        ))}
      </div>

      <Link
        to={`/vocabulary/${topicId}/flashcards${levelFilter !== "all" ? `?level=${levelFilter}` : ""}`}
        className="btn-primary"
        style={{ display: "block", textAlign: "center", textDecoration: "none", marginBottom: 16 }}
      >
        Study / Review {levelFilter === "all" ? "this topic" : `(${levelFilter})`}
      </Link>

      <div className="card" style={{ padding: 0 }}>
        {paged.map((w) => (
          <div key={w.id} className="word-list-row">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setOpenWord(w.id)}>
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
          </div>
        ))}
      </div>

      {openWord && <WordDetailModal wordId={openWord} onClose={() => setOpenWord(null)} />}

      {pageCount > 1 && (
        <div className="pager-row">
          <button className="pill" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>‹ Prev</button>
          <span style={{ fontSize: 11.5, color: "var(--ink-soft)", fontWeight: 700 }}>Page {page + 1}/{pageCount}</span>
          <button className="pill" disabled={page >= pageCount - 1} onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}>Next ›</button>
        </div>
      )}
    </div>
  );
}
