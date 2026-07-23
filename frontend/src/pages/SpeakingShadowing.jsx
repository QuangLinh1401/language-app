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
  utter.lang = /[㐀-鿿]/.test(text) ? "zh-CN" : "en-US";
  utter.rate = rate;
  window.speechSynthesis.speak(utter);
}

export default function SpeakingShadowing() {
  const { topic } = useParams();
  const [sentences, setSentences] = useState(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    api.speaking.shadowing().then((all) => {
      setSentences(all.filter((s) => s.topic === decodeURIComponent(topic)));
    });
  }, [topic]);

  if (!sentences) return <Loading />;
  if (sentences.length === 0) return <div className="loading">No sentences in this topic yet.</div>;

  const s = sentences[index];

  return (
    <div>
      <Link to="/speaking" className="backbtn">‹ Speaking</Link>
      <h1 className="page-title">{decodeURIComponent(topic)}</h1>
      <p className="sub">Sentence {index + 1}/{sentences.length} · Level {s.level}</p>

      <div className="card" style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 19, color: "var(--teal-deep)", marginBottom: 6 }}>
          {s.sentence}
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{s.ipa}</div>
        {s.meaning && (
          <div style={{ fontSize: 12.5, marginTop: 6 }}>{s.meaning}</div>
        )}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 10 }}>
          <button className="btn-ghost" onClick={() => speak(s.sentence, 0.9)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Icon name="speaker-wave" size={15} /> Normal speed
          </button>
          <button className="btn-ghost" onClick={() => speak(s.sentence, 0.6)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Icon name="speaker-wave" size={15} accent="muted" /> Slow
          </button>
        </div>

        <SpeakCheck sentence={s.sentence} />
      </div>

      <div className="mic-hint">Listen a few times, shadow it out loud, then hit the mic to check yourself.</div>

      <div style={{ display: "flex", gap: 8, marginTop: 16, marginBottom: 20 }}>
        <button className="btn-ghost" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>‹ Previous</button>
        <button className="btn-primary" disabled={index >= sentences.length - 1} onClick={() => setIndex((i) => i + 1)}>Next ›</button>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", margin: "18px 0 8px" }}>
        All sentences in this topic
      </div>
      <div className="card" style={{ padding: 0 }}>
        {sentences.map((sen, i) => (
          <div
            key={sen.id}
            onClick={() => setIndex(i)}
            style={{
              display: "flex", alignItems: "baseline", gap: 8,
              padding: "10px 14px", fontSize: 12.5, cursor: "pointer",
              borderBottom: i < sentences.length - 1 ? "1px solid var(--line)" : "none",
              background: i === index ? "var(--teal-soft)" : "transparent",
              color: i === index ? "var(--teal-deep)" : "var(--ink-soft)",
              fontWeight: i === index ? 700 : 400
            }}
          >
            <span style={{ flexShrink: 0 }}>{i + 1}.</span>
            <span style={{ flex: 1 }}>{sen.sentence}</span>
            <span className="pill" style={{ padding: "2px 8px", fontSize: 9.5, flexShrink: 0 }}>{sen.level}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
