const modes = [
  { id: "flashcard", icon: "/icons/mode-flashcard.svg", name: "Flashcards", desc: "Flip the card, rate how well you knew it" },
  { id: "quiz", icon: "/icons/mode-quiz.svg", name: "Fill in the Blank", desc: "Pick the right word to complete a sentence" },
  { id: "match", icon: "/icons/mode-match.svg", name: "Match Game", desc: "Match each word to its meaning" },
  { id: "reading", icon: "/icons/mode-reading.svg", name: "Reading Passage", desc: "Learn the words in context, then answer questions" }
];

export default function ModeSelector({ onSelect }) {
  return (
    <div>
      <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Choose how to study</div>
      {modes.map((m) => (
        <button
          key={m.id}
          onClick={() => onSelect(m.id)}
          className="topic-card"
          style={{ width: "100%", border: "1px solid var(--line)", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
        >
          <div className="topic-emoji"><img src={m.icon} alt="" className="mod-icon" /></div>
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 13 }}>{m.name}</b>
            <div style={{ fontSize: 10.5, color: "var(--ink-soft)", marginTop: 4 }}>{m.desc}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
