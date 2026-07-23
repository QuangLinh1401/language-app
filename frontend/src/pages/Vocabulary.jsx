import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import AnimatedIcon from "../components/AnimatedIcon.jsx";
import WordDetailModal from "../components/WordDetailModal.jsx";
import { TOPIC_MEDIA } from "../topicIcons.js";
import { speak } from "../speech.js";
import Loading from "../components/Loading.jsx";

export default function Vocabulary() {
  const [topics, setTopics] = useState(null);
  const [wod, setWod] = useState(null);
  const [openWord, setOpenWord] = useState(false);

  useEffect(() => {
    api.vocabulary.topics().then(setTopics);
    api.vocabulary.wordOfDay().then(setWod);
  }, []);

  if (!topics) return <Loading text="Loading topics..." />;

  return (
    <div>
      <h1 className="page-title">Vocabulary</h1>
      <p className="sub">Pick a topic to learn new words or review them</p>

      {wod && (
        <div className="card" style={{ marginBottom: 14, cursor: "pointer" }} onClick={() => setOpenWord(true)}>
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

      {topics.map((t) => {
        const pct = t.total ? Math.round((t.learned / t.total) * 100) : 0;
        return (
          <Link key={t.id} to={`/vocabulary/${t.id}`} className="topic-card" data-anim-hover>
            <div className="topic-emoji">
              {TOPIC_MEDIA[t.id]?.anim ? (
                <AnimatedIcon src={TOPIC_MEDIA[t.id].anim} fallback={TOPIC_MEDIA[t.id].svg} size={22} hover />
              ) : (
                <img src={TOPIC_MEDIA[t.id]?.svg} alt="" width={22} height={22} style={{ display: "block" }} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <b style={{ fontSize: 13 }}>{t.name}</b>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <div style={{ fontSize: 10.5, color: "var(--ink-soft)", marginTop: 4 }}>
                {t.learned}/{t.total} words · A1 to B2
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
