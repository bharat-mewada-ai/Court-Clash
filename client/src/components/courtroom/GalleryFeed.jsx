import React, { useRef, useEffect } from 'react';

export function GalleryFeed({ reactions = [] }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [reactions]);

  if (!reactions || reactions.length === 0) return null;

  return (
    <div
      style={{
        backgroundColor: "rgba(34, 30, 84, 0.7)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "var(--radius-md)",
        padding: "10px 14px",
        marginTop: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        maxHeight: "130px",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.72rem",
          fontWeight: "700",
          letterSpacing: "0.5px",
          color: "var(--accent-mint)",
          textTransform: "uppercase"
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span>🏛️</span>
          <span>College Audience Gallery (Live)</span>
        </span>
        <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: "500" }}>
          {reactions.length} shouts
        </span>
      </div>

      <div
        ref={scrollRef}
        style={{
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          paddingRight: "4px"
        }}
      >
        {reactions.map((r, i) => (
          <div
            key={r.id || i}
            className="animate-slide-up"
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "8px",
              fontSize: "0.82rem",
              lineHeight: "1.3"
            }}
          >
            <span
              style={{
                color: "var(--accent-gold)",
                fontWeight: "700",
                fontSize: "0.76rem",
                flexShrink: 0
              }}
            >
              @{r.user || "spectator"}:
            </span>
            <span style={{ color: "var(--text-primary)" }}>{r.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
