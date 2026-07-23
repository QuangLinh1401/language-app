import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import AnimatedIcon from "../components/AnimatedIcon.jsx";
import { TOPIC_MEDIA } from "../topicIcons.js";
import Loading from "../components/Loading.jsx";

export default function Vocabulary() {
  const [topics, setTopics] = useState(null);

  useEffect(() => {
    api.vocabulary.topics().then(setTopics);
  }, []);

  if (!topics) return <Loading text="Loading topics..." />;

  return (
    <div>
      <h1 className="page-title">Vocabulary</h1>
      <p className="sub">Pick a topic to learn new words or review them</p>

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
