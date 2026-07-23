import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api.js";
import Icon from "../components/Icon.jsx";
import Loading from "../components/Loading.jsx";
import SpeakCheck from "../components/SpeakCheck.jsx";

function speak(text, rate = 0.9) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = rate;
  window.speechSynthesis.speak(utter);
}

function speakAll(lines, index = 0) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  lines.slice(index).forEach((line) => {
    const utter = new SpeechSynthesisUtterance(line.text);
    utter.lang = "en-US";
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  });
}

export default function SpeakingDialogue() {
  const { dialogueId } = useParams();
  const [dialogue, setDialogue] = useState(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    api.speaking.dialogues().then((all) => {
      setDialogue(all.find((d) => d.id === dialogueId) || null);
    });
    setCurrent(0);
  }, [dialogueId]);

  if (!dialogue) return <Loading text="Loading dialogue..." />;

  return (
    <div>
      <Link to="/speaking" className="backbtn">‹ Speaking</Link>
      <h1 className="page-title">{dialogue.title}</h1>
      <p className="sub">{dialogue.topic} · Level {dialogue.level} · {dialogue.lines.length} lines</p>

      <button className="btn-ghost" style={{ marginBottom: 14 }} onClick={() => speakAll(dialogue.lines, 0)}>
        ▶ Play the whole dialogue
      </button>

      <div className="card" style={{ padding: 0 }}>
        {dialogue.lines.map((line, i) => (
          <div
            key={i}
            onClick={() => setCurrent(i)}
            style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "12px 14px",
              borderBottom: i < dialogue.lines.length - 1 ? "1px solid var(--line)" : "none",
              background: current === i ? "var(--teal-soft)" : "transparent",
              cursor: "pointer"
            }}
          >
            <div style={{
              width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
              background: line.speaker === "A" ? "var(--teal)" : "var(--coral)",
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11.5, fontWeight: 700
            }}>
              {line.speaker}
            </div>
            <div style={{ flex: 1, fontSize: 13, lineHeight: 1.6 }}>{line.text}</div>
            <button
              aria-label="Nghe câu này"
              title="Nghe câu này"
              onClick={(e) => { e.stopPropagation(); speak(line.text); }}
              style={{ background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}
            ><Icon name="speaker-wave" size={17} /></button>
          </div>
        ))}
      </div>

      {dialogue.lines[current] && <SpeakCheck sentence={dialogue.lines[current].text} />}

      <div className="mic-hint" style={{ marginTop: 12 }}>
        Tap a line to select it, say it out loud, then hit the mic to check yourself.
      </div>
    </div>
  );
}
