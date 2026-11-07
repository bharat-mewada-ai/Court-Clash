import React from 'react';
import { TimerIcon } from './Icons.jsx';

export function Timer({ secondsRemaining = 60 }) {
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const isUrgent = secondsRemaining <= 15;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 14px",
        borderRadius: "var(--radius-lg)",
        backgroundColor: isUrgent ? "rgba(255, 93, 115, 0.2)" : "var(--chip-track)",
        border: `1.5px solid ${isUrgent ? "var(--accent-coral)" : "var(--accent-gold)"}`,
        color: isUrgent ? "var(--accent-coral)" : "var(--accent-gold)",
        fontWeight: "700",
        fontSize: "1rem",
        boxShadow: isUrgent ? "var(--shadow-glow-coral)" : "none",
        transition: "all 0.3s ease"
      }}
      className={isUrgent ? "animate-pulse-glow" : ""}
    >
      <TimerIcon size={18} color={isUrgent ? "var(--accent-coral)" : "var(--accent-gold)"} />
      <span>{formatted}</span>
    </div>
  );
}
