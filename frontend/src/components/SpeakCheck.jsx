import { useEffect, useRef, useState } from "react";

// Records the learner's voice with the Web Speech API (SpeechRecognition) and
// compares it with the target sentence, so shadowing gets real feedback
// instead of pure self-assessment. Free, on-device / browser-provided — no AI
// costs. Not supported in Firefox; the component hides itself there.
// English is compared word-by-word; Chinese is compared character-by-character
// (no spaces between words in Chinese) with zh-CN recognition.
const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

const CJK_RE = /[㐀-鿿]/;
const isCjk = (text) => CJK_RE.test(text);

// Tokenize for comparison: CJK → individual characters, otherwise lowercase words.
function tokenize(text) {
  if (isCjk(text)) {
    return text.split("").filter((ch) => CJK_RE.test(ch));
  }
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

// Token-level alignment via LCS: returns per-target-token hit/miss.
function matchTokens(target, spoken) {
  const t = tokenize(target);
  const s = tokenize(spoken);
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
  const cjk = isCjk(sentence);

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
    rec.lang = cjk ? "zh-CN" : "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setHeard(text);
      setResult(matchTokens(sentence, text));
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

  // Display units: Chinese renders every character (punctuation kept, uncolored),
  // English renders whitespace-split words.
  const displayUnits = cjk ? sentence.split("") : sentence.split(/\s+/);
  let hitIdx = 0;
  const normTarget = tokenize(sentence);
  const normalizeUnit = (u) => (cjk ? (CJK_RE.test(u) ? u : "") : u.toLowerCase().replace(/[^a-z0-9']/g, ""));

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
          <div style={{ fontSize: cjk ? 18 : 15, lineHeight: 1.8, textAlign: "center" }}>
            {displayUnits.map((w, i) => {
              const norm = normalizeUnit(w);
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
                    marginRight: cjk ? 0 : 4
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
