import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ModeSelector from "./ModeSelector.jsx";
import FlashcardMode from "./FlashcardMode.jsx";
import QuizMode from "./QuizMode.jsx";
import MatchMode from "./MatchMode.jsx";
import { api } from "../api.js";

// Shared study flow: pick a mode, then run it, with a back button always visible.
// Used anywhere we hand a list of words to the learner (SRS review, topic study,
// browsing by status, etc.) so behavior stays consistent everywhere.
export default function StudySession({ words, onExit, onDone }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);

  // Each mode reports which knowledge tier it exercises
  // (recognition / recall / context / production).
  async function grade(wordId, g, tier) {
    await api.vocabulary.grade(wordId, g, tier);
  }

  function selectMode(m) {
    if (m === "reading") {
      navigate("/vocabulary/practice", { state: { wordIds: words.map((w) => w.id) } });
      return;
    }
    setMode(m);
  }

  if (words.length === 0) {
    return (
      <div>
        <button className="backbtn" onClick={onExit}>‹ Back</button>
        <div className="loading">No words here right now 🎉</div>
      </div>
    );
  }

  if (!mode) {
    return (
      <div>
        <button className="backbtn" onClick={onExit}>‹ Back</button>
        <p className="sub">{words.length} word{words.length === 1 ? "" : "s"} ready</p>
        <ModeSelector onSelect={selectMode} />
      </div>
    );
  }

  return (
    <div>
      <button className="backbtn" onClick={() => setMode(null)}>‹ Change mode</button>
      {mode === "flashcard" && <FlashcardMode words={words} onGrade={grade} onFinish={onDone} />}
      {mode === "quiz" && <QuizMode words={words} onGrade={grade} onFinish={onDone} />}
      {mode === "match" && <MatchMode words={words} onGrade={grade} onFinish={onDone} />}
    </div>
  );
}
