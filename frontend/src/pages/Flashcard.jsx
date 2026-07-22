import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import StudySession from "../components/StudySession.jsx";

export default function Flashcard() {
  const { topicId } = useParams();
  const [searchParams] = useSearchParams();
  const levelFilter = searchParams.get("level");
  const navigate = useNavigate();
  const [words, setWords] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api.vocabulary.topic(topicId).then((t) => {
      let list = levelFilter ? t.words.filter((w) => w.level === levelFilter) : t.words;
      if (list.length > 20) {
        list = [...list].sort(() => Math.random() - 0.5).slice(0, 20);
      }
      setWords(list);
    });
    setDone(false);
  }, [topicId, levelFilter]);

  if (!words) return <div className="loading">Loading flashcards...</div>;

  if (done) {
    return (
      <div>
        <button className="backbtn" onClick={() => navigate(-1)}>‹ Back to topic</button>
        <div className="card" style={{ textAlign: "center", padding: "28px 16px" }}>
          <div style={{ fontSize: 32 }}>🎉</div>
          <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 17, margin: "10px 0 4px", color: "var(--teal-deep)" }}>
            Session complete!
          </div>
          <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 16 }}>
            You reviewed {words.length} words in this topic.
          </div>
          <button className="btn-primary" onClick={() => navigate(-1)}>Back to topic</button>
        </div>
      </div>
    );
  }

  return (
    <StudySession
      words={words}
      onExit={() => navigate(-1)}
      onDone={() => setDone(true)}
    />
  );
}
