import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { GavelIcon, ScaleIcon, CheckIcon, BookIcon, CopyIcon } from '../components/shared/Icons.jsx';
import { Button } from '../components/shared/Button.jsx';
import { Chip } from '../components/shared/Chip.jsx';
import { soundEffects } from '../services/soundEffects.js';

export function VerdictScreen({ verdict, onReturnLobby, transcript = [] }) {
  const [gavelStruck, setGavelStruck] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Dramatic gavel strike animation sequence
    const timer = setTimeout(() => {
      setGavelStruck(true);
      soundEffects.playGavelStrike();
      setTimeout(() => soundEffects.playVerdictFanfare(), 300);
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#FFC53D', '#FF5D73', '#3DDBB0', '#FFFFFF']
        });
      } catch (e) {
        // Confetti fallback if canvas not available
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  const handlePrintPDF = () => {
    window.print();
  };

  const handleExportTranscript = () => {
    const textData = [
      `=== COURT CLASH: OFFICIAL JUDICIAL VERDICT ===`,
      `Case: ${verdict.case_title || "Court Clash Dispute"}`,
      `Judge Persona: ${verdict.judge_persona || "Strict"}`,
      `Verdict: ${verdict.verdict}`,
      `Relief: ${verdict.relief}`,
      `\n--- ISSUES FRAMED ---`,
      ...(verdict.issues || []).map((iss, i) => `${i + 1}. ${iss}`),
      `\n--- APPLICABLE CONSTITUTIONAL ARTICLES ---`,
      ...(verdict.applicable_articles || []).map(
        (art) => `• ${art.article}: "${art.quote}"\n  Why it applies: ${art.why_it_applies}`
      ),
      `\n--- JUDICIAL REASONING ---`,
      verdict.reasoning,
      `\n--- TRANSCRIPT LOGS (${transcript.length} events) ---`,
      ...transcript.map(
        (t) => `[${t.timestamp?.slice(11, 19) || ""}] ${t.speaker} (${t.side}): ${t.text}`
      ),
      `\n${verdict.disclaimer || "This is an educational simulation, not legal advice."}`
    ].join("\n");

    const blob = new Blob([textData], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `verdict_${(verdict.case_title || "case").replace(/\s+/g, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = () => {
    const summary = `⚖️ COURT CLASH VERDICT: ${verdict.case_title}\nRuling: ${verdict.verdict}\nRelief: ${verdict.relief}\nReasoning: ${verdict.reasoning.slice(0, 180)}...\n(Educational simulation only)`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        maxWidth: "880px",
        margin: "0 auto",
        padding: "36px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "24px"
      }}
      className="animate-slide-up"
    >
      {/* 1. Dramatic Gavel Animation & Announcement */}
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            backgroundColor: "var(--accent-gold)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "var(--shadow-glow-gold)",
            animation: !gavelStruck ? "gavelStrike 1.2s ease-in-out" : "pulseGlow 3s infinite"
          }}
        >
          <GavelIcon size={44} color="var(--text-on-accent)" />
        </div>

        <h1 style={{ fontSize: "2.2rem", fontWeight: "700", color: "var(--text-primary)" }}>
          JUDGEMENT DELIVERED
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
          The Court has rendered its final decree grounded strictly in constitutional law.
        </p>
      </div>

      {/* 2. Primary Verdict Card */}
      <div
        style={{
          backgroundColor: "var(--card-bg)",
          borderRadius: "var(--radius-lg)",
          padding: "30px",
          boxShadow: "var(--shadow-md)",
          border: "2px solid var(--accent-gold)",
          display: "flex",
          flexDirection: "column",
          gap: "20px"
        }}
      >
        {/* Header: Title, Persona & Verdict Badge */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--accent-gold)", fontWeight: "700", letterSpacing: "1px" }}>
              FINAL RULING
            </span>
            <h2 style={{ fontSize: "1.4rem", fontWeight: "700", color: "var(--text-primary)", marginTop: "4px" }}>
              {verdict.case_title || "Court Clash Dispute"}
            </h2>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Chip variant="gold">
              Judge Persona: {verdict.judge_persona || "Strict"}
            </Chip>
          </div>
        </div>

        {/* Verdict & Relief Callout */}
        <div
          style={{
            backgroundColor: "rgba(255, 197, 61, 0.12)",
            borderLeft: "5px solid var(--accent-gold)",
            padding: "16px 20px",
            borderRadius: "var(--radius-sm)"
          }}
        >
          <div style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--accent-gold)", marginBottom: "6px" }}>
            {verdict.verdict}
          </div>
          <div style={{ fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: "1.5" }}>
            <strong>Relief Ordered:</strong> {verdict.relief}
          </div>
        </div>

        {/* Issues Framed */}
        {verdict.issues && verdict.issues.length > 0 && (
          <div>
            <h3 style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-muted)", marginBottom: "8px" }}>
              ISSUES FRAMED FOR DETERMINATION:
            </h3>
            <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "4px" }}>
              {verdict.issues.map((iss, i) => (
                <li key={i} style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>
                  {iss}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Applicable Articles (Grounded Citations) */}
        {verdict.applicable_articles && verdict.applicable_articles.length > 0 && (
          <div>
            <h3 style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--accent-mint)", marginBottom: "8px" }}>
              GROUNDED CONSTITUTIONAL ARTICLES CITED:
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {verdict.applicable_articles.map((art, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: "var(--chip-track)",
                    borderRadius: "var(--radius-md)",
                    padding: "12px 16px",
                    border: "1px solid rgba(61, 219, 176, 0.3)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700", color: "var(--accent-mint)" }}>
                    <BookIcon size={16} color="var(--accent-mint)" />
                    {art.article}
                  </div>
                  <p style={{ fontSize: "0.85rem", fontStyle: "italic", color: "var(--text-muted)", margin: "6px 0" }}>
                    "{art.quote}"
                  </p>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>
                    <strong>Why it applies:</strong> {art.why_it_applies}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Judicial Reasoning */}
        <div>
          <h3 style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-muted)", marginBottom: "8px" }}>
            JUDICIAL REASONING & SYNTHESIS:
          </h3>
          <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: "1.6", whiteSpace: "pre-line" }}>
            {verdict.reasoning}
          </p>
        </div>

        {/* Credibility Scores */}
        {verdict.credibility_scores && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              padding: "14px",
              backgroundColor: "var(--chip-track)",
              borderRadius: "var(--radius-md)",
              textAlign: "center"
            }}
          >
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--accent-coral)", fontWeight: "700" }}>PETITIONER CREDIBILITY</span>
              <div style={{ fontSize: "1.4rem", fontWeight: "700", color: "var(--text-primary)" }}>
                {verdict.credibility_scores.petitioner}%
              </div>
            </div>
            <div style={{ width: "1px", backgroundColor: "var(--chip-track-light)" }} />
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--accent-mint)", fontWeight: "700" }}>RESPONDENT CREDIBILITY</span>
              <div style={{ fontSize: "1.4rem", fontWeight: "700", color: "var(--text-primary)" }}>
                {verdict.credibility_scores.respondent}%
              </div>
            </div>
          </div>
        )}

        {/* Mandatory Disclaimer Box */}
        <div
          style={{
            backgroundColor: "rgba(255, 93, 115, 0.1)",
            border: "1px solid rgba(255, 93, 115, 0.3)",
            borderRadius: "var(--radius-sm)",
            padding: "12px",
            textAlign: "center",
            fontSize: "0.85rem",
            color: "var(--text-muted)"
          }}
        >
          <strong>DISCLAIMER:</strong> {verdict.disclaimer || "This is an educational simulation, not legal advice."}
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "10px" }} className="no-print">
          <Button
            variant="primary"
            onClick={handlePrintPDF}
            icon={<BookIcon size={18} color="var(--text-on-accent)" />}
            style={{ flex: 1, minWidth: "160px" }}
          >
            Print / Save as PDF
          </Button>

          <Button
            variant="mint"
            onClick={handleExportTranscript}
            icon={<BookIcon size={18} color="var(--text-on-accent)" />}
            style={{ flex: 1, minWidth: "160px" }}
          >
            Export Transcript (.txt)
          </Button>

          <Button
            variant="subtle"
            onClick={handleCopySummary}
            icon={copied ? <CheckIcon size={18} color="var(--accent-mint)" /> : <CopyIcon size={18} />}
            style={{ flex: 1, minWidth: "160px" }}
          >
            {copied ? "Summary Copied!" : "Share Summary"}
          </Button>

          <Button
            variant="outline"
            onClick={onReturnLobby}
            icon={<ScaleIcon size={18} />}
            style={{ flex: 1, minWidth: "160px" }}
          >
            Back to Court Lobby
          </Button>
        </div>
      </div>
    </div>
  );
}
