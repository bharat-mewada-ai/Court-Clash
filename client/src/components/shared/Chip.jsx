import React from 'react';

export function Chip({
  children,
  variant = "default", // default, gold, coral, mint
  icon = null,
  onClick = null,
  className = "",
  style = {}
}) {
  const getColors = () => {
    switch (variant) {
      case "gold":
        return {
          bg: "rgba(255, 197, 61, 0.15)",
          border: "1px solid var(--accent-gold)",
          text: "var(--accent-gold)"
        };
      case "coral":
        return {
          bg: "rgba(255, 93, 115, 0.15)",
          border: "1px solid var(--accent-coral)",
          text: "var(--accent-coral)"
        };
      case "mint":
        return {
          bg: "rgba(61, 219, 176, 0.15)",
          border: "1px solid var(--accent-mint)",
          text: "var(--accent-mint)"
        };
      default:
        return {
          bg: "var(--chip-track)",
          border: "1px solid var(--chip-track-light)",
          text: "var(--text-muted)"
        };
    }
  };

  const colors = getColors();

  return (
    <div
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 12px",
        borderRadius: "var(--radius-lg)",
        background: colors.bg,
        border: colors.border,
        color: colors.text,
        fontSize: "0.85rem",
        fontWeight: "600",
        cursor: onClick ? "pointer" : "default",
        userSelect: "none",
        ...style
      }}
      className={`custom-chip ${className}`}
    >
      {icon}
      <span>{children}</span>
    </div>
  );
}

export function ProgressBar({ value = 80, max = 100, accent = "coral", label = "Credibility" }) {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);
  const color = accent === "coral" ? "var(--accent-coral)" : "var(--accent-mint)";

  return (
    <div style={{ width: "100%", marginTop: "6px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>
        <span>{label}</span>
        <span style={{ fontWeight: "700", color }}>{percentage}%</span>
      </div>
      <div
        style={{
          width: "100%",
          height: "8px",
          backgroundColor: "var(--chip-track)",
          borderRadius: "var(--radius-sm)",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: "100%",
            backgroundColor: color,
            borderRadius: "var(--radius-sm)",
            transition: "width 0.4s ease-out"
          }}
        />
      </div>
    </div>
  );
}
