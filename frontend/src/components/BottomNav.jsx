import { NavLink } from "react-router-dom";
import Icon from "./Icon.jsx";

const tabs = [
  { to: "/", label: "Home", iconName: "home", end: true },
  { to: "/vocabulary", label: "Learn", iconName: "book" },
  { to: "/reading", label: "Reading", iconName: "newspaper" },
  { to: "/speaking", label: "Speaking", iconName: "mic" },
  { to: "/progress", label: "Progress", iconName: "chart" }
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) => "nav-tab" + (isActive ? " active" : "")}
        >
          <Icon name={t.iconName} size={19} accent="nav" className="icon" />
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
