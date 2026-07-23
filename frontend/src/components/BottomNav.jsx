import { NavLink } from "react-router-dom";
import AnimatedIcon from "./AnimatedIcon.jsx";

const tabs = [
  { to: "/", label: "Home", anim: "/icons/nav-home.lottie.json", svg: "/icons/nav-home.svg", end: true },
  { to: "/vocabulary", label: "Learn", anim: "/icons/vocabulary.lottie.json", svg: "/icons/vocabulary.svg" },
  { to: "/reading", label: "Reading", svg: "/icons/reading.svg" },
  { to: "/speaking", label: "Speaking", anim: "/icons/speaking.lottie.json", svg: "/icons/speaking.svg" },
  { to: "/progress", label: "Progress", anim: "/icons/progress.lottie.json", svg: "/icons/progress.svg" }
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          data-anim-hover
          className={({ isActive }) => "nav-tab" + (isActive ? " active" : "")}
        >
          {({ isActive }) => (
            <>
              {t.anim ? (
                <AnimatedIcon src={t.anim} fallback={t.svg} size={20} hover active={isActive} className="icon" />
              ) : (
                <img src={t.svg} alt="" width={20} height={20} className="icon" style={{ display: "block" }} />
              )}
              {t.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
