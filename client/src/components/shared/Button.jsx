import React from 'react';

export function Button({
  children,
  onClick,
  variant = "primary", // primary (gold), coral (objection), mint (cite), outline, subtle
  size = "md",
  disabled = false,
  type = "button",
  icon = null,
  className = "",
  style = {}
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return {
          background: "var(--accent-gold)",
          color: "var(--text-on-accent)",
          boxShadow: disabled ? "none" : "var(--shadow-glow-gold)"
        };
      case "coral":
        return {
          background: "var(--accent-coral)",
          color: "var(--text-on-accent)",
          boxShadow: disabled ? "none" : "var(--shadow-glow-coral)"
        };
      case "mint":
        return {
          background: "var(--accent-mint)",
          color: "var(--text-on-accent)",
          boxShadow: disabled ? "none" : "var(--shadow-glow-mint)"
        };
      case "outline":
        return {
          background: "transparent",
          color: "var(--text-primary)",
          border: "2px solid var(--chip-track-light)"
        };
      case "subtle":
        return {
          background: "var(--chip-track)",
          color: "var(--text-primary)"
        };
      default:
        return {
          background: "var(--accent-gold)",
          color: "var(--text-on-accent)"
        };
    }
  };

  const baseStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    minHeight: "var(--touch-target)",
    padding: size === "sm" ? "6px 14px" : size === "lg" ? "14px 28px" : "10px 20px",
    borderRadius: "var(--radius-md)",
    fontSize: size === "sm" ? "0.9rem" : size === "lg" ? "1.15rem" : "1rem",
    fontWeight: "600",
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "all 0.15s ease-in-out",
    textDecoration: "none",
    ...getVariantStyles(),
    ...style
  };

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={baseStyle}
      className={`custom-button ${className}`}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
