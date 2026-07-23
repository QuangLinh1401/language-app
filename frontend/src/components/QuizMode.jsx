import { useEffect, useState } from "react";

function blankOut(sentence, word) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\b(${escaped})\\b`, "i");
  if (re.test(sentence)) return sentence.replace(re, "_____");
  return sentence + " (_____)";
}

function buildOptions(words, index) {
  const w = words[index];
  const others = words.filter((_, i) => i !== index).map((o) => o.word);
  const shuffled = [...others].sort(() => Math.random() - 0.5).slice(0, 3);
  const options = [...shuffled, w.word].sort(() => Math.random() - 0.5);
  return options;
}

export default function QuizMode({ words, onGrade, onFinish }) {
  const [index, setIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (index < words.length) {
      setOptions(buildOptions(words, index));
      setSelected(null);
    }
  }, [index, words]);

  if (index >= words.length) {
    onFinish(score);
    return null;
  }

  const w = words[index];
  const blanked = blankOut(w.example, w.word);

  function choose(opt) {
    if (selected) return;
    setSelected(opt);
    const correct = opt.toLowerCase() === w.word.toLowerCase();
    if (correct) setScore((s) => s + 1);
    // Fill-in-the-blank tests understanding the word in a sentence context.
    onGrade(w.id, correct ? "good" : "forgot", "context");
    setTimeout(() => setIndex((i) => i + 1), 900);
  }

  return (
    <div>
      <div style={{ height: 5, background: "var(--line)", borderRadius: 3, marginBottom: 14, overflow: "hidden" }}>
        <div style={{ height: "100%", background: "var(--amber)", width: `${(index / words.length) * 100}%` }} />
      </div>
      <p className="sub" style={{ marginBottom: 12 }}>Question {index + 1}/{words.length} · Score {score}</p>

      <div className="card" style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 10.5, color: "var(--ink-soft)", marginBottom: 6 }}>{w.meaning}</div>
        <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 16, lineHeight: 1.7, color: "var(--teal-deep)" }}>
          {blanked}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {options.map((opt) => {
          const isCorrect = selected && opt.toLowerCase() === w.word.toLowerCase();
          const isWrongSelected = selected === opt && !isCorrect;
          return (
            <button
              key={opt}
              disabled={Boolean(selected)}
              onClick={() => choose(opt)}
              style={{
                textAlign: "left", padding: "11px 14px", borderRadius: 12, fontSize: 13.5,
                border: "1px solid " + (isCorrect ? "var(--good)" : isWrongSelected ? "var(--bad)" : "var(--line)"),
                background: isCorrect ? "var(--good-soft)" : isWrongSelected ? "var(--bad-soft)" : "var(--card)",
                cursor: selected ? "default" : "pointer", fontFamily: "inherit"
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
