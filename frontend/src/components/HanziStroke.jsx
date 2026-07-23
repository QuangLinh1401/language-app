import { useEffect, useRef, useState } from "react";
import HanziWriter from "hanzi-writer";

const SIZE = 88;

// One animated stroke-order box for a single Chinese character.
function CharBox({ char }) {
  const targetRef = useRef(null);
  const writerRef = useRef(null);
  const [quizzing, setQuizzing] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    setQuizzing(false);
    if (!targetRef.current) return;
    let cancelled = false;
    const writer = HanziWriter.create(targetRef.current, char, {
      width: SIZE,
      height: SIZE,
      padding: 6,
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 250,
      strokeColor: "#0f766e",
      radicalColor: "#c2410c",
      outlineColor: "#d9e2e0",
      showOutline: true,
      onLoadCharDataError: () => !cancelled && setFailed(true)
    });
    writerRef.current = writer;
    // Small delay so the box is laid out before the first stroke draws.
    const t = setTimeout(() => !cancelled && writer.animateCharacter(), 150);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [char]);

  function replay() {
    setQuizzing(false);
    writerRef.current?.animateCharacter();
  }

  function practice() {
    setQuizzing(true);
    writerRef.current?.quiz({
      onComplete: () => setTimeout(() => setQuizzing(false), 600)
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: SIZE, height: SIZE }}>
        {/* HanziWriter draws its SVG imperatively into this node — kept free of React-managed children. */}
        <div
          ref={targetRef}
          style={{
            width: SIZE, height: SIZE, borderRadius: 12,
            background: "var(--card)", border: "1px solid var(--line)"
          }}
        />
        {failed && (
          <div style={{
            position: "absolute", inset: 0, borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, background: "var(--card)"
          }}>
            {char}
          </div>
        )}
      </div>
      {!failed && (
        <div style={{ display: "flex", gap: 4 }}>
          <button className="pill" style={{ cursor: "pointer", fontSize: 10.5, padding: "3px 8px" }} onClick={replay}>
            ↻ Xem lại
          </button>
          <button
            className="pill"
            style={{ cursor: "pointer", fontSize: 10.5, padding: "3px 8px", background: quizzing ? "var(--teal)" : undefined, color: quizzing ? "#fff" : undefined }}
            onClick={practice}
          >
            ✏️ Tự viết
          </button>
        </div>
      )}
    </div>
  );
}

// Renders one stroke-order box per Chinese character in `word` (multi-char
// words like "认识" get one box each, laid out in a row).
export default function HanziStroke({ word }) {
  const chars = [...(word || "")].filter((c) => /[一-鿿]/.test(c));
  if (chars.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {chars.map((c, i) => (
        <CharBox key={`${c}-${i}`} char={c} />
      ))}
    </div>
  );
}
