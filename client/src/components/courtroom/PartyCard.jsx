import React from 'react';
import { UserIcon } from '../shared/Icons.jsx';
import { ProgressBar } from '../shared/Chip.jsx';

export function PartyCard({
  side = "petitioner", // 'petitioner' or 'respondent'
  name = "Petitioner",
  credibility = 85,
  isActiveTurn = false,
  latestArgument = "",
  connected = true
}) {
  const isPetitioner = side === "petitioner";
  const accentColor = isPetitioner ? "var(--accent-coral)" : "var(--accent-mint)";
  const glowShadow = isPetitioner ? "var(--shadow-glow-coral)" : "var(--shadow-glow-mint)";
  const roleTitle = isPetitioner ? "PETITIONER" : "RESPONDENT";

  return (
    <aside
      style={{
        width: "100%",
        backgroundColor: "var(--card-bg)",
        borderRadius: "var(--radius-lg)",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        border: isActiveTurn ? `2px solid ${accentColor}` : "2px solid transparent",
        boxShadow: isActiveTurn ? glowShadow : "var(--shadow-sm)",
        transition: "all 0.3s ease",
        height: "100%"
      }}
    >
      {/* Header: Role Badge & Connection Dot */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: "700",
            letterSpacing: "1px",
            color: accentColor,
            textTransform: "uppercase"
          }}
        >
          {roleTitle}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: connected ? "#3DDBB0" : "#FF5D73"
            }}
          />
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {connected ? "Connected" : "Offline"}
          </span>
        </div>
      </div>

      {/* Avatar & Name */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: "var(--chip-track)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `2px solid ${accentColor}`,
            color: accentColor,
            flexShrink: 0
          }}
        >
          <UserIcon size={30} color={accentColor} />
        </div>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-primary)" }}>
            {name}
          </h2>
          {isActiveTurn && (
            <span
              style={{
                fontSize: "0.75rem",
                color: accentColor,
                fontWeight: "600"
              }}
            >
              Speaking Now...
            </span>
          )}
        </div>
      </div>

      {/* Credibility Bar */}
      <ProgressBar
        value={credibility}
        max={100}
        accent={isPetitioner ? "coral" : "mint"}
        label="Credibility Score"
      />

      {/* Latest Argument Bubble */}
      <div
        style={{
          marginTop: "auto",
          backgroundColor: "var(--chip-track)",
          borderRadius: "var(--radius-md)",
          padding: "14px",
          position: "relative",
          minHeight: "130px",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-muted)", marginBottom: "6px" }}>
          LATEST SUBMISSION:
        </span>
        <p
          style={{
            fontSize: "0.9rem",
            color: "var(--text-primary)",
            lineHeight: "1.4",
            fontStyle: latestArgument ? "normal" : "italic",
            overflowY: "auto",
            maxHeight: "120px"
          }}
        >
          {latestArgument ? `"${latestArgument}"` : "Awaiting oral arguments for the upcoming turn..."}
        </p>
      </div>
    </aside>
  );
}
