import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";

// A short one-time placement test: 12 questions from A1 to B2. The result
// becomes the default level filter across the app (desirable difficulty from
// day one, instead of guessing your own level).
const QUESTIONS = [
  { id: "p1", band: "A1", prompt: "She ___ a student.", options: ["is", "are", "am", "be"], answer: "is" },
  { id: "p2", band: "A1", prompt: "I have two ___.", options: ["cats", "cat", "cates", "cat's"], answer: "cats" },
  { id: "p3", band: "A1", prompt: "___ you like coffee?", options: ["Do", "Does", "Are", "Is"], answer: "Do" },
  { id: "p4", band: "A2", prompt: "She ___ TV when I called her.", options: ["was watching", "watches", "is watching", "watched"], answer: "was watching" },
  { id: "p5", band: "A2", prompt: "This bag is ___ than that one.", options: ["cheaper", "more cheap", "cheapest", "as cheap"], answer: "cheaper" },
  { id: "p6", band: "A2", prompt: "There isn't ___ milk left.", options: ["any", "some", "a", "many"], answer: "any" },
  { id: "p7", band: "B1", prompt: "I ___ here since 2020.", options: ["have lived", "live", "lived", "am living"], answer: "have lived" },
  { id: "p8", band: "B1", prompt: "If I ___ you, I would take the job.", options: ["were", "am", "was being", "be"], answer: "were" },
  { id: "p9", band: "B1", prompt: "The bridge ___ in 1995.", options: ["was built", "built", "is building", "has built"], answer: "was built" },
  { id: "p10", band: "B2", prompt: "By next year, she ___ her degree.", options: ["will have finished", "will finish", "finishes", "has finished"], answer: "will have finished" },
  { id: "p11", band: "B2", prompt: "Never ___ such a beautiful sunset.", options: ["have I seen", "I have seen", "I saw", "did I saw"], answer: "have I seen" },
  { id: "p12", band: "B2", prompt: "He looks exhausted — he ___ all night.", options: ["must have worked", "must work", "should work", "can have worked"], answer: "must have worked" }
];

function recommend(score) {
  if (score >= 11) return "B2";
  if (score >= 8) return "B1";
  if (score >= 5) return "A2";
  return "A1";
}

export default function Placement() {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const answered = Object.keys(answers).length;

  async function finish() {
    const score = QUESTIONS.filter((q) => answers[q.id] === q.answer).length;
    const level = recommend(score);
    setSaving(true);
    try {
      localStorage.setItem("language-app-level", level);
      await api.progress.updateSettings({ preferredLevel: level });
    } catch {
      // saved locally anyway
    } finally {
      setSaving(false);
      setResult({ score, level });
    }
  }

  if (result) {
    return (
      <div>
        <div className="card" style={{ textAlign: "center", padding: "28px 16px" }}>
          <div style={{ fontSize: 36 }}>🧭</div>
          <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 18, margin: "10px 0 4px", color: "var(--teal-deep)" }}>
            Your level: {result.level}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 6 }}>
            You got {result.score}/12 correct.
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 16 }}>
            Vocabulary and lessons will now default to level {result.level}. You can change it anytime with the level filters.
          </div>
          <button className="btn-primary" disabled={saving} onClick={() => navigate("/")}>Start learning at {result.level}</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link to="/" className="backbtn">‹ Home</Link>
      <h1 className="page-title">Placement test</h1>
      <p className="sub">12 quick questions · about 2 minutes · finds your starting level</p>

      <div className="card">
        {QUESTIONS.map((q, i) => (
          <div key={q.id} style={{ marginBottom: i < QUESTIONS.length - 1 ? 16 : 0 }}>
            <div style={{ fontSize: 13, marginBottom: 6 }}>{i + 1}. {q.prompt}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {q.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                  style={{
                    textAlign: "left", padding: "9px 12px", borderRadius: 10, fontSize: 12.5,
                    border: "1px solid " + (answers[q.id] === opt ? "var(--teal)" : "var(--line)"),
                    background: answers[q.id] === opt ? "var(--teal-soft)" : "var(--card)",
                    cursor: "pointer", fontFamily: "inherit"
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
        <button
          className="btn-primary"
          style={{ marginTop: 16 }}
          disabled={answered < QUESTIONS.length || saving}
          onClick={finish}
        >
          {answered < QUESTIONS.length ? `Answer all questions (${answered}/12)` : saving ? "Saving..." : "See my level"}
        </button>
      </div>
    </div>
  );
}
