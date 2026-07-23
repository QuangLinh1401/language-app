import { useEffect, useMemo, useRef, useState } from "react";
import { speak } from "../speech.js";
import Icon from "./Icon.jsx";

const ROUND_SIZE = 6;

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function MatchMode({ words, onGrade, onFinish }) {
  const rounds = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < words.length; i += ROUND_SIZE) chunks.push(words.slice(i, i + ROUND_SIZE));
    return chunks;
  }, [words]);

  const [roundIndex, setRoundIndex] = useState(0);
  const [phase, setPhase] = useState("match"); // "match" -> "type" -> next round
  const [leftOrder, setLeftOrder] = useState([]);
  const [rightOrder, setRightOrder] = useState([]);
  const [matchedIds, setMatchedIds] = useState(new Set());
  const [selectedWordId, setSelectedWordId] = useState(null);
  const [selectedMeaningId, setSelectedMeaningId] = useState(null);
  const [wrongPair, setWrongPair] = useState(null);
  const [misses, setMisses] = useState({});

  // Typing (dictation) phase state
  const [typeIndex, setTypeIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [typeResult, setTypeResult] = useState(null); // null | "correct" | "wrong"
  const inputRef = useRef(null);

  const round = rounds[roundIndex] || [];

  useEffect(() => {
    if (round.length > 0) {
      setLeftOrder(shuffle(round));
      setRightOrder(shuffle(round));
      setMatchedIds(new Set());
      setSelectedWordId(null);
      setSelectedMeaningId(null);
      setPhase("match");
      setTypeIndex(0);
      setTyped("");
      setTypeResult(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIndex, rounds]);

  useEffect(() => {
    if (phase === "match" && round.length > 0 && matchedIds.size === round.length) {
      const timer = setTimeout(() => {
        // Matching word <-> meaning is recognition-level practice.
        round.forEach((w) => onGrade(w.id, (misses[w.id] || 0) > 0 ? "hard" : "good", "recognition"));
        setPhase("type");
      }, 600);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedIds]);

  // Speak the target word when a new typing prompt appears, and focus the input.
  useEffect(() => {
    if (phase === "type" && round[typeIndex]) {
      speak(round[typeIndex].word);
      inputRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, typeIndex]);

  if (rounds.length === 0 || roundIndex >= rounds.length) {
    return null;
  }

  function tryMatch(wordId, meaningId) {
    if (wordId === meaningId) {
      setMatchedIds((prev) => new Set([...prev, wordId]));
      setSelectedWordId(null);
      setSelectedMeaningId(null);
    } else {
      setWrongPair([wordId, meaningId]);
      setMisses((m) => ({ ...m, [wordId]: (m[wordId] || 0) + 1 }));
      setTimeout(() => {
        setWrongPair(null);
        setSelectedWordId(null);
        setSelectedMeaningId(null);
      }, 500);
    }
  }

  function clickWord(id) {
    if (matchedIds.has(id) || wrongPair) return;
    const w = round.find((x) => x.id === id);
    if (w) speak(w.word);
    setSelectedWordId(id);
    if (selectedMeaningId) tryMatch(id, selectedMeaningId);
  }

  function clickMeaning(id) {
    if (matchedIds.has(id) || wrongPair) return;
    setSelectedMeaningId(id);
    if (selectedWordId) tryMatch(selectedWordId, id);
  }

  function checkTyped() {
    if (typeResult) return;
    const w = round[typeIndex];
    const correct = typed.trim().toLowerCase() === w.word.trim().toLowerCase();
    setTypeResult(correct ? "correct" : "wrong");
    // Typing the word from sound + meaning is production-level practice.
    onGrade(w.id, correct ? "good" : "forgot", "production");
  }

  function nextTyped() {
    if (typeIndex + 1 < round.length) {
      setTypeIndex((i) => i + 1);
      setTyped("");
      setTypeResult(null);
    } else if (roundIndex + 1 < rounds.length) {
      setRoundIndex((i) => i + 1);
    } else {
      onFinish();
    }
  }

  if (phase === "type") {
    const w = round[typeIndex];
    return (
      <div>
        <p className="sub" style={{ marginBottom: 12 }}>
          Round {roundIndex + 1}/{rounds.length} · Now type each word ({typeIndex + 1}/{round.length})
        </p>

        <div className="card" style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 13.5, color: "var(--teal)", fontWeight: 700 }}>{w.meaning}</div>
          <button
            aria-label="Listen to the word"
            title="Listen again"
            onClick={() => speak(w.word)}
            style={{ margin: "12px auto 0", width: 40, height: 40, borderRadius: "50%", background: "#EAF3F1", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          ><Icon name="speaker-wave" size={20} /></button>
          <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 8 }}>
            Listen and type the English word
          </div>

          <input
            ref={inputRef}
            className={"fib-input" + (typeResult ? (typeResult === "correct" ? " correct" : " wrong") : "")}
            style={{ width: "100%", marginTop: 12 }}
            placeholder="Type the word here..."
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              if (!typeResult) checkTyped();
              else nextTyped();
            }}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />

          {typeResult && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontSize: 12, fontWeight: 700, marginTop: 8, color: typeResult === "correct" ? "var(--good-deep)" : "var(--bad-deep)" }}>
              <Icon name={typeResult === "correct" ? "check" : "cross"} size={15} />
              {typeResult === "correct" ? "Correct!" : `Not quite — it's "${w.word}"`}
            </div>
          )}
        </div>

        {!typeResult ? (
          <button className="btn-primary" disabled={typed.trim() === ""} onClick={checkTyped}>Check</button>
        ) : (
          <button className="btn-primary" onClick={nextTyped}>
            {typeIndex + 1 < round.length ? "Next word" : roundIndex + 1 < rounds.length ? "Next round" : "Finish"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <p className="sub" style={{ marginBottom: 12 }}>
        Round {roundIndex + 1}/{rounds.length} · Match each word to its meaning · Tap a word to hear it
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          {leftOrder.map((w) => {
            const isMatched = matchedIds.has(w.id);
            const isSelected = selectedWordId === w.id;
            const isWrong = wrongPair && wrongPair[0] === w.id;
            return (
              <button
                key={w.id}
                disabled={isMatched}
                onClick={() => clickWord(w.id)}
                style={{
                  padding: "10px 8px", borderRadius: 10, fontSize: 12.5, fontFamily: "inherit", cursor: isMatched ? "default" : "pointer",
                  border: "1px solid " + (isMatched ? "var(--good)" : isWrong ? "var(--bad)" : isSelected ? "var(--teal)" : "var(--line)"),
                  background: isMatched ? "#E4F5EA" : isWrong ? "#FCE9EA" : isSelected ? "#EAF3F1" : "#fff",
                  opacity: isMatched ? 0.6 : 1
                }}
              >
                {w.word}
              </button>
            );
          })}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          {rightOrder.map((w) => {
            const isMatched = matchedIds.has(w.id);
            const isSelected = selectedMeaningId === w.id;
            const isWrong = wrongPair && wrongPair[1] === w.id;
            return (
              <button
                key={w.id}
                disabled={isMatched}
                onClick={() => clickMeaning(w.id)}
                style={{
                  padding: "10px 8px", borderRadius: 10, fontSize: 12, fontFamily: "inherit", cursor: isMatched ? "default" : "pointer",
                  border: "1px solid " + (isMatched ? "var(--good)" : isWrong ? "var(--bad)" : isSelected ? "var(--teal)" : "var(--line)"),
                  background: isMatched ? "#E4F5EA" : isWrong ? "#FCE9EA" : isSelected ? "#EAF3F1" : "#fff",
                  opacity: isMatched ? 0.6 : 1
                }}
              >
                {w.meaning}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
