import React, { useState, useEffect } from 'react';
import { Lobby } from './screens/Lobby.jsx';
import { LiveCourtroom } from './screens/LiveCourtroom.jsx';
import { VerdictScreen } from './screens/VerdictScreen.jsx';
import { ConstitutionEditor } from './screens/ConstitutionEditor.jsx';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState("lobby"); // 'lobby', 'court', 'verdict', 'editor'
  const [sessionData, setSessionData] = useState({
    roomId: "court-" + Math.random().toString(36).substring(2, 7),
    userName: "Advocate",
    side: "petitioner",
    constitutionId: "indian_constitution",
    judgePersona: "Strict",
    turnDuration: 60
  });
  const [currentVerdict, setCurrentVerdict] = useState(null);

  // Parse path on initial load if directly navigated to /court/:roomId
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith("/court/")) {
      const id = path.replace("/court/", "");
      if (id) {
        setSessionData((prev) => ({ ...prev, roomId: id, side: "respondent" }));
        setCurrentRoute("court");
      }
    } else if (path === "/constitutions/new") {
      setCurrentRoute("editor");
    }
  }, []);

  const handleEnterCourt = (data) => {
    setSessionData(data);
    window.history.pushState({}, "", `/court/${data.roomId}`);
    setCurrentRoute("court");
  };

  const handleLeaveCourt = () => {
    window.history.pushState({}, "", "/lobby");
    setCurrentRoute("lobby");
  };

  const handleViewVerdict = (verdict) => {
    setCurrentVerdict(verdict);
    setCurrentRoute("verdict");
  };

  const handleReturnLobby = () => {
    window.history.pushState({}, "", "/lobby");
    setCurrentRoute("lobby");
  };

  return (
    <div className="court-clash-app" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {currentRoute === "lobby" && (
        <Lobby
          onEnterCourt={handleEnterCourt}
          onOpenEditor={() => {
            window.history.pushState({}, "", "/constitutions/new");
            setCurrentRoute("editor");
          }}
        />
      )}

      {currentRoute === "court" && (
        <LiveCourtroom
          roomId={sessionData.roomId}
          mySide={sessionData.side}
          myName={sessionData.userName}
          onLeaveCourt={handleLeaveCourt}
          onViewVerdict={handleViewVerdict}
        />
      )}

      {currentRoute === "verdict" && currentVerdict && (
        <VerdictScreen
          verdict={currentVerdict}
          onReturnLobby={handleReturnLobby}
        />
      )}

      {currentRoute === "editor" && (
        <ConstitutionEditor
          onBack={() => {
            window.history.pushState({}, "", "/lobby");
            setCurrentRoute("lobby");
          }}
          onSaved={(newRulebook) => {
            setSessionData((prev) => ({ ...prev, constitutionId: newRulebook.id }));
            window.history.pushState({}, "", "/lobby");
            setCurrentRoute("lobby");
          }}
        />
      )}
    </div>
  );
}
