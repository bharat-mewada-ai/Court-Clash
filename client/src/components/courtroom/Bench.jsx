import React, { useRef, useEffect } from 'react';
import { GavelIcon, BookIcon } from '../shared/Icons.jsx';
import { Chip } from '../shared/Chip.jsx';

export function Bench({
  judgePersona = "Strict",
  judgeMode = "ai",
  judgeName = "Hon'ble Judge",
  isHumanJudge = false,
  judgeStatement = "Court is in session. Submissions must adhere strictly to the chosen constitutional rulebook.",
  articlesInPlay = [],
  transcript = []
}) {
  const transcriptEndRef = useRef(null);

  // Auto-scroll transcript to newest entry
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript]);

  return (
    <main
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        height: "100%",
        minWidth: 0
      }}
    >
      {/* Upper Bench: Judge Avatar & Speech Bubble */}
      <div
        style={{
          backgroundColor: "var(--card-bg)",
          borderRadius: "var(--radius-lg)",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          border: "2px solid rgba(255, 197, 61, 0.4)",
          boxShadow: "var(--shadow-glow-gold)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "var(--accent-gold)",
                color: "var(--text-on-accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700"
              }}
            >
              <GavelIcon size={26} color="var(--text-on-accent)" />
            </div>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-primary)" }}>
                PRESIDING BENCH
              </h2>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {isHumanJudge ? `🧑‍⚖️ Human Magistrate (${judgeName})` : "AI Judicial Magistrate"}
              </span>
            </div>
          </div>

          <Chip variant="gold">
            {isHumanJudge ? "Human Judge" : `Persona: ${judgePersona}`}
          </Chip>
        </div>

        {/* Judge Speech Bubble */}
        <div
          style={{
            backgroundColor: "rgba(255, 197, 61, 0.1)",
            border: "1px solid rgba(255, 197, 61, 0.3)",
            borderRadius: "var(--radius-md)",
            padding: "14px 18px",
            color: "var(--text-primary)",
            fontSize: "0.95rem",
            lineHeight: "1.5",
            position: "relative"
          }}
        >
          <span style={{ fontWeight: "700", color: "var(--accent-gold)", marginRight: "6px" }}>
            Judge:
          </span>
          {judgeStatement}
        </div>

        {/* Articles In Play Chips */}
        <div>
          <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
            ARTICLES IN PLAY:
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {articlesInPlay.length > 0 ? (
              articlesInPlay.map((item, idx) => (
                <Chip key={idx} variant="mint" icon={<BookIcon size={14} color="var(--accent-mint)" />}>
                  {item.articleNumber}: {item.title || item.articleNumber}
                </Chip>
              ))
            ) : (
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                No Articles formally cited yet. Parties may cite via ArgumentBar.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Lower Bench: Live Court Transcript Card */}
      <div
        style={{
          flex: 1,
          backgroundColor: "var(--card-bg)",
          borderRadius: "var(--radius-lg)",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          boxShadow: "var(--shadow-sm)",
          minHeight: "220px",
          maxHeight: "340px",
          overflow: "hidden"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid var(--chip-track)", paddingBottom: "8px" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-primary)", letterSpacing: "0.5px" }}>
            LIVE COURT TRANSCRIPT
          </h3>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {transcript.length} recorded entries
          </span>
        </div>

        {/* Scrollable Transcript List */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            paddingRight: "6px"
          }}
        >
          {transcript.length > 0 ? (
            transcript.map((item) => {
              const isPetitioner = item.side === "petitioner";
              const isRespondent = item.side === "respondent";
              const isJudge = item.side === "judge";

              const badgeColor = isPetitioner
                ? "var(--accent-coral)"
                : isRespondent
                ? "var(--accent-mint)"
                : isJudge
                ? "var(--accent-gold)"
                : "var(--text-muted)";

              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: "var(--chip-track)",
                    borderRadius: "var(--radius-sm)",
                    padding: "8px 12px",
                    fontSize: "0.88rem",
                    lineHeight: "1.4"
                  }}
                  className="animate-slide-up"
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                    <span style={{ fontWeight: "700", color: badgeColor, fontSize: "0.8rem" }}>
                      {item.speaker}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ""}
                    </span>
                  </div>
                  <p style={{ color: "var(--text-primary)" }}>
                    {item.text}
                  </p>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: "center", color: "var(--text-muted)", margin: "auto", fontSize: "0.85rem" }}>
              Court transcript will record oral arguments, rulings, and objections as they occur.
            </div>
          )}
          <div ref={transcriptEndRef} />
        </div>
      </div>
    </main>
  );
}
