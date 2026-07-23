// Shared text-to-speech helper, slightly slowed for learners.
// Auto-detects Chinese text (CJK characters) and switches the voice to zh-CN.
export function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = /[㐀-鿿]/.test(text) ? "zh-CN" : "en-US";
  utter.rate = 0.95;
  window.speechSynthesis.speak(utter);
}
