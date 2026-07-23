import { useEffect, useState, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import Loading from "../components/Loading.jsx";

const speeds = [0.75, 1, 1.25, 1.5];

export default function ListeningLesson() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [rate, setRate] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);
  const utterRef = useRef(null);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    setPlaying(false);
    api.listening.lesson(lessonId).then(setLesson);
    setAnswers({});
    setChecked(false);
    setShowTranscript(false);
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [lessonId]);

  if (!lesson) return <Loading text="Loading lesson..." />;

  function play() {
    if (!window.speechSynthesis) {
      alert("This browser doesn't support text-to-speech. Try Chrome on desktop.");
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(lesson.script);
    utter.lang = /[㐀-鿿]/.test(lesson.script) ? "zh-CN" : "en-US";
    utter.rate = rate;
    utter.onend = () => setPlaying(false);
    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
    setPlaying(true);
  }
  function stop() {
    window.speechSynthesis.cancel();
    setPlaying(false);
  }

  function checkAnswers() {
    setChecked(true);
  }

  const isRight = (q) => (answers[q.id] || "").trim().toLowerCase() === q.answer.toLowerCase();

  async function finish() {
    const correct = lesson.questions.filter(isRight).length;
    const wrongIds = lesson.questions.filter((q) => !isRight(q)).map((q) => q.id);
    await api.listening.complete(lessonId, Math.round((correct / lesson.questions.length) * 100), wrongIds);
    navigate("/listening");
  }

  const prevWrong = new Set(lesson.progress?.wrongIds || []);

  return (
    <div>
      <Link to="/listening" className="backbtn">‹ Listening</Link>
      <h1 className="page-title">{lesson.title}</h1>
      <p className="sub">{lesson.topic} · Level {lesson.level}</p>

      <div className="player">
        <div style={{ fontSize: 12, opacity: 0.8 }}>Audio (browser text-to-speech)</div>
        <div className="player-controls">
          <button className="play-btn" onClick={playing ? stop : play}>{playing ? "❚❚" : "▶"}</button>
        </div>
        <div className="speed-row">
          {speeds.map((s) => (
            <button
              key={s}
              className={"speed-chip" + (rate === s ? " active" : "")}
              onClick={() => setRate(s)}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Questions</div>
      <div className="card">
        {lesson.questions.map((q, i) => (
          <div key={q.id} style={{ marginBottom: i < lesson.questions.length - 1 ? 16 : 0 }}>
            <div style={{ fontSize: 13, marginBottom: 6 }}>
              {i + 1}. {prevWrong.has(q.id) && <span title="Sai lần trước" style={{ color: "var(--amber-deep)" }}>⟳ </span>}{q.prompt}
            </div>
            {q.type === "blank" && (
              <input
                className={"fib-input" + (checked ? (
                  (answers[q.id] || "").trim().toLowerCase() === q.answer.toLowerCase() ? " correct" : " wrong"
                ) : "")}
                style={{ width: "100%" }}
                value={answers[q.id] || ""}
                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                placeholder="Type the missing word..."
              />
            )}
            {q.type === "mc" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {q.options.map((opt) => {
                  const isSelected = answers[q.id] === opt;
                  const isCorrect = checked && opt === q.answer;
                  const isWrongSelected = checked && isSelected && opt !== q.answer;
                  return (
                    <button
                      key={opt}
                      onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                      style={{
                        textAlign: "left", padding: "9px 12px", borderRadius: 10, fontSize: 12.5,
                        border: "1px solid " + (isCorrect ? "var(--good)" : isWrongSelected ? "var(--bad)" : "var(--line)"),
                        background: isSelected ? "var(--teal-soft)" : "var(--card)", cursor: "pointer", fontFamily: "inherit"
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}
            {checked && q.type === "blank" && (
              <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 4 }}>Answer: {q.answer}</div>
            )}
          </div>
        ))}

        {!checked && <button className="btn-primary" style={{ marginTop: 14 }} onClick={checkAnswers}>Check</button>}

        {checked && (
          <>
            <button className="btn-ghost" onClick={() => setShowTranscript((s) => !s)}>
              {showTranscript ? "Hide transcript" : "Show transcript"}
            </button>
            {showTranscript && <div className="explain-box">{lesson.script}</div>}
            <button className="btn-primary" style={{ marginTop: 10 }} onClick={finish}>Finish lesson</button>
          </>
        )}
      </div>
    </div>
  );
}
