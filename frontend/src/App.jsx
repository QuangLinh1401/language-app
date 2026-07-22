import { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import BottomNav from "./components/BottomNav.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import SettingsModal from "./components/SettingsModal.jsx";
import Icon from "./components/Icon.jsx";
import { auth } from "./api.js";

import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Vocabulary from "./pages/Vocabulary.jsx";
import VocabTopic from "./pages/VocabTopic.jsx";
import Flashcard from "./pages/Flashcard.jsx";
import VocabReview from "./pages/VocabReview.jsx";
import VocabPractice from "./pages/VocabPractice.jsx";
import VocabBrowse from "./pages/VocabBrowse.jsx";
import Grammar from "./pages/Grammar.jsx";
import GrammarLesson from "./pages/GrammarLesson.jsx";
import Listening from "./pages/Listening.jsx";
import ListeningLesson from "./pages/ListeningLesson.jsx";
import Reading from "./pages/Reading.jsx";
import ReadingPassage from "./pages/ReadingPassage.jsx";
import Speaking from "./pages/Speaking.jsx";
import SpeakingShadowing from "./pages/SpeakingShadowing.jsx";
import SpeakingDialogue from "./pages/SpeakingDialogue.jsx";
import Progress from "./pages/Progress.jsx";

export default function App() {
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [user, setUser] = useState(() => (auth.token() ? auth.username() : null));

  // api.js fires this when a request comes back 401 (expired/invalid token).
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener("auth-expired", onExpired);
    return () => window.removeEventListener("auth-expired", onExpired);
  }, []);

  function logout() {
    auth.clear();
    setUser(null);
    setShowSettings(false);
  }

  if (!user) {
    return <Login onLogin={(name) => setUser(name)} />;
  }

  return (
    <div className="app-shell">
      <ScrollToTop />
      <button
        className="settings-gear"
        onClick={() => setShowSettings(true)}
        aria-label="Settings"
        title="Settings"
      >
        <Icon name="gear" size={20} />
      </button>
      <div className="app-content">
        <div key={location.pathname + ":" + resetKey} className="view-transition">
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/vocabulary" element={<Vocabulary />} />
          <Route path="/vocabulary/review" element={<VocabReview />} />
          <Route path="/vocabulary/browse" element={<VocabBrowse />} />
          <Route path="/vocabulary/practice" element={<VocabPractice />} />
          <Route path="/vocabulary/:topicId" element={<VocabTopic />} />
          <Route path="/vocabulary/:topicId/flashcards" element={<Flashcard />} />

          <Route path="/grammar" element={<Grammar />} />
          <Route path="/grammar/:lessonId" element={<GrammarLesson />} />

          <Route path="/listening" element={<Listening />} />
          <Route path="/listening/:lessonId" element={<ListeningLesson />} />

          <Route path="/reading" element={<Reading />} />
          <Route path="/reading/:passageId" element={<ReadingPassage />} />

          <Route path="/speaking" element={<Speaking />} />
          <Route path="/speaking/shadowing/:topic" element={<SpeakingShadowing />} />
          <Route path="/speaking/dialogue/:dialogueId" element={<SpeakingDialogue />} />

          <Route path="/progress" element={<Progress />} />
        </Routes>
        </div>
      </div>
      <BottomNav />
      {showSettings && (
        <SettingsModal
          username={user}
          onClose={() => setShowSettings(false)}
          onReset={() => setResetKey((k) => k + 1)}
          onLogout={logout}
        />
      )}
    </div>
  );
}
