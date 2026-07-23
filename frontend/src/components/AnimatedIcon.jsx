import { useEffect, useState } from "react";
import Lottie from "lottie-react";

// Fetches a Lottie JSON (Google Noto Animated Emoji, OFL/CC-BY) from /public
// and plays it in a small loop. Shows the static SVG fallback while loading,
// and permanently when the user prefers reduced motion.
const cache = {};
const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function AnimatedIcon({ src, size = 24, fallback, className }) {
  const [data, setData] = useState(cache[src] || null);

  useEffect(() => {
    if (reduceMotion || !src || cache[src]) return;
    let dead = false;
    fetch(src)
      .then((r) => r.json())
      .then((json) => {
        cache[src] = json;
        if (!dead) setData(json);
      })
      .catch(() => {}); // keep the static fallback on any error
    return () => { dead = true; };
  }, [src]);

  if (reduceMotion || !data) {
    return fallback ? (
      <img src={fallback} alt="" width={size} height={size} className={className} style={{ display: "block" }} />
    ) : null;
  }

  return (
    <Lottie
      animationData={data}
      loop
      autoplay
      className={className}
      style={{ width: size, height: size }}
    />
  );
}
