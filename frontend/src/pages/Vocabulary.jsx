import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import Icon, { TOPIC_ICONS } from "../components/Icon.jsx";

export default function Vocabulary() {
  const [topics, setTopics] = useState(null);

  useEffect(() => {
    api.vocabulary.topics().then(setTopics);
  }, []);

  if (!topics) return <div className="loading">Loading topics...</div>;

  return (
    <div>
      <h1 className="page-title">Vocabulary</h1>
      <p className="sub">Pick a topic to learn new words or review them</p>

      {topics.map((t) => {
        const pct = t.total ? Math.round((t.learned / t.total) * 100) : 0;
        return (
          <Link key={t.id} to={`/vocabulary/${t.id}`} className="topic-card">
            <div className="topic-emoji">
              <Icon name={TOPIC_ICONS[t.id]} size={20} />
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
