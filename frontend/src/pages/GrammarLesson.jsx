import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import Loading from "../components/Loading.jsx";

export default function GrammarLesson() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState({});
  const [done, setDone] = useState(false);

  useEffect(() => {
    api.grammar.lesson(lessonId).then(setLesson);
    setAnswers({});
    setChecked({});
    setDone(false);
  }, [lessonId]);

  if (!lesson) return <Loading text="Loading lesson..." />;

  function checkAll() {
    const result = {};
    lesson.exercises.forEach((ex) => {
      const val = (answers[ex.id] || "").trim().toLowerCase();
      result[ex.id] = val === ex.answer.toLowerCase();
    });
    setChecked(result);
  }

  async function finish() {
    const wrongIds = lesson.exercises.filter((ex) => checked[ex.id] === false).map((ex) => ex.id);
    await api.grammar.complete(lessonId, wrongIds);
    setDone(true);
  }

  // Exercises missed in the previous attempt — worth extra attention.
  const prevWrong = new Set(lesson.progress?.wrongIds || []);

  const allChecked = lesson.exercises.every((ex) => ex.id in checked);
  const correctCount = Object.values(checked).filter(Boolean).length;

  return (
    <div>
      <button className="backbtn" onClick={() => navigate(-1)}>‹ Grammar</button>
      <h1 className="page-title">{lesson.title}</h1>
      <p className="sub">Level {lesson.level}</p>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 10 }}>{lesson.theory}</div>
        {lesson.examples.map((ex, i) => (
          <div key={i} style={{ fontSize: 12.5, color: "var(--teal-deep)", fontStyle: "italic", marginBottom: 4 }}>
            • {ex}
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Practice exercises</div>
      {prevWrong.size > 0 && (
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--amber-deep)", marginBottom: 8 }}>
          ⟳ Lần trước bạn sai {prevWrong.size} câu — chú ý các câu được đánh dấu nhé.
        </div>
      )}
      <div className="card">
        {lesson.exercises.map((ex, i) => (
          <div key={ex.id} style={{ marginBottom: i < lesson.exercises.length - 1 ? 16 : 0 }}>
            <div style={{ fontSize: 13.5, lineHeight: 1.8, marginBottom: 6 }}>
              {i + 1}. {prevWrong.has(ex.id) && <span title="Sai lần trước" style={{ color: "var(--amber-deep)" }}>⟳ </span>}{ex.sentence.split("___")[0]}
              <input
                className={
                  "fib-input" +
                  (ex.id in checked ? (checked[ex.id] ? " correct" : " wrong") : "")
                }
                value={answers[ex.id] || ""}
                onChange={(e) => setAnswers({ ...answers, [ex.id]: e.target.value })}
              />
              {ex.sentence.split("___")[1]}
            </div>
            {ex.id in checked && !checked[ex.id] && (
              <div style={{ fontSize: 11.5, color: "var(--bad)" }}>Correct answer: {ex.answer}</div>
            )}
          </div>
        ))}
        <button className="btn-primary" style={{ marginTop: 14 }} onClick={checkAll}>Check</button>

        {allChecked && (
          <div className="explain-box" style={{ marginTop: 12 }}>
            You got {correctCount}/{lesson.exercises.length} correct.
            {!done && (
              <button className="btn-ghost" onClick={finish}>Mark lesson complete</button>
            )}
            {done && <div style={{ marginTop: 8, fontWeight: 700 }}>Progress saved! 🎉</div>}
          </div>
        )}
      </div>

      {done && (
        <button className="btn-ghost" onClick={() => navigate("/grammar")}>Back to lessons</button>
      )}
    </div>
  );
}
