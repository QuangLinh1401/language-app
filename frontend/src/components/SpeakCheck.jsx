import { useEffect, useRef, useState } from "react";

// Records the learner's voice with the Web Speech API (SpeechRecognition) and
// compares it word-by-word with the target sentence, so shadowing gets real
// feedback instead of pure self-assessment. Free, on-device / browser-provided
// — no AI costs. Not supported in Firefox; the component hides itself there.
const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

function normalizeWords(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

// Word-level alignment via LCS: returns per-target-word hit/miss.
function matchWords(target, spoken) {
  const t = normalizeWords(target);
  const s = normalizeWords(spoken);
  const dp = Array.from({ length: t.length + 1 }, () => new Array(s.length + 1).fill(0));
  for (let i = t.length - 1; i >= 0; i--) {
    for (let j = s.length - 1; j >= 0; j--) {
      dp[i][j] = t[i] === s[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const hits = new Array(t.length).fill(false);
  let i = 0, j = 0;
  while (i < t.length && j < s.length) {
    if (t[i] === s[j]) { hits[i] = true; i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  const correct = hits.filter(Boolean).length;
  return { hits, score: t.length ? Math.round((correct / t.length) * 100) : 0 };
}

export default function SpeakCheck({ sentence }) {
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [result, setResult] = useState(null); // { hits, score }
  const [error, setError] = useState("");
  const recRef = useRef(null);

  // Reset feedback when the sentence changes.
  useEffect(() => {
    setHeard("");
    setResult(null);
    setError("");
  }, [sentence]);

  useEffect(() => () => recRef.current?.abort?.(), []);

  if (!SR) {
    return (
      <div style={{ fontSize: 11, color: "var(--ink-soft)", textAlign: "center", marginTop: 10 }}>
        🎤 Speech checking needs Chrome, Edge or Safari.
      </div>
    );
  }

  function start() {
    setError("");
    setHeard("");
    setResult(null);
    const rec = new SR();
    recRef.current = rec;
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setHeard(text);
      setResult(matchWords(sentence, text));
    };
    rec.onerror = (e) => {
      setError(
        e.error === "not-allowed"
          ? "Microphone access was blocked — allow it in your browser settings."
          : e.error === "no-speech"
            ? "Didn't catch anything — try again, a bit louder."
            : "Something went wrong, try again."
      );
      setListening(false);
    };
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  }

  const targetWords = sentence.split(/\s+/);
  // Map display words onto normalized hits (same order, punctuation kept).
  let hitIdx = 0;
  const normTarget = normalizeWords(sentence);

  return (
    <div style={{ marginTop: 12 }}>
      <button
        className={listening ? "btn-primary" : "btn-ghost"}
        onClick={start}
        disabled={listening}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
      >
        🎤 {listening ? "Listening... speak now!" : result ? "Try again" : "Say it — I'll check you"}
      </button>

      {error && (
        <div style={{ fontSize: 11.5, color: "var(--bad-deep)", fontWeight: 700, marginTop: 8, textAlign: "center" }}>
          {error}
        </div>
      )}

      {result && (
        <div className="card" style={{ marginTop: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 15, lineHeight: 1.8, textAlign: "center" }}>
            {targetWords.map((w, i) => {
              const norm = w.toLowerCase().replace(/[^a-z0-9']/g, "");
              let ok = null;
              if (norm && hitIdx < normTarget.length && norm === normTarget[hitIdx]) {
                ok = result.hits[hitIdx];
                hitIdx++;
              }
              return (
                <span
                  key={i}
                  style={{
                    fontWeight: 800,
                    color: ok === null ? "var(--ink)" : ok ? "var(--good-deep)" : "var(--bad-deep)",
                    textDecoration: ok === false ? "underline wavy var(--bad)" : "none",
                    marginRight: 4
                  }}
                >
                  {w}
                </span>
              );
            })}
          </div>
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <span className="pill" style={{ background: result.score >= 80 ? "var(--good-soft)" : result.score >= 50 ? "var(--amber-soft)" : "var(--bad-soft)", borderColor: "transparent", color: result.score >= 80 ? "var(--good-deep)" : result.score >= 50 ? "var(--amber-deep)" : "var(--bad-deep)" }}>
              {result.score >= 80 ? "🎉" : result.score >= 50 ? "💪" : "🔁"} {result.score}% match
            </span>
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-soft)", textAlign: "center", marginTop: 6, fontStyle: "italic" }}>
            I heard: "{heard}"
          </div>
        </div>
      )}
    </div>
  );
}
