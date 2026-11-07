import React, { useState, useEffect } from 'react';
import { TopBar } from '../components/courtroom/TopBar.jsx';
import { PartyCard } from '../components/courtroom/PartyCard.jsx';
import { Bench } from '../components/courtroom/Bench.jsx';
import { ArgumentBar } from '../components/courtroom/ArgumentBar.jsx';
import { JudgeControls } from '../components/courtroom/JudgeControls.jsx';
import { socketService } from '../services/socketClient.js';
import { soundEffects } from '../services/soundEffects.js';

export function LiveCourtroom({
  roomId = "demo-room",
  mySide = "petitioner",
  myName = "Advocate",
  judgeMode = "ai",
  constitutionId = "indian_constitution",
  judgePersona = "Strict",
  turnDuration = 60,
  onLeaveCourt,
  onViewVerdict
}) {
  const [roomState, setRoomState] = useState({
    roomId,
    constitutionId,
    judgePersona,
    judgeMode,
    pendingObjection: null,
    phase: "ROUND_1_OPENING",
    turnIndex: 1,
    activeTurnSide: "petitioner",
    turnSecondsRemaining: turnDuration,
    participants: {
      petitioner: { name: myName, credibility: 85, connected: true },
      respondent: { name: "Respondent Counsel", credibility: 85, connected: true },
      judge: { name: "Hon'ble Judge", isHuman: judgeMode === "human", connected: true }
    },
    caseData: {
      caseTitle: "State University v. Aarav Sharma (Campus Free Expression)",
      facts: "Student suspended for online blog post detailing corrupt hostel fee irregularities.",
      reliefSought: "Immediate lifting of suspension and academic reinstatement.",
      articlesInPlay: [
        { articleNumber: "Article 19", title: "Freedom of speech & expression" }
      ],
      transcript: [
        {
          id: "1",
          speaker: "System",
          side: "system",
          text: "Court is now in session. The Indian Constitution governs these proceedings.",
          timestamp: new Date().toISOString()
        },
        {
          id: "2",
          speaker: "Bailiff",
          side: "system",
          text: "Petitioner, you have the floor for Round 1: Opening Arguments.",
          timestamp: new Date().toISOString()
        }
      ],
      verdict: null
    }
  });

  const [judgeSpeech, setJudgeSpeech] = useState(
    "Counsel, you may present your oral submissions. You have 60 seconds."
  );
  const [activeObjectionRuling, setActiveObjectionRuling] = useState(null);
  const [legalAidArticles, setLegalAidArticles] = useState([]);

  useEffect(() => {
    const socket = socketService.connect();

    // 1. Join room with judgeMode metadata
    socketService.joinRoom(roomId, myName, mySide, {
      judgeMode,
      constitutionId,
      judgePersona,
      turnDuration
    });

    // 2. Room State Updates
    socket.on("room:state", (updatedState) => {
      setRoomState((prev) => ({
        ...prev,
        ...updatedState,
        participants: {
          ...prev.participants,
          ...updatedState.participants
        },
        caseData: {
          ...prev.caseData,
          ...updatedState.caseData
        }
      }));

      // Check if verdict is ready
      if (updatedState.phase === "VERDICT_REVEALED" && updatedState.caseData?.verdict) {
        onViewVerdict(updatedState.caseData.verdict);
      }
    });

    // 3. Timer Ticks
    socket.on("turn:tick", ({ secondsRemaining, activeTurnSide, phase }) => {
      setRoomState((prev) => ({
        ...prev,
        turnSecondsRemaining: secondsRemaining,
        activeTurnSide,
        phase: phase || prev.phase
      }));
    });

    // 4. Turn Starts
    socket.on("turn:start", ({ phase, activeTurnSide, speakerName }) => {
      soundEffects.playTurnDing();
      setJudgeSpeech(
        `Floor transferred to ${speakerName} (${activeTurnSide?.toUpperCase()}) for ${phase}. Proceed.`
      );
    });

    // 5. Objection Rulings
    socket.on("judge:ruling-on-objection", (data) => {
      soundEffects.playObjection();
      setActiveObjectionRuling(data);
      setJudgeSpeech(
        `RULING ON OBJECTION: ${data.ruling}! ${data.explanation || ""}`
      );
      setTimeout(() => {
        setActiveObjectionRuling(null);
      }, 7000);
    });

    // 5b. Judge In-Trial Question
    socket.on("judge:question", ({ target_side, question, referenced_article }) => {
      soundEffects.playObjection();
      setJudgeSpeech(
        `JUDGE INTERRUPTS: "${question}" (Cited: ${referenced_article || "Rulebook"})`
      );
    });

    // 5c. Human Judge Gavel Struck
    socket.on("judge:gavel-struck", ({ judgeName }) => {
      soundEffects.playGavelStrike();
      setJudgeSpeech(`*ORDER IN THE COURT!* Hon'ble Magistrate (${judgeName}) calls the courtroom to order!`);
    });

    // 5d. Human Judge Objection Pending
    socket.on("judge:objection-pending", (pendingData) => {
      soundEffects.playObjection();
      setJudgeSpeech(`OBJECTION RAISED! Awaiting official ruling from Presiding Bench.`);
    });

    // 5e. Legal Aid Articles Received
    socket.on("judge:legal-aid-ready", ({ articles }) => {
      setLegalAidArticles(articles || []);
    });

    // 6. Verdict Ready
    socket.on("verdict:ready", ({ verdict }) => {
      soundEffects.playGavelStrike();
      setJudgeSpeech(`The bench has reached a decision. Announcing formal verdict...`);
      setTimeout(() => {
        onViewVerdict(verdict);
      }, 1500);
    });

    return () => {
      socket.off("room:state");
      socket.off("turn:tick");
      socket.off("turn:start");
      socket.off("judge:ruling-on-objection");
      socket.off("judge:question");
      socket.off("judge:gavel-struck");
      socket.off("judge:objection-pending");
      socket.off("judge:legal-aid-ready");
      socket.off("verdict:ready");
    };
  }, [roomId, myName, mySide, judgeMode, constitutionId, judgePersona, turnDuration, onViewVerdict]);

  // Handlers
  const handleSubmitArgument = (text) => {
    socketService.submitArgument(roomId, text);
  };

  const handleRaiseObjection = (reason) => {
    socketService.raiseObjection(roomId, reason);
  };

  const handleCiteArticle = (articleNumber) => {
    socketService.citeArticle(roomId, articleNumber, articleNumber);
  };

  const isMyTurn = roomState.activeTurnSide === mySide;
  const petitionerLatest = roomState.caseData.transcript
    .filter((t) => t.side === "petitioner" && t.type === "argument")
    .slice(-1)[0]?.text;
  const respondentLatest = roomState.caseData.transcript
    .filter((t) => t.side === "respondent" && t.type === "argument")
    .slice(-1)[0]?.text;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "16px 24px",
        width: "100%"
      }}
    >
      {/* 1. Top Bar */}
      <TopBar
        caseTitle={roomState.caseData.caseTitle}
        phase={roomState.phase}
        turnIndex={roomState.turnIndex}
        activeTurnSide={roomState.activeTurnSide}
        secondsRemaining={roomState.turnSecondsRemaining}
        onLeave={onLeaveCourt}
      />

      {/* Real-time Objection Ruling Banner */}
      {activeObjectionRuling && (
        <div
          style={{
            backgroundColor:
              activeObjectionRuling.ruling === "SUSTAINED"
                ? "rgba(255, 93, 115, 0.2)"
                : "rgba(255, 197, 61, 0.2)",
            border: `2px solid ${
              activeObjectionRuling.ruling === "SUSTAINED"
                ? "var(--accent-coral)"
                : "var(--accent-gold)"
            }`,
            borderRadius: "var(--radius-md)",
            padding: "12px 20px",
            marginBottom: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow:
              activeObjectionRuling.ruling === "SUSTAINED"
                ? "var(--shadow-glow-coral)"
                : "var(--shadow-glow-gold)"
          }}
          className="animate-slide-up"
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700" }}>
              <span
                style={{
                  color:
                    activeObjectionRuling.ruling === "SUSTAINED"
                      ? "var(--accent-coral)"
                      : "var(--accent-gold)",
                  fontSize: "1.1rem"
                }}
              >
                OBJECTION {activeObjectionRuling.ruling}!
              </span>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                (Raised by {activeObjectionRuling.objectingSide?.toUpperCase()})
              </span>
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--text-primary)", marginTop: "4px" }}>
              {activeObjectionRuling.explanation}
            </p>
          </div>
          <button
            onClick={() => setActiveObjectionRuling(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: "1.2rem",
              padding: "4px 8px"
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Main 3-Column Layout (280px, flexible, 280px) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
          flex: 1,
          alignItems: "stretch"
        }}
        className="courtroom-columns"
      >
        {/* Left Column: Petitioner Card (280px minimum) */}
        <div style={{ flex: "0 0 280px", maxWidth: "340px", width: "100%" }}>
          <PartyCard
            side="petitioner"
            name={roomState.participants.petitioner.name}
            credibility={roomState.participants.petitioner.credibility}
            isActiveTurn={roomState.activeTurnSide === "petitioner"}
            latestArgument={petitionerLatest}
            connected={roomState.participants.petitioner.connected}
          />
        </div>

        {/* Center Column: Presiding Bench */}
        <Bench
          judgePersona={roomState.judgePersona}
          judgeMode={roomState.judgeMode}
          judgeName={roomState.participants.judge?.name || "Hon'ble Judge"}
          isHumanJudge={roomState.participants.judge?.isHuman || judgeMode === "human"}
          judgeStatement={judgeSpeech}
          articlesInPlay={roomState.caseData.articlesInPlay}
          transcript={roomState.caseData.transcript}
        />

        {/* Right Column: Respondent Card (280px minimum) */}
        <div style={{ flex: "0 0 280px", maxWidth: "340px", width: "100%" }}>
          <PartyCard
            side="respondent"
            name={roomState.participants.respondent.name}
            credibility={roomState.participants.respondent.credibility}
            isActiveTurn={roomState.activeTurnSide === "respondent"}
            latestArgument={respondentLatest}
            connected={roomState.participants.respondent.connected}
          />
        </div>
      </div>

      {/* 3. Bottom Controls: Judge Controls if mySide === 'judge', else Counsel ArgumentBar */}
      {mySide === "judge" ? (
        <JudgeControls
          roomId={roomId}
          judgeName={myName}
          phase={roomState.phase}
          pendingObjection={roomState.pendingObjection}
          onStrikeGavel={() => socketService.strikeGavel(roomId)}
          onSubmitQuestion={(q) => socketService.submitJudgeQuestion(roomId, q)}
          onRuleObjection={(ruling, exp) => socketService.ruleObjection(roomId, ruling, exp)}
          onSubmitVerdict={(verdictData) => socketService.submitJudgeVerdict(roomId, verdictData)}
          onRequestLegalAid={() => socketService.requestLegalAid(roomId)}
          legalAidArticles={legalAidArticles}
        />
      ) : (
        <ArgumentBar
          isMyTurn={isMyTurn}
          currentSide={mySide}
          onSubmitArgument={handleSubmitArgument}
          onRaiseObjection={handleRaiseObjection}
          onCiteArticle={handleCiteArticle}
        />
      )}

      {/* 4. Educational Disclaimer Footer */}
      <footer
        style={{
          textAlign: "center",
          padding: "12px 0 6px",
          color: "var(--text-muted)",
          fontSize: "0.8rem",
          letterSpacing: "0.3px"
        }}
      >
        Disclaimer: This is an educational simulation, not legal advice. Rules are grounded via RAG over the chosen constitution.
      </footer>
    </div>
  );
}
