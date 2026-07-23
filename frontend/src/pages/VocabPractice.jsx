import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../api.js";
import Loading from "../components/Loading.jsx";

function renderBold(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <b key={i} style={{ color: "var(--teal)" }}>{part.slice(2, -2)}</b>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function VocabPractice() {
  const navigate = useNavigate();
  const location = useLocation();
  const fixedWordIds = location.state?.wordIds || null;

  const [passage, setPassage] = useState(null);
  const [level, setLevel] = useState("");
  const [loading, setLoading] = useState(true);
  const [quizStarted, setQuizStarted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);
  const [finished, setFinished] = useState(false);

  async function load(lv) {
    setLoading(true);
    setPassage(null);
    setQuizStarted(false);
    setAnswers({});
    setChecked(false);
    setFinished(false);
    const payload = fixedWordIds ? { wordIds: fixedWordIds } : { count: 8, level: lv || undefined };
    const p = await api.vocabulary.practiceReading(payload);
    setPassage(p);
    setLoading(false);
  }

  useEffect(() => {
    load(level || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !passage) return <Loading text="Generating your practice reading..." />;

  const correctCount = passage.questions.filter((q) => answers[q.id] === q.answer).length;

  async function finish() {
    const gradeLabel = correctCount / passage.questions.length >= 0.7 ? "good" : "hard";
    const ids = passage.wordIds || [];
    // Reading a fresh passage tests the words in a new context.
    await Promise.all(ids.map((id) => api.vocabulary.grade(id, gradeLabel, "context")));
    setFinished(true);
  }

  return (
    <div>
      <button className="backbtn" onClick={() => navigate(-1)}>‹ Back</button>
      <h1 className="page-title">Practice Reading</h1>
      <p className="sub">
        {fixedWordIds ? "A short passage built from your selected words" : "A short passage built from words you're still learning"}
      </p>

      {!fixedWordIds && (
        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          {["", "A1", "A2", "B1", "B2"].map((lv) => (
            <button
              key={lv || "all"}
              onClick={() => { setLevel(lv); load(lv || undefined); }}
              className="pill"
              style={{
                cursor: "pointer",
                background: level === lv ? "var(--teal)" : "var(--card)",
                color: level === lv ? "#fff" : "var(--teal-deep)",
                border: "1px solid var(--line)"
              }}
            >
              {lv || "All levels"}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {passage.boldWords.map((w) => (
          <span key={w} className="pill" style={{ fontSize: 10.5 }}>{w}</span>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16, lineHeight: 1.8, fontSize: 13.5 }}>
        {renderBold(passage.text)}
      </div>
      {passage.isFallback && (
        <div style={{ fontSize: 10.5, color: "var(--ink-soft)", marginBottom: 12 }}>
          (Built from your saved example sentences — add ANTHROPIC_API_KEY in backend/.env for freshly written AI passages instead.)
        </div>
      )}

      {!quizStarted && !finished && (
        <button className="btn-primary" onClick={() => setQuizStarted(true)}>I've finished reading — Start the quiz</button>
      )}

      {quizStarted && !finished && (
        <>
          <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Comprehension questions</div>
          <div className="card">
            {passage.questions.map((q, i) => (
              <div key={q.id} style={{ marginBottom: i < passage.questions.length - 1 ? 16 : 0 }}>
                <div style={{ fontSize: 13, marginBottom: 6 }}>{i + 1}. {q.prompt}</div>
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
              </div>
            ))}

            {!checked && (
              <button
                className="btn-primary"
                style={{ marginTop: 14 }}
                disabled={Object.keys(answers).length < passage.questions.length}
                onClick={() => setChecked(true)}
              >
                Check answers
              </button>
            )}

            {checked && (
              <div className="explain-box" style={{ marginTop: 12 }}>
                You got {correctCount}/{passage.questions.length} correct.
                <button className="btn-ghost" onClick={finish}>Finish practice</button>
              </div>
            )}
          </div>
        </>
      )}

      {finished && (
        <div className="card" style={{ textAlign: "center", padding: "24px 16px" }}>
          <div style={{ fontSize: 28 }}>🎉</div>
          <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 16, margin: "8px 0", color: "var(--teal-deep)" }}>
            Nice work!
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {!fixedWordIds && <button className="btn-ghost" onClick={() => load(level || undefined)}>Practice more words</button>}
            <button className="btn-primary" onClick={() => navigate("/")}>Back to Home</button>
          </div>
        </div>
      )}
    </div>
  );
}
