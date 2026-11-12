import React, { useState, useEffect } from 'react';
import { TopBar } from '../components/courtroom/TopBar.jsx';
import { PartyCard } from '../components/courtroom/PartyCard.jsx';
import { Bench } from '../components/courtroom/Bench.jsx';
import { GalleryFeed } from '../components/courtroom/GalleryFeed.jsx';
import { ArgumentBar } from '../components/courtroom/ArgumentBar.jsx';
import { JudgeControls } from '../components/courtroom/JudgeControls.jsx';
import { socketService } from '../services/socketClient.js';
import { soundEffects } from '../services/soundEffects.js';
import { RulebookReaderModal } from '../components/shared/RulebookReaderModal.jsx';
import { CourtroomScene } from '../components/3d/CourtroomScene.jsx';

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
  const [judgeEmotion, setJudgeEmotion] = useState("NEUTRAL");
  const [screenShake, setScreenShake] = useState(false);
  const [scoreToast, setScoreToast] = useState(null);
  const [showRulebookModal, setShowRulebookModal] = useState(false);
  const [viewMode, setViewMode] = useState("3d");
  const [galleryFeed, setGalleryFeed] = useState([
    { id: "g1", user: "Rohan_NLU", text: "Bench strictly rules pe chal rahi hai aaj 🔥" },
    { id: "g2", user: "Pooja_Law", text: "Dekhte hain citation kitni solid aati hai! ⚖️" }
  ]);

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

    // 5f. AI Judge Turn Reaction (Hinglish Judge + Crowd Reactions + Badges)
    socket.on("turn:reaction", ({ reaction, speaker, side }) => {
      if (!reaction) return;

      // 1. Update Judge speech line
      if (reaction.judge_line) {
        setJudgeSpeech(reaction.judge_line);
      }

      // 2. Play Sound Effect
      if (reaction.effects?.sound) {
        soundEffects.playReactionSound(reaction.effects.sound);
      }

      // 3. Trigger Screen Shake
      if (reaction.effects?.screen_shake) {
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 500);
      }

      // 4. Update Judge Emotion
      if (reaction.effects?.judge_emotion) {
        setJudgeEmotion(reaction.effects.judge_emotion);
      }

      // 5. Update Audience Gallery Chatter
      if (Array.isArray(reaction.gallery) && reaction.gallery.length > 0) {
        setGalleryFeed((prev) => {
          const newEntries = reaction.gallery.map((g, idx) => ({
            id: `g_${Date.now()}_${idx}`,
            user: g.user || "spectator",
            text: g.text || ""
          }));
          return [...prev, ...newEntries].slice(-15);
        });
      }

      // 6. Floating Score & Badge Toast
      if (reaction.score_reason || (reaction.effects?.badge && reaction.effects.badge !== "NONE")) {
        setScoreToast({
          reason: reaction.score_reason || "Oral submission evaluated",
          badge: reaction.effects?.badge || "NONE",
          delta: reaction.score_delta || null,
          status: reaction.article_check?.status || "NONE"
        });
        setTimeout(() => {
          setScoreToast(null);
        }, 5500);
      }

      // 7. Check if verdict triggered
      if (reaction.ruling === "VERDICT" && reaction.verdict) {
        soundEffects.playVerdictFanfare();
        setTimeout(() => {
          onViewVerdict(reaction.verdict);
        }, 2000);
      }
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
      socket.off("turn:reaction");
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
      className={screenShake ? "screen-shake" : ""}
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "16px 24px",
        width: "100%",
        position: "relative"
      }}
    >
      {/* Floating Badges & Turn Reaction Toast */}
      {scoreToast && (
        <div
          className="animate-pop-badge"
          style={{
            position: "fixed",
            top: "84px",
            right: "24px",
            zIndex: 9999,
            backgroundColor:
              scoreToast.badge === "BLUFF_CAUGHT"
                ? "rgba(255, 93, 115, 0.95)"
                : scoreToast.badge === "ARTICLE_MASTER"
                ? "rgba(61, 219, 176, 0.95)"
                : "rgba(42, 37, 102, 0.95)",
            border: `2px solid ${
              scoreToast.badge === "BLUFF_CAUGHT"
                ? "var(--accent-coral)"
                : scoreToast.badge === "ARTICLE_MASTER"
                ? "var(--accent-mint)"
                : "var(--accent-gold)"
            }`,
            borderRadius: "var(--radius-md)",
            padding: "12px 18px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            maxWidth: "360px"
          }}
        >
          <span style={{ fontSize: "1.8rem" }}>
            {scoreToast.badge === "BLUFF_CAUGHT"
              ? "🚨"
              : scoreToast.badge === "ARTICLE_MASTER"
              ? "🏆"
              : scoreToast.badge === "SMOOTH_TALKER"
              ? "🗣️"
              : "⚖️"}
          </span>
          <div>
            <div
              style={{
                fontWeight: "700",
                fontSize: "0.88rem",
                color:
                  scoreToast.badge === "BLUFF_CAUGHT"
                    ? "#FFFFFF"
                    : "var(--accent-gold)",
                letterSpacing: "0.4px"
              }}
            >
              {scoreToast.badge !== "NONE"
                ? scoreToast.badge.replace("_", " ")
                : "JUDICIAL ASSESSMENT"}
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-primary)", marginTop: "2px" }}>
              {scoreToast.reason}
            </div>
          </div>
        </div>
      )}

      {/* 1. Top Bar */}
      <TopBar
        caseTitle={roomState.caseData.caseTitle}
        phase={roomState.phase}
        turnIndex={roomState.turnIndex}
        activeTurnSide={roomState.activeTurnSide}
        secondsRemaining={roomState.turnSecondsRemaining}
        viewMode={viewMode}
        onToggleView={() => setViewMode((v) => (v === "3d" ? "2d" : "3d"))}
        onOpenRulebook={() => setShowRulebookModal(true)}
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

      {/* 2. Courtroom View: 3D Scene View vs 2D Split Cards */}
      {viewMode === "3d" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}>
          {/* 3D WebGL Courtroom Canvas */}
          <div
            style={{
              position: "relative",
              borderRadius: "18px",
              overflow: "hidden",
              aspectRatio: "16/9",
              minHeight: "360px",
              background: "#1a1230",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
              width: "100%"
            }}
          >
            <CourtroomScene
              judgePersona={roomState.judgePersona}
              judgeState={roomState.activeTurnSide === "judge" ? "talking" : "idle"}
              petitionerName={roomState.participants.petitioner.name}
              petitionerState={roomState.activeTurnSide === "petitioner" ? "talking" : "idle"}
              respondentName={roomState.participants.respondent.name}
              respondentState={roomState.activeTurnSide === "respondent" ? "talking" : "idle"}
              respondentGhosted={!roomState.participants.respondent.connected}
              gavelStriking={Boolean(activeObjectionRuling)}
            />

            {/* In-canvas Judge Statement Floating Subtitle */}
            <div
              style={{
                position: "absolute",
                left: "3%",
                right: "3%",
                bottom: "4%",
                background: "rgba(20, 17, 46, 0.88)",
                borderRadius: "14px",
                padding: "8px 14px",
                fontSize: "clamp(0.78rem, 2vw, 0.95rem)",
                lineHeight: "1.3",
                color: "#f3eefc",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                zIndex: 15,
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)"
              }}
            >
              <strong style={{ color: "var(--accent-gold)", marginRight: "6px" }}>
                Presiding Bench ({roomState.judgePersona}):
              </strong>
              <span>{judgeSpeech}</span>
            </div>
          </div>

          {/* Under-canvas Live Transcript & Audience Feed */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "14px"
            }}
          >
            {/* Live Transcript */}
            <div
              style={{
                backgroundColor: "var(--card-bg)",
                borderRadius: "var(--radius-md)",
                padding: "14px 18px",
                maxHeight: "160px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "8px"
              }}
            >
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                📜 Judicial Record ({roomState.caseData.transcript.length} items)
              </span>
              {roomState.caseData.transcript.slice(-4).map((item) => (
                <div key={item.id} style={{ fontSize: "0.82rem", lineHeight: "1.3" }}>
                  <strong style={{ color: item.side === "petitioner" ? "var(--accent-coral)" : item.side === "respondent" ? "var(--accent-mint)" : "var(--accent-gold)" }}>
                    {item.speaker}:
                  </strong>{" "}
                  <span style={{ color: "var(--text-primary)" }}>{item.text}</span>
                </div>
              ))}
            </div>

            {/* Gallery Chatter Feed */}
            <GalleryFeed reactions={galleryFeed} />
          </div>
        </div>
      ) : (
        /* 2D 3-Column Split View */
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

          {/* Center Column: Presiding Bench & Live Gallery Chatter */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
            <Bench
              judgePersona={roomState.judgePersona}
              judgeMode={roomState.judgeMode}
              judgeName={roomState.participants.judge?.name || "Hon'ble Judge"}
              isHumanJudge={roomState.participants.judge?.isHuman || judgeMode === "human"}
              judgeStatement={judgeSpeech}
              judgeEmotion={judgeEmotion}
              articlesInPlay={roomState.caseData.articlesInPlay}
              transcript={roomState.caseData.transcript}
            />
            <GalleryFeed reactions={galleryFeed} />
          </div>

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
      )}

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
          onOpenRulebook={() => setShowRulebookModal(true)}
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

      {/* Live In-Court Rulebook Reader & Clause Search */}
      {showRulebookModal && (
        <RulebookReaderModal
          rulebookId={roomState.constitutionId || constitutionId}
          onClose={() => setShowRulebookModal(false)}
          onSelectArticle={(art) => {
            handleCiteArticle(art.number);
            setShowRulebookModal(false);
          }}
        />
      )}
    </div>
  );
}
