import { NavLink } from "react-router-dom";
import AnimatedIcon from "./AnimatedIcon.jsx";

const tabs = [
  { to: "/", label: "Home", anim: "/icons/nav-home.lottie.json", svg: "/icons/nav-home.svg", end: true },
  { to: "/vocabulary", label: "Learn", anim: "/icons/vocabulary.lottie.json", svg: "/icons/vocabulary.svg" },
  { to: "/reading", label: "Reading", anim: "/icons/nerd.lottie.json", svg: "/icons/nerd.svg" },
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
          <AnimatedIcon src={t.anim} fallback={t.svg} size={20} hover className="icon" />
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
