import { useEffect, useState } from "react";
import { api } from "../api.js";
import { getCustomExample } from "../customExamples.js";
import Icon from "./Icon.jsx";
import Loading from "./Loading.jsx";
import HanziStroke from "./HanziStroke.jsx";

function speak(text, rate = 0.95) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  // Chinese entries (hanzi) need the zh-CN voice.
  utter.lang = /[㐀-鿿]/.test(text) ? "zh-CN" : "en-US";
  utter.rate = rate;
  window.speechSynthesis.speak(utter);
}

// Derived purely from the word's own HSK level (already in our data) — no
// external source needed, since HSK bands are themselves ordered by usage
// frequency.
const POPULARITY_BY_LEVEL = {
  HSK1: "Rất phổ biến · dùng hằng ngày",
  HSK2: "Phổ biến · thường gặp",
  HSK3: "Khá phổ biến",
  HSK4: "Trung bình · hay gặp trong văn viết",
  HSK5: "Ít phổ biến · học thuật, trang trọng",
  HSK6: "Hiếm gặp · văn viết nâng cao"
};

function SoundBtn({ text, audioUrl, size = 30 }) {
  function play(e) {
    e.stopPropagation();
    if (audioUrl) {
      new Audio(audioUrl).play().catch(() => speak(text));
    } else {
      speak(text);
    }
  }
  return (
    <button
      aria-label="Pronounce"
      onClick={play}
      style={{
        background: "var(--teal-soft)", border: "none", borderRadius: "50%",
        width: size, height: size, cursor: "pointer", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center"
      }}
    >
      <Icon name="speaker-wave" size={size * 0.55} />
    </button>
  );
}

function Highlighted({ text, word }) {
  if (!text || !word) return text;
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(\\b${escaped}\\w*)`, "gi");
  const parts = text.split(re);
  return parts.map((part, i) =>
    i % 2 === 1 ? <b key={i} style={{ color: "var(--teal-deep)" }}>{part}</b> : part
  );
}

function Section({ title, children }) {
  return (
    <>
      <div style={{ fontSize: 11.5, fontWeight: 800, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 18, marginBottom: 8 }}>
        {title}
      </div>
      {children}
    </>
  );
}

export default function WordDetailModal({ wordId, onClose }) {
  const [detail, setDetail] = useState(null);
  const [tab, setTab] = useState("definitions");

  useEffect(() => {
    setDetail(null);
    setTab("definitions");
    let cancelled = false;
    api.vocabulary.wordDetail(wordId).then((d) => {
      if (!cancelled) setDetail(d);
    });
    return () => {
      cancelled = true;
      window.speechSynthesis?.cancel();
    };
  }, [wordId]);

  const customExample = detail ? getCustomExample(detail.id) : "";
  const dict = detail?.dictionary?.found ? detail.dictionary : null;

  const dictExamples = dict
    ? dict.meanings.flatMap((m) =>
        m.definitions.flatMap((d) => [d.example, ...(d.extraExamples || [])])
      ).filter(Boolean)
    : [];
  const examples = detail
    ? [...(detail.examples || []), detail.example, ...dictExamples]
        .filter(Boolean)
        .filter((ex, i, arr) => arr.findIndex((e) => e.toLowerCase() === ex.toLowerCase()) === i)
        .slice(0, 20)
    : [];

  // Always available — words missing from the open dictionaries fall back to
  // the app's own Vietnamese meaning + example.
  const hasDefinitions = Boolean(detail);
  const hasExamples = examples.length > 0;
  const hasNotes = Boolean(detail?.phrase || detail?.family || customExample);

  const tabs = [
    hasDefinitions && { id: "definitions", label: "Definitions" },
    hasExamples && { id: "examples", label: "Examples" },
    hasNotes && { id: "notes", label: "Notes" }
  ].filter(Boolean);
  const activeTab = tabs.some((t) => t.id === tab) ? tab : tabs[0]?.id;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

        {!detail ? (
          <div className="modal-scroll" style={{ padding: "26px 22px" }}>
            <Loading text="Loading word details..." />
          </div>
        ) : (
          <>
            <div className="modal-head">
              <div style={{ display: "flex", alignItems: "center", gap: 10, paddingRight: 36, flexWrap: "wrap" }}>
                {detail.image && <span style={{ fontSize: 26 }}>{detail.image}</span>}
                <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 900, fontSize: detail.word.length > 18 ? 19 : 24, color: "var(--teal-deep)", flex: 1, minWidth: 0, overflowWrap: "break-word" }}>
                  {detail.word}
                </div>
                <SoundBtn text={detail.word} />
                <span className="pill">{detail.level}</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 4, fontWeight: 700 }}>
                <span className="ipa-text">{detail.ipa}</span>{detail.partOfSpeech ? ` · ${detail.partOfSpeech}` : ""}
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "var(--teal)", marginTop: 10 }}>{detail.meaning}</div>
              {detail.id?.startsWith("zh-") && POPULARITY_BY_LEVEL[detail.level] && (
                <div style={{ fontSize: 10.5, color: "var(--ink-soft)", marginTop: 4, fontWeight: 700 }}>
                  📊 Độ phổ biến: {POPULARITY_BY_LEVEL[detail.level]}
                </div>
              )}
              {detail.id?.startsWith("zh-") && (
                <a
                  href={`https://hanzii.net/search/${encodeURIComponent(detail.word)}?hl=vi`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pill"
                  style={{ display: "inline-flex", marginTop: 8, textDecoration: "none" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  🔗 Xem thêm trên Hanzii ↗
                </a>
              )}

              {tabs.length > 1 && (
                <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
                  {tabs.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className="pill"
                      style={{
                        flex: 1, justifyContent: "center", cursor: "pointer",
                        background: activeTab === t.id ? "var(--teal)" : "var(--card)",
                        color: activeTab === t.id ? "#fff" : "var(--teal-deep)",
                        border: "1px solid var(--line)"
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-scroll">
              {(detail.progress?.forgotStreak || 0) >= 4 && (
                <div style={{ background: "var(--bad-soft)", border: "1px solid var(--bad)", borderRadius: 12, padding: "9px 12px", fontSize: 11.5, fontWeight: 700, color: "var(--bad-deep)", marginBottom: 12 }}>
                  ⚠️ This word keeps slipping away ({detail.progress.forgotStreak} misses in a row).
                  Try reading the examples below out loud, or write your own sentence with it.
                </div>
              )}
              {activeTab === "definitions" && (
                <>
                  {detail.id?.startsWith("zh-") && (
                    <Section title="Cách viết">
                      <HanziStroke word={detail.word} />
                    </Section>
                  )}

                  {detail.characters?.length > 0 && (
                    <Section title="Hán tự">
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {detail.characters.map((c, i) => (
                          <div key={i} className="card" style={{ padding: "10px 12px" }}>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 20, fontWeight: 800, color: "var(--teal-deep)" }}>{c.char}</span>
                              {c.hanViet && <span className="pill">{c.hanViet}</span>}
                              {c.radical && <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>{c.radical}</span>}
                              {c.strokeCount != null && <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>{c.strokeCount} nét</span>}
                            </div>
                            {c.componentMeaning && (
                              <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 4 }}>{c.componentMeaning}</div>
                            )}
                            {c.pictographicOrigin && (
                              <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 4, fontStyle: "italic" }}>
                                📜 {c.pictographicOrigin}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {detail.usage && (
                    <div className="explain-box" style={{ marginTop: 0 }}>
                      <Highlighted text={detail.usage} word={detail.word} />
                    </div>
                  )}

                  {detail.senses?.length > 0 && (
                    <Section title="Nghĩa theo từ loại">
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {detail.senses.map((s, i) => (
                          <div key={i}>
                            <div style={{ fontStyle: "italic", fontWeight: 800, fontSize: 12, color: "var(--violet-deep)", marginBottom: 6 }}>
                              {s.partOfSpeech}
                            </div>
                            <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
                              {s.meanings.map((m, j) => (
                                <li key={j} style={{ fontSize: 12.5, lineHeight: 1.6 }}>
                                  {m.meaning}
                                  {m.example && (
                                    <div style={{ color: "var(--ink-soft)", marginTop: 2 }}>
                                      “<Highlighted text={m.example} word={detail.word} />”
                                    </div>
                                  )}
                                </li>
                              ))}
                            </ol>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {!dict && !detail.usage && detail.senses?.length === 0 && (
                    <Section title="Definitions">
                      <div className="card" style={{ padding: "12px 14px" }}>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--teal)" }}>{detail.meaning}</div>
                        {detail.example && (
                          <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 6 }}>
                            “<Highlighted text={detail.example} word={detail.word} />”
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 10.5, color: "var(--ink-soft)", marginTop: 8 }}>
                        Cụm từ này chưa có trong từ điển mở — nghĩa và ví dụ lấy từ bộ từ vựng của app.
                      </div>
                    </Section>
                  )}

                  {dict && (
                    <Section title="Definitions">
                      {dict.phonetics.length > 0 && (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                          {dict.phonetics.map((p, i) => (
                            <button
                              key={i}
                              className="pill"
                              style={{ cursor: "pointer" }}
                              onClick={(e) => { e.stopPropagation(); if (p.audio) new Audio(p.audio).play().catch(() => speak(detail.word)); else speak(detail.word); }}
                            >
                              <Icon name="speaker-wave" size={13} />
                              <span className="ipa-text">{p.text || "listen"}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {dict.meanings.map((m, i) => (
                        <div key={i} style={{ marginBottom: i < dict.meanings.length - 1 ? 14 : 0 }}>
                          <div style={{ fontStyle: "italic", fontWeight: 800, fontSize: 12, color: "var(--violet-deep)", marginBottom: 6 }}>
                            {m.partOfSpeech}
                          </div>
                          <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
                            {m.definitions.map((d, j) => (
                              <li key={j} style={{ fontSize: 12.5, lineHeight: 1.6 }}>
                                <Highlighted text={d.definition} word={detail.word} />
                                {d.example && (
                                  <div style={{ color: "var(--ink-soft)", marginTop: 2 }}>
                                    “<Highlighted text={d.example} word={detail.word} />”
                                  </div>
                                )}
                              </li>
                            ))}
                          </ol>
                        </div>
                      ))}

                      {(dict.synonyms.length > 0 || dict.antonyms.length > 0) && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 14 }}>
                          {dict.synonyms.length > 0 && (
                            <div style={{ fontSize: 11.5 }}>
                              <b style={{ color: "var(--ink-soft)" }}>Synonyms: </b>{dict.synonyms.join(", ")}
                            </div>
                          )}
                          {dict.antonyms.length > 0 && (
                            <div style={{ fontSize: 11.5 }}>
                              <b style={{ color: "var(--ink-soft)" }}>Antonyms: </b>{dict.antonyms.join(", ")}
                            </div>
                          )}
                        </div>
                      )}

                      <div style={{ fontSize: 10, color: "var(--ink-soft)", marginTop: 10 }}>Source: Wiktionary</div>
                    </Section>
                  )}

                  {detail.grammarNote && (
                    <Section title="Ngữ pháp">
                      <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>
                        <Highlighted text={detail.grammarNote} word={detail.word} />
                      </div>
                      {detail.grammarExample && (
                        <div style={{ color: "var(--ink-soft)", fontSize: 12, marginTop: 6 }}>
                          “<Highlighted text={detail.grammarExample} word={detail.word} />”
                        </div>
                      )}
                    </Section>
                  )}

                  {detail.synonyms?.length > 0 && (
                    <Section title="Từ cận nghĩa">
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {detail.synonyms.map((s, i) => {
                          const word = typeof s === "string" ? s : s.word;
                          const example = typeof s === "string" ? null : s.example;
                          return (
                            <div key={i}>
                              <span className="pill" style={{ cursor: "pointer" }} onClick={() => speak(word)}>{word}</span>
                              {example && (
                                <div style={{ color: "var(--ink-soft)", fontSize: 12, marginTop: 4 }}>
                                  “<Highlighted text={example} word={word} />”
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </Section>
                  )}

                  {detail.antonyms?.length > 0 && (
                    <Section title="Từ trái nghĩa">
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {detail.antonyms.map((s, i) => {
                          const word = typeof s === "string" ? s : s.word;
                          const example = typeof s === "string" ? null : s.example;
                          return (
                            <div key={i}>
                              <span className="pill" style={{ cursor: "pointer" }} onClick={() => speak(word)}>{word}</span>
                              {example && (
                                <div style={{ color: "var(--ink-soft)", fontSize: 12, marginTop: 4 }}>
                                  “<Highlighted text={example} word={word} />”
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </Section>
                  )}

                  {detail.distinguish && (
                    <Section title="Phân biệt từ">
                      <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>
                        <Highlighted text={detail.distinguish} word={detail.word} />
                      </div>
                      {detail.distinguishExample && (
                        <div style={{ color: "var(--ink-soft)", fontSize: 12, marginTop: 6 }}>
                          “<Highlighted text={detail.distinguishExample} word={detail.word} />”
                        </div>
                      )}
                    </Section>
                  )}

                  {detail.compounds?.length > 0 && (
                    <Section title="Từ ghép thường gặp">
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {detail.compounds.map((c, i) => {
                          if (typeof c === "string") return <div key={i} style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>🔤 {c}</div>;
                          return (
                            <div key={i} className="card" style={{ padding: "8px 10px" }}>
                              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--teal-deep)" }}>
                                {c.word} <span className="ipa-text" style={{ fontWeight: 600, fontSize: 11 }}>{c.pinyin}</span>
                              </div>
                              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{c.meaning}</div>
                              {c.example && (
                                <div style={{ color: "var(--ink-soft)", fontSize: 11.5, marginTop: 4 }}>
                                  “<Highlighted text={c.example} word={c.word} />”
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </Section>
                  )}

                  {detail.collocations?.length > 0 && (
                    <Section title="Kết hợp từ">
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {detail.collocations.map((c, i) => {
                          if (typeof c === "string") return <div key={i} style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>💬 {c}</div>;
                          return (
                            <div key={i} className="card" style={{ padding: "8px 10px" }}>
                              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--teal-deep)" }}>
                                {c.phrase} <span className="ipa-text" style={{ fontWeight: 600, fontSize: 11 }}>{c.pinyin}</span>
                              </div>
                              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{c.meaning}</div>
                              {c.example && (
                                <div style={{ color: "var(--ink-soft)", fontSize: 11.5, marginTop: 4 }}>
                                  “<Highlighted text={c.example} word={c.phrase} />”
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </Section>
                  )}
                </>
              )}

              {activeTab === "examples" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {examples.map((ex, i) => (
                    <div key={i} className="card" style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ flex: 1, fontSize: 12.5 }}>
                        <Highlighted text={ex} word={detail.word} />
                      </span>
                      <SoundBtn text={ex} size={26} />
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "notes" && (
                <>
                  {detail.phrase && (
                    <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
                      💬 <Highlighted text={detail.phrase} word={detail.word} />
                    </div>
                  )}
                  {detail.family && (
                    <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 10 }}>
                      🌱 <Highlighted text={detail.family} word={detail.word} />
                    </div>
                  )}
                  {customExample && (
                    <div style={{ fontSize: 12.5, color: "var(--teal-deep)", marginTop: 10 }}>✏️ {customExample}</div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
