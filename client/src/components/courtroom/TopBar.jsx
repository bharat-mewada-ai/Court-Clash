import React, { useState } from 'react';
import { ScaleIcon, VolumeIcon, MuteIcon } from '../shared/Icons.jsx';
import { Chip } from '../shared/Chip.jsx';
import { Timer } from '../shared/Timer.jsx';
import { soundEffects } from '../../services/soundEffects.js';

export function TopBar({
  caseTitle = "Sharma v. State University",
  phase = "ROUND_1_OPENING",
  turnIndex = 1,
  activeTurnSide = "petitioner",
  secondsRemaining = 60,
  onLeave = null
}) {
  const [isMuted, setIsMuted] = useState(soundEffects.isMuted());

  const handleToggleSound = () => {
    const muted = soundEffects.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      soundEffects.playTurnDing();
    }
  };
  const getPhaseLabel = () => {
    switch (phase) {
      case "LOBBY":
        return "Court Lobby";
      case "FILING":
        return "Filing Phase";
      case "ROUND_1_OPENING":
        return "Round 1: Opening Arguments";
      case "ROUND_2_REBUTTAL":
        return "Round 2: Rebuttal";
      case "ROUND_3_CLOSING":
        return "Round 3: Closing Arguments";
      case "DELIBERATION":
        return "Judge Deliberation";
      case "VERDICT_REVEALED":
        return "Verdict Delivered";
      default:
        return phase;
    }
  };

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 24px",
        backgroundColor: "var(--card-bg)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
        marginBottom: "16px",
        gap: "16px",
        flexWrap: "wrap"
      }}
    >
      {/* Brand & Case Info */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "40px",
            height: "40px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--chip-track)",
            color: "var(--accent-gold)"
          }}
        >
          <ScaleIcon size={24} color="var(--accent-gold)" />
        </div>
        <div>
          <h1 style={{ fontSize: "1.2rem", fontWeight: "700", letterSpacing: "0.5px" }}>
            COURT CLASH
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", maxWidth: "340px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {caseTitle}
          </p>
        </div>
      </div>

      {/* Round & Active Floor Indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Chip variant="gold">
          {getPhaseLabel()}
        </Chip>

        {activeTurnSide && phase.startsWith("ROUND") && (
          <Chip variant={activeTurnSide === "petitioner" ? "coral" : "mint"}>
            Floor: {activeTurnSide.toUpperCase()}
          </Chip>
        )}
      </div>

      {/* Timer & Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Timer secondsRemaining={secondsRemaining} />
        
        {/* Audio Mute/Unmute Toggle */}
        <button
          onClick={handleToggleSound}
          title={isMuted ? "Unmute Courtroom Audio" : "Mute Courtroom Audio"}
          style={{
            background: "var(--chip-track)",
            border: "1px solid var(--chip-track-light)",
            color: isMuted ? "var(--text-muted)" : "var(--accent-gold)",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          {isMuted ? <MuteIcon size={18} /> : <VolumeIcon size={18} />}
        </button>

        {onLeave && (
          <button
            onClick={onLeave}
            style={{
              background: "transparent",
              border: "1px solid var(--chip-track-light)",
              color: "var(--text-muted)",
              padding: "6px 12px",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.8rem",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Leave
          </button>
        )}
      </div>
    </header>
  );
}
