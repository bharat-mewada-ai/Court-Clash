import React, { useState, useEffect } from 'react';
import { GavelIcon, ScaleIcon, BookIcon } from '../shared/Icons.jsx';
import { Button } from '../shared/Button.jsx';
import { Chip } from '../shared/Chip.jsx';

export function JudgeControls({
  roomId,
  judgeName = "Hon'ble Judge",
  phase = "ROUND_1_OPENING",
  pendingObjection = null,
  onStrikeGavel,
  onSubmitQuestion,
  onRuleObjection,
  onSubmitVerdict,
  onRequestLegalAid,
  legalAidArticles = []
}) {
  const [questionText, setQuestionText] = useState("");
  const [verdictWinner, setVerdictWinner] = useState("In favor of Petitioner");
  const [verdictRelief, setVerdictRelief] = useState("Immediate injunctive relief and academic reinstatement granted.");
  const [verdictReasoning, setVerdictReasoning] = useState(
    "Having examined the submissions of both learned counsel under constitutional standards, this Court finds that the impugned action offends basic procedural fairness and natural justice."
  );
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [isConsultingAI, setIsConsultingAI] = useState(false);

  // Gavel Strike Action
  const handleGavelClick = () => {
    if (onStrikeGavel) onStrikeGavel();
  };

  // Submit Question Action
  const handleQuestionSubmit = (e) => {
    e.preventDefault();
    if (!questionText.trim()) return;
    if (onSubmitQuestion) onSubmitQuestion(questionText.trim());
    setQuestionText("");
  };

  // Consult AI Legal Advisor
  const handleLegalAid = () => {
    setIsConsultingAI(true);
    if (onRequestLegalAid) onRequestLegalAid();
    setTimeout(() => setIsConsultingAI(false), 2000);
  };

  // Deliver Final Judgement
  const handleDeliverVerdict = () => {
    if (onSubmitVerdict) {
      onSubmitVerdict({
        verdict: verdictWinner,
        relief: verdictRelief,
        reasoning: verdictReasoning,
        applicableArticles: selectedArticles.length > 0 ? selectedArticles : [
          {
            article: "Presiding Bench Ruling",
            quote: "Constitutional principles of fair hearing and proportionate administrative action.",
            why_it_applies: "Foundational natural justice precedent"
          }
        ]
      });
    }
  };

  const isDeliberation = phase === "DELIBERATION";

  return (
    <div
      style={{
        backgroundColor: "var(--card-bg)",
        borderRadius: "var(--radius-lg)",
        padding: "18px 24px",
        marginTop: "16px",
        border: "2px solid var(--accent-gold)",
        boxShadow: "var(--shadow-glow-gold)",
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }}
      className="animate-slide-up"
    >
      {/* 1. Judge Status Header & Instant Gavel Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "var(--accent-gold)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <GavelIcon size={20} color="var(--text-on-accent)" />
          </div>
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "var(--accent-gold)" }}>
              Presiding Magistrate Controls ({judgeName})
            </h3>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              You hold the judicial authority for this courtroom.
            </span>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleGavelClick}
          icon={<GavelIcon size={16} color="var(--text-on-accent)" />}
          style={{ fontWeight: "700" }}
        >
          🔨 Bang Gavel (Order in Court!)
        </Button>
      </div>

      {/* 2. Pending Objection Alert (When Counsel Objects) */}
      {pendingObjection && (
        <div
          style={{
            backgroundColor: "rgba(255, 93, 115, 0.15)",
            border: "2px solid var(--accent-coral)",
            borderRadius: "var(--radius-md)",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            boxShadow: "var(--shadow-glow-coral)"
          }}
          className="animate-slide-up"
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontWeight: "700", color: "var(--accent-coral)", fontSize: "1rem" }}>
              🚨 OBJECTION PENDING YOUR RULING!
            </span>
            <Chip variant="coral">
              Raised by {pendingObjection.objectingSide?.toUpperCase()}
            </Chip>
          </div>

          <p style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>
            <strong>Legal Ground:</strong> {pendingObjection.reason}
          </p>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>
            Challenged statement: "{pendingObjection.targetArgument}"
          </p>

          <div style={{ display: "flex", gap: "12px", marginTop: "6px" }}>
            <Button
              variant="mint"
              size="sm"
              onClick={() => onRuleObjection && onRuleObjection("SUSTAINED", "Objection sustained. Improper submission is struck from the record.")}
              style={{ flex: 1, fontWeight: "700" }}
            >
              🟢 SUSTAIN (Strike Argument)
            </Button>
            <Button
              variant="coral"
              size="sm"
              onClick={() => onRuleObjection && onRuleObjection("OVERRULED", "Objection overruled. The submission is admissible.")}
              style={{ flex: 1, fontWeight: "700" }}
            >
              🔴 OVERRULE (Allow Counsel)
            </Button>
          </div>
        </div>
      )}

      {/* 3. Normal Trial Rounds: Interrogate Counsel Box */}
      {!isDeliberation ? (
        <form onSubmit={handleQuestionSubmit} style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Type a pointed judicial question to test counsel's arguments..."
            style={{
              flex: 1,
              minHeight: "44px",
              backgroundColor: "var(--chip-track)",
              border: "1.5px solid var(--chip-track-light)",
              borderRadius: "var(--radius-md)",
              padding: "0 16px",
              color: "var(--text-primary)",
              fontSize: "0.95rem",
              outline: "none"
            }}
          />
          <Button
            type="submit"
            variant="gold"
            size="md"
            icon={<ScaleIcon size={18} color="var(--text-on-accent)" />}
          >
            Ask Counsel
          </Button>
        </form>
      ) : (
        /* 4. Deliberation Phase: Full Judicial Verdict Drafting Suite */
        <div
          style={{
            backgroundColor: "rgba(255, 197, 61, 0.08)",
            border: "1px solid rgba(255, 197, 61, 0.3)",
            borderRadius: "var(--radius-md)",
            padding: "18px",
            display: "flex",
            flexDirection: "column",
            gap: "14px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <h4 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--accent-gold)" }}>
              ⚖️ Deliver Official Final Judgement
            </h4>
            <Button
              variant="subtle"
              size="sm"
              onClick={handleLegalAid}
              icon={<BookIcon size={16} />}
            >
              {isConsultingAI ? "Searching Articles..." : "🤖 Consult AI Constitutional Advisor"}
            </Button>
          </div>

          {/* AI Advisor Article Suggestions */}
          {legalAidArticles.length > 0 && (
            <div style={{ backgroundColor: "var(--chip-track)", padding: "12px", borderRadius: "var(--radius-sm)" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--accent-mint)", fontWeight: "700", display: "block", marginBottom: "6px" }}>
                Grounded Articles Found for this Case (Click to Cite):
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {legalAidArticles.map((art, idx) => {
                  const isCited = selectedArticles.some((a) => a.article === art.article_number);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (isCited) {
                          setSelectedArticles((prev) => prev.filter((a) => a.article !== art.article_number));
                        } else {
                          setSelectedArticles((prev) => [
                            ...prev,
                            {
                              article: art.article_number,
                              quote: art.text.slice(0, 140) + "...",
                              why_it_applies: art.title
                            }
                          ]);
                        }
                      }}
                      style={{
                        backgroundColor: isCited ? "var(--accent-mint)" : "rgba(61, 219, 176, 0.15)",
                        color: isCited ? "var(--text-on-accent)" : "var(--accent-mint)",
                        border: "1px solid var(--accent-mint)",
                        borderRadius: "var(--radius-sm)",
                        padding: "4px 10px",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        fontWeight: "600"
                      }}
                    >
                      {art.article_number} ({art.title}) {isCited ? "✓" : "+"}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Winner Selector */}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>
              Final Ruling:
            </label>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {[
                { label: "In favor of Petitioner", color: "var(--accent-coral)" },
                { label: "In favor of Respondent", color: "var(--accent-mint)" },
                { label: "Case Dismissed", color: "var(--accent-gold)" }
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setVerdictWinner(opt.label)}
                  style={{
                    flex: 1,
                    minHeight: "40px",
                    borderRadius: "var(--radius-md)",
                    border: verdictWinner === opt.label ? `2px solid ${opt.color}` : "1px solid var(--chip-track-light)",
                    backgroundColor: verdictWinner === opt.label ? "rgba(255, 255, 255, 0.1)" : "var(--chip-track)",
                    color: verdictWinner === opt.label ? opt.color : "var(--text-muted)",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Relief Granted */}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>
              Relief & Remedies Awarded:
            </label>
            <input
              type="text"
              value={verdictRelief}
              onChange={(e) => setVerdictRelief(e.target.value)}
              style={{
                width: "100%",
                minHeight: "40px",
                backgroundColor: "var(--chip-track)",
                border: "1px solid var(--chip-track-light)",
                borderRadius: "var(--radius-sm)",
                padding: "0 12px",
                color: "var(--text-primary)",
                fontSize: "0.9rem",
                outline: "none"
              }}
            />
          </div>

          {/* Judicial Reasoning */}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>
              Judicial Reasoning & Ratio Decidendi:
            </label>
            <textarea
              rows={3}
              value={verdictReasoning}
              onChange={(e) => setVerdictReasoning(e.target.value)}
              style={{
                width: "100%",
                backgroundColor: "var(--chip-track)",
                border: "1px solid var(--chip-track-light)",
                borderRadius: "var(--radius-sm)",
                padding: "10px 12px",
                color: "var(--text-primary)",
                fontSize: "0.9rem",
                resize: "vertical",
                outline: "none",
                lineHeight: "1.4"
              }}
            />
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleDeliverVerdict}
            icon={<ScaleIcon size={22} color="var(--text-on-accent)" />}
            style={{ width: "100%", fontWeight: "700", marginTop: "4px" }}
          >
            🔨 DELIVER OFFICIAL VERDICT TO COURT
          </Button>
        </div>
      )}
    </div>
  );
}
