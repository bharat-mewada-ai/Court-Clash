import React, { useState, useEffect } from 'react';
import { Lobby } from './screens/Lobby.jsx';
import { LiveCourtroom } from './screens/LiveCourtroom.jsx';
import { VerdictScreen } from './screens/VerdictScreen.jsx';
import { ConstitutionEditor } from './screens/ConstitutionEditor.jsx';
import { Courtroom3DScreen } from './screens/Courtroom3DScreen.jsx';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState("lobby"); // 'lobby', 'court', 'court-3d', 'verdict', 'editor'
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
    } else if (path === "/3d") {
      setCurrentRoute("court-3d");
    }
  }, []);

  const handleEnterCourt = (data) => {
    setSessionData(data);
    window.history.pushState({}, "", `/court/${data.roomId}`);
    setCurrentRoute("court");
  };

  const handleOpen3D = () => {
    window.history.pushState({}, "", "/3d");
    setCurrentRoute("court-3d");
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
          onOpen3D={handleOpen3D}
          onOpenEditor={() => {
            window.history.pushState({}, "", "/constitutions/new");
            setCurrentRoute("editor");
          }}
        />
      )}

      {currentRoute === "court-3d" && (
        <Courtroom3DScreen onBack={handleReturnLobby} />
      )}

      {currentRoute === "court" && (
        <LiveCourtroom
          roomId={sessionData.roomId}
          mySide={sessionData.side}
          myName={sessionData.userName}
          judgeMode={sessionData.judgeMode || "ai"}
          constitutionId={sessionData.constitutionId || "indian_constitution"}
          judgePersona={sessionData.judgePersona || "Strict"}
          turnDuration={sessionData.turnDuration || 60}
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
