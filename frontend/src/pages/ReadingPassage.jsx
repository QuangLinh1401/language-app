import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import Loading from "../components/Loading.jsx";

export default function ReadingPassage() {
  const { passageId } = useParams();
  const navigate = useNavigate();
  const [passage, setPassage] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const startRef = useRef(null);

  useEffect(() => {
    api.reading.passage(passageId).then(setPassage);
    setQuizStarted(false);
    setAnswers({});
    setChecked(false);
    setFinished(false);
    startRef.current = Date.now();
  }, [passageId]);

  if (!passage) return <Loading text="Loading passage..." />;

  // "blank" questions are typed, so compare loosely; choice questions exactly.
  const isRight = (q) =>
    q.type === "blank"
      ? (answers[q.id] || "").trim().toLowerCase() === q.answer.trim().toLowerCase()
      : answers[q.id] === q.answer;
  const correctCount = passage.questions.filter(isRight).length;
  const allAnswered = passage.questions.every((q) => (answers[q.id] || "").trim() !== "");

  function checkAnswers() {
    setChecked(true);
  }

  async function finish() {
    const elapsed = Math.round((Date.now() - startRef.current) / 1000);
    setTimeSeconds(elapsed);
    await api.reading.complete(passageId, correctCount, elapsed);
    setFinished(true);
  }

  if (finished) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "28px 16px" }}>
        <div style={{ fontSize: 32 }}>🎉</div>
        <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 17, margin: "10px 0 4px", color: "var(--teal-deep)" }}>
          Passage complete!
        </div>
        <div className="score-row" style={{ marginTop: 14 }}>
          <div className="score-chip"><b>{correctCount}/{passage.questions.length}</b><span>Correct</span></div>
          <div className="score-chip"><b>{Math.floor(timeSeconds / 60)}m {timeSeconds % 60}s</b><span>Time</span></div>
        </div>
        <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => navigate(-1)}>Back to Reading list</button>
      </div>
    );
  }

  return (
    <div>
      <button className="backbtn" onClick={() => navigate(-1)}>‹ Reading</button>
      <h1 className="page-title">{passage.title}</h1>
      <p className="sub">{passage.topic} · Level {passage.level} · {passage.wordCount} words</p>

      <div className="card" style={{ marginBottom: 16, whiteSpace: "pre-line", fontSize: 13.5, lineHeight: 1.8 }}>
        {passage.text}
      </div>

      {!quizStarted && (
        <button className="btn-primary" onClick={() => setQuizStarted(true)}>I've finished reading — Start the quiz</button>
      )}

      {quizStarted && (
        <>
          <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Comprehension questions</div>
          <div className="card">
            {passage.questions.map((q, i) => (
              <div key={q.id} style={{ marginBottom: i < passage.questions.length - 1 ? 16 : 0 }}>
                <div style={{ fontSize: 13, marginBottom: 6 }}>{i + 1}. {q.prompt}</div>
                {q.type === "blank" ? (
                  <div>
                    <input
                      className={"fib-input" + (checked ? (isRight(q) ? " correct" : " wrong") : "")}
                      style={{ width: "100%", textAlign: "left" }}
                      placeholder="Type the word..."
                      disabled={checked}
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                    {checked && !isRight(q) && (
                      <div style={{ fontSize: 11.5, color: "var(--bad-deep)", fontWeight: 700, marginTop: 4 }}>
                        Answer: {q.answer}
                      </div>
                    )}
                  </div>
                ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {q.options.map((opt) => {
                    const isSelected = answers[q.id] === opt;
                    const isCorrect = checked && opt === q.answer;
                    const isWrongSelected = checked && isSelected && opt !== q.answer;
                    return (
                      <button
                        key={opt}
                        disabled={checked}
                        onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                        style={{
                          textAlign: "left", padding: "9px 12px", borderRadius: 10, fontSize: 12.5,
                          border: "1px solid " + (isCorrect ? "var(--good)" : isWrongSelected ? "var(--bad)" : "var(--line)"),
                          background: isSelected ? "var(--teal-soft)" : "var(--card)", cursor: checked ? "default" : "pointer", fontFamily: "inherit"
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                )}
              </div>
            ))}

            {!checked && (
              <button
                className="btn-primary"
                style={{ marginTop: 14 }}
                disabled={!allAnswered}
                onClick={checkAnswers}
              >
                Check answers
              </button>
            )}

            {checked && (
              <div className="explain-box" style={{ marginTop: 12 }}>
                You got {correctCount}/{passage.questions.length} correct.
                <button className="btn-ghost" onClick={finish}>Finish reading</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
