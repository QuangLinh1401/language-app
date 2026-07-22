import { useEffect, useMemo, useState } from "react";

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
  const [leftOrder, setLeftOrder] = useState([]);
  const [rightOrder, setRightOrder] = useState([]);
  const [matchedIds, setMatchedIds] = useState(new Set());
  const [selectedWordId, setSelectedWordId] = useState(null);
  const [selectedMeaningId, setSelectedMeaningId] = useState(null);
  const [wrongPair, setWrongPair] = useState(null);
  const [misses, setMisses] = useState({});

  const round = rounds[roundIndex] || [];

  useEffect(() => {
    if (round.length > 0) {
      setLeftOrder(shuffle(round));
      setRightOrder(shuffle(round));
      setMatchedIds(new Set());
      setSelectedWordId(null);
      setSelectedMeaningId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIndex, rounds]);

  useEffect(() => {
    if (round.length > 0 && matchedIds.size === round.length) {
      const timer = setTimeout(() => {
        round.forEach((w) => onGrade(w.id, (misses[w.id] || 0) > 0 ? "hard" : "good"));
        if (roundIndex + 1 < rounds.length) {
          setRoundIndex((i) => i + 1);
        } else {
          onFinish();
        }
      }, 600);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedIds]);

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
    setSelectedWordId(id);
    if (selectedMeaningId) tryMatch(id, selectedMeaningId);
  }

  function clickMeaning(id) {
    if (matchedIds.has(id) || wrongPair) return;
    setSelectedMeaningId(id);
    if (selectedWordId) tryMatch(selectedWordId, id);
  }

  return (
    <div>
      <p className="sub" style={{ marginBottom: 12 }}>
        Round {roundIndex + 1}/{rounds.length} · Match each word to its meaning
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
