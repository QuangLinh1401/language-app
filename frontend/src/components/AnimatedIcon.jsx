import { useEffect, useRef, useState } from "react";
import Lottie from "lottie-react";

// Animated emoji icon (Google Noto Animated Emoji Lottie JSON) with a static
// SVG fallback.
//
//   <AnimatedIcon src="/icons/fire.lottie.json" fallback="/icons/fire.svg" />
//
// Props:
// - (default)      fetch on mount, loop forever.
// - hover          static until the nearest [data-anim-hover] ancestor (or the
//                  icon itself) is hovered/touched; fetches lazily on first
//                  hover. Saves bandwidth and battery.
// - active         with hover: force continuous looping anyway (e.g. the
//                  currently-selected nav tab).
// Users with prefers-reduced-motion always get the static SVG.
const cache = {};
const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function AnimatedIcon({ src, size = 24, fallback, className, hover = false, active = false }) {
  const loopAlways = !hover || active;
  const [data, setData] = useState(cache[src] || null);
  const [hovering, setHovering] = useState(false);
  const boxRef = useRef(null);
  const lottieRef = useRef(null);
  const wantedRef = useRef(false);

  function load() {
    if (cache[src]) {
      setData(cache[src]);
      return;
    }
    fetch(src)
      .then((r) => r.json())
      .then((json) => {
        cache[src] = json;
        if (wantedRef.current || loopAlways) setData(json);
      })
      .catch(() => {});
  }

  // Eager fetch whenever we should be looping.
  useEffect(() => {
    if (reduceMotion || !src || !loopAlways) return;
    wantedRef.current = true;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, loopAlways]);

  // Hover mode: listen on the nearest [data-anim-hover] ancestor, fetch lazily.
  useEffect(() => {
    if (reduceMotion || !hover || !src) return;
    const box = boxRef.current;
    if (!box) return;
    const target = box.closest("[data-anim-hover]") || box;

    const enter = () => {
      wantedRef.current = true;
      setHovering(true);
      load();
    };
    const leave = () => setHovering(false);

    target.addEventListener("mouseenter", enter);
    target.addEventListener("mouseleave", leave);
    target.addEventListener("touchstart", enter, { passive: true });
    return () => {
      target.removeEventListener("mouseenter", enter);
      target.removeEventListener("mouseleave", leave);
      target.removeEventListener("touchstart", enter);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hover, src]);

  // Start/stop playback.
  const playing = loopAlways || hovering;
  useEffect(() => {
    if (!lottieRef.current || !data) return;
    if (playing) lottieRef.current.play();
    else lottieRef.current.goToAndStop(0, true);
  }, [playing, data]);

  return (
    <div ref={boxRef} className={className} style={{ width: size, height: size, display: "block" }}>
      {data && !reduceMotion ? (
        <Lottie
          lottieRef={lottieRef}
          animationData={data}
          loop
          autoplay={playing}
          style={{ width: "100%", height: "100%" }}
        />
      ) : fallback ? (
        <img src={fallback} alt="" width={size} height={size} style={{ display: "block", width: "100%", height: "100%" }} />
      ) : null}
    </div>
  );
}
