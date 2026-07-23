import { useEffect, useRef, useState } from "react";
import Lottie from "lottie-react";

// Animated emoji icon (Google Noto Animated Emoji Lottie JSON) with a static
// SVG fallback.
//
//   <AnimatedIcon src="/icons/fire.lottie.json" fallback="/icons/fire.svg" />
//
// Modes:
// - default: fetch on mount, loop forever.
// - hover:   show the static SVG; the animation is fetched and played only
//            while the nearest [data-anim-hover] ancestor (or the icon itself)
//            is hovered/touched. Saves bandwidth and battery.
// Users with prefers-reduced-motion always get the static SVG.
const cache = {};
const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function AnimatedIcon({ src, size = 24, fallback, className, hover = false }) {
  const [data, setData] = useState(cache[src] || null);
  const [active, setActive] = useState(false); // hover mode: currently hovered
  const boxRef = useRef(null);
  const lottieRef = useRef(null);
  const wantedRef = useRef(false);

  // Loop mode: fetch immediately.
  useEffect(() => {
    if (reduceMotion || hover || !src || cache[src]) return;
    let dead = false;
    fetch(src)
      .then((r) => r.json())
      .then((json) => {
        cache[src] = json;
        if (!dead) setData(json);
      })
      .catch(() => {});
    return () => { dead = true; };
  }, [src, hover]);

  // Hover mode: listen on the nearest [data-anim-hover] ancestor and fetch lazily.
  useEffect(() => {
    if (reduceMotion || !hover || !src) return;
    const box = boxRef.current;
    if (!box) return;
    const target = box.closest("[data-anim-hover]") || box;

    const enter = () => {
      wantedRef.current = true;
      setActive(true);
      if (cache[src]) {
        setData(cache[src]);
      } else {
        fetch(src)
          .then((r) => r.json())
          .then((json) => {
            cache[src] = json;
            if (wantedRef.current) setData(json);
          })
          .catch(() => {});
      }
    };
    const leave = () => {
      wantedRef.current = false;
      setActive(false);
    };

    target.addEventListener("mouseenter", enter);
    target.addEventListener("mouseleave", leave);
    target.addEventListener("touchstart", enter, { passive: true });
    return () => {
      target.removeEventListener("mouseenter", enter);
      target.removeEventListener("mouseleave", leave);
      target.removeEventListener("touchstart", enter);
    };
  }, [hover, src]);

  // Hover mode: start/stop playback as hover state changes.
  useEffect(() => {
    if (!hover || !lottieRef.current) return;
    if (active) lottieRef.current.play();
    else lottieRef.current.goToAndStop(0, true);
  }, [active, hover, data]);

  return (
    <div ref={boxRef} className={className} style={{ width: size, height: size, display: "block" }}>
      {data && !reduceMotion ? (
        <Lottie
          lottieRef={lottieRef}
          animationData={data}
          loop
          autoplay={!hover}
          style={{ width: "100%", height: "100%" }}
        />
      ) : fallback ? (
        <img src={fallback} alt="" width={size} height={size} style={{ display: "block", width: "100%", height: "100%" }} />
      ) : null}
    </div>
  );
}
