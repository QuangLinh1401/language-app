import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import AnimatedIcon from "../components/AnimatedIcon.jsx";
import Loading from "../components/Loading.jsx";

export default function Speaking() {
  const [shadowing, setShadowing] = useState(null);
  const [dialogues, setDialogues] = useState(null);
  const [tab, setTab] = useState("dialogues");

  useEffect(() => {
    api.speaking.shadowing().then(setShadowing);
    api.speaking.dialogues().then(setDialogues);
  }, []);

  if (!shadowing || !dialogues) return <Loading />;

  const topics = [...new Set(shadowing.map((s) => s.topic))];

  return (
    <div>
      <h1 className="page-title">Speaking</h1>
      <p className="sub">Shadow real sentences and dialogues out loud, at your own pace</p>

      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <button
          onClick={() => setTab("dialogues")}
          className="pill"
          data-anim-hover
          style={{
            flex: 1, justifyContent: "center", cursor: "pointer",
            background: tab === "dialogues" ? "var(--teal)" : "var(--card)",
            color: tab === "dialogues" ? "#fff" : "var(--teal-deep)",
            border: "1px solid var(--line)"
          }}
        >
          <AnimatedIcon src="/icons/topic-chat.lottie.json" fallback="/icons/topic-chat.svg" size={15} hover active={tab === "dialogues"} /> Dialogues ({dialogues.length})
        </button>
        <button
          onClick={() => setTab("shadowing")}
          className="pill"
          style={{
            flex: 1, justifyContent: "center", cursor: "pointer",
            background: tab === "shadowing" ? "var(--teal)" : "var(--card)",
            color: tab === "shadowing" ? "#fff" : "var(--teal-deep)",
            border: "1px solid var(--line)"
          }}
        >
          <img src="/icons/mic.svg" alt="" width={15} height={15} style={{ display: "block" }} /> Shadowing ({shadowing.length})
        </button>
      </div>

      {tab === "dialogues" && dialogues.map((d) => (
        <Link key={d.id} to={`/speaking/dialogue/${d.id}`} className="topic-card" style={{ background: "var(--coral-soft)", borderColor: "var(--coral-line)" }}>
          <div className="topic-emoji" style={{ background: "var(--card)" }}>
            <AnimatedIcon src="/icons/topic-chat.lottie.json" fallback="/icons/topic-chat.svg" size={22} hover />
          </div>
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 13 }}>{d.title}</b>
            <div style={{ fontSize: 10.5, color: "var(--ink-soft)", marginTop: 4 }}>
              {d.topic} · Level {d.level} · {d.lines.length} lines
            </div>
          </div>
        </Link>
      ))}

      {tab === "shadowing" && topics.map((t) => {
        const count = shadowing.filter((s) => s.topic === t).length;
        return (
          <Link key={t} to={`/speaking/shadowing/${encodeURIComponent(t)}`} className="topic-card" data-anim-hover>
            <div className="topic-emoji">
              <AnimatedIcon src="/icons/speaking.lottie.json" fallback="/icons/mic.svg" size={22} hover />
            </div>
            <div style={{ flex: 1 }}>
              <b style={{ fontSize: 13 }}>{t}</b>
              <div style={{ fontSize: 10.5, color: "var(--ink-soft)", marginTop: 4 }}>{count} sentences</div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
