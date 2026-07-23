import { useState, useEffect } from "react";
import { getCustomExample, setCustomExample } from "../customExamples.js";
import Icon from "./Icon.jsx";

function speak(text) {
  if (!window.speechSynthesis) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = 0.95;
  window.speechSynthesis.speak(utter);
}

const gradeMsgs = {
  forgot: "This word will come back in about 10 minutes.",
  hard: "This word will come back in about 1 day.",
  good: "This word will come back in a few days.",
  easy: "This word will come back in about 9 days — nice work!"
};

export default function FlashcardMode({ words, onGrade, onFinish }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [msg, setMsg] = useState("");
  const [typed, setTyped] = useState("");
  const [myExample, setMyExample] = useState("");
  const [editingExample, setEditingExample] = useState(false);

  if (index >= words.length) {
    onFinish();
    return null;
  }

  const w = words[index];

  useEffect(() => {
    setTyped("");
    setEditingExample(false);
    setMyExample(getCustomExample(w.id) || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w.id]);

  const typedChecked = typed.trim().length > 0;
  const typedCorrect = typed.trim().toLowerCase() === w.word.trim().toLowerCase();

  async function grade(g) {
    // Flashcards test recall: see the word, remember the meaning.
    await onGrade(w.id, g, "recall");
    setMsg(gradeMsgs[g]);
    setTimeout(() => {
      setMsg("");
      setFlipped(false);
      setIndex((i) => i + 1);
    }, 700);
  }

  function saveMyExample() {
    setCustomExample(w.id, myExample);
    setEditingExample(false);
  }

  return (
    <div>
      <div style={{ height: 5, background: "var(--line)", borderRadius: 3, marginBottom: 18, overflow: "hidden" }}>
        <div style={{ height: "100%", background: "var(--amber)", width: `${(index / words.length) * 100}%` }} />
      </div>

      <div className="flashcard" onClick={() => setFlipped((f) => !f)}>
        {!flipped ? (
          <>
            <div className="word">{w.word}</div>
            <div className="ipa">{w.ipa}</div>
            <button
              aria-label="Nghe phát âm từ"
              title="Nghe phát âm"
              onClick={(e) => { e.stopPropagation(); speak(w.word); }}
              style={{ marginTop: 12, width: 36, height: 36, borderRadius: "50%", background: "var(--teal-soft)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            ><Icon name="speaker-wave" size={18} /></button>
            <div className="tapmsg">Tap to see the meaning</div>
          </>
        ) : (
          <>
            <div className="meaning">{w.meaning}</div>
            <div className="example">"{w.example}"</div>
            <button
              aria-label="Nghe câu ví dụ"
              title="Nghe câu ví dụ"
              onClick={(e) => { e.stopPropagation(); speak(w.example); }}
              style={{ marginTop: 8, width: 32, height: 32, borderRadius: "50%", background: "var(--teal-soft)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            ><Icon name="speaker-wave" size={15} /></button>
            {w.phrase && <div className="example" style={{ marginTop: 6 }}>💬 {w.phrase}</div>}
            {w.family && <div className="example" style={{ marginTop: 6 }}>🌱 {w.family}</div>}

            <div style={{ marginTop: 14, width: "100%" }} onClick={(e) => e.stopPropagation()}>
              <input
                className={"fib-input" + (typedChecked ? (typedCorrect ? " correct" : " wrong") : "")}
                style={{ width: "100%" }}
                placeholder="Type the word to recall it..."
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
              />
              {typedChecked && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 700, marginTop: 4, color: typedCorrect ? "var(--good-deep)" : "var(--bad-deep)" }}>
                  <Icon name={typedCorrect ? "check" : "cross"} size={15} />
                  {typedCorrect ? "Correct!" : `Not quite — it's "${w.word}"`}
                </div>
              )}
            </div>

            <div style={{ marginTop: 12, width: "100%" }} onClick={(e) => e.stopPropagation()}>
              {editingExample ? (
                <>
                  <textarea
                    className="fib-input"
                    style={{ width: "100%", height: 50, textAlign: "left" }}
                    placeholder="Write your own example sentence..."
                    value={myExample}
                    onChange={(e) => setMyExample(e.target.value)}
                  />
                  <button className="btn-ghost" style={{ marginTop: 6 }} onClick={saveMyExample}>Save my example</button>
                </>
              ) : myExample ? (
                <div className="example" onClick={() => setEditingExample(true)} style={{ cursor: "pointer" }}>✏️ "{myExample}"</div>
              ) : (
                <button className="btn-ghost" onClick={() => setEditingExample(true)}>+ Write your own example</button>
              )}
            </div>

            <div className="tapmsg">How well do you know this word?</div>
          </>
        )}
      </div>

      <div className="grade-row">
        <button className="grade-btn g-forgot" onClick={() => grade("forgot")}>😵<small>Forgot</small></button>
        <button className="grade-btn g-hard" onClick={() => grade("hard")}>😬<small>Hard</small></button>
        <button className="grade-btn g-good" onClick={() => grade("good")}>🙂<small>Good</small></button>
        <button className="grade-btn g-easy" onClick={() => grade("easy")}>😎<small>Easy</small></button>
      </div>
      <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 10, textAlign: "center", minHeight: 14 }}>
        {msg}
      </div>
    </div>
  );
}
