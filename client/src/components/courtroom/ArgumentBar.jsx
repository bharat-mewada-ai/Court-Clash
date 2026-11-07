import React, { useState } from 'react';
import { Button } from '../shared/Button.jsx';
import { AlertIcon, BookIcon, SendIcon } from '../shared/Icons.jsx';

export function ArgumentBar({
  isMyTurn = true,
  currentSide = "petitioner",
  onSubmitArgument,
  onRaiseObjection,
  onCiteArticle
}) {
  const [argumentText, setArgumentText] = useState("");
  const [showCiteModal, setShowCiteModal] = useState(false);
  const [showObjectionModal, setShowObjectionModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState("Article 19");
  const [customArticle, setCustomArticle] = useState("");
  const [selectedGround, setSelectedGround] = useState("Speculation: Argument assumes facts not in evidence.");
  const [customGround, setCustomGround] = useState("");

  const quickArticles = [
    { num: "Article 14", title: "Equality before law" },
    { num: "Article 19", title: "Freedom of speech & expression" },
    { num: "Article 21", title: "Right to life & personal liberty" },
    { num: "Article 32", title: "Constitutional remedies / Writs" }
  ];

  const objectionGrounds = [
    { label: "Speculation", desc: "Argument assumes unproven facts not in evidence." },
    { label: "Relevance", desc: "Submission is outside the scope of the rulebook." },
    { label: "Hearsay", desc: "Statements based on second-hand unverified rumor." },
    { label: "Prejudicial", desc: "Inflammatory personal attacks irrelevant to the legal issue." }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!argumentText.trim()) return;
    onSubmitArgument(argumentText.trim());
    setArgumentText("");
  };

  const handleConfirmCite = () => {
    const artToCite = customArticle.trim() || selectedArticle;
    onCiteArticle(artToCite);
    setShowCiteModal(false);
    setCustomArticle("");
  };

  const handleConfirmObjection = () => {
    const finalReason = customGround.trim() || selectedGround;
    onRaiseObjection(finalReason);
    setShowObjectionModal(false);
    setCustomGround("");
  };

  return (
    <footer
      style={{
        backgroundColor: "var(--card-bg)",
        borderRadius: "var(--radius-lg)",
        padding: "16px 20px",
        boxShadow: "var(--shadow-md)",
        marginTop: "16px",
        position: "relative"
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          flexWrap: "wrap"
        }}
      >
        {/* Argument Text Input */}
        <input
          type="text"
          value={argumentText}
          onChange={(e) => setArgumentText(e.target.value)}
          placeholder={
            isMyTurn
              ? `Enter your oral submission as ${currentSide.toUpperCase()}...`
              : `Awaiting opponent's submission...`
          }
          disabled={!isMyTurn}
          style={{
            flex: 1,
            minWidth: "260px",
            minHeight: "var(--touch-target)",
            backgroundColor: "var(--chip-track)",
            border: "1.5px solid var(--chip-track-light)",
            borderRadius: "var(--radius-md)",
            padding: "0 18px",
            color: "var(--text-primary)",
            fontSize: "0.95rem",
            outline: "none",
            transition: "border-color 0.2s"
          }}
        />

        {/* Action Buttons: Objection! | Cite Article | Submit argument */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {/* 1. Objection! Button */}
          <Button
            type="button"
            variant="coral"
            onClick={() => {
              setShowObjectionModal(true);
              setShowCiteModal(false);
            }}
            icon={<AlertIcon size={18} color="var(--text-on-accent)" />}
          >
            Objection!
          </Button>

          {/* 2. Cite Article Button */}
          <Button
            type="button"
            variant="mint"
            onClick={() => {
              setShowCiteModal(true);
              setShowObjectionModal(false);
            }}
            icon={<BookIcon size={18} color="var(--text-on-accent)" />}
          >
            Cite Article
          </Button>

          {/* 3. Submit argument Button */}
          <Button
            type="submit"
            variant="primary"
            disabled={!isMyTurn || !argumentText.trim()}
            icon={<SendIcon size={18} color="var(--text-on-accent)" />}
          >
            Submit argument
          </Button>
        </div>
      </form>

      {/* Objection Grounds Modal */}
      {showObjectionModal && (
        <div
          style={{
            position: "absolute",
            bottom: "80px",
            left: "20px",
            width: "360px",
            backgroundColor: "var(--card-subtle)",
            border: "2px solid var(--accent-coral)",
            borderRadius: "var(--radius-lg)",
            padding: "16px",
            boxShadow: "var(--shadow-glow-coral)",
            zIndex: 100
          }}
          className="animate-slide-up"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h4 style={{ fontSize: "1rem", fontWeight: "700", color: "var(--accent-coral)", display: "flex", alignItems: "center", gap: "6px" }}>
              <AlertIcon size={18} color="var(--accent-coral)" />
              Raise In-Trial Objection
            </h4>
            <button
              onClick={() => setShowObjectionModal(false)}
              style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.1rem" }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
            {objectionGrounds.map((g) => (
              <label
                key={g.label}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  padding: "8px 10px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: selectedGround.startsWith(g.label) ? "rgba(255, 93, 115, 0.15)" : "var(--chip-track)",
                  border: selectedGround.startsWith(g.label) ? "1px solid var(--accent-coral)" : "1px solid transparent",
                  cursor: "pointer",
                  fontSize: "0.85rem"
                }}
              >
                <input
                  type="radio"
                  name="objectionGround"
                  checked={selectedGround.startsWith(g.label)}
                  onChange={() => {
                    setSelectedGround(`${g.label}: ${g.desc}`);
                    setCustomGround("");
                  }}
                  style={{ marginTop: "2px" }}
                />
                <div>
                  <div style={{ fontWeight: "700", color: "var(--text-primary)" }}>{g.label}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{g.desc}</div>
                </div>
              </label>
            ))}
          </div>

          <input
            type="text"
            value={customGround}
            onChange={(e) => setCustomGround(e.target.value)}
            placeholder="Or type specific legal grounds..."
            style={{
              width: "100%",
              height: "36px",
              backgroundColor: "var(--chip-track)",
              border: "1px solid var(--chip-track-light)",
              borderRadius: "var(--radius-sm)",
              padding: "0 10px",
              color: "var(--text-primary)",
              fontSize: "0.85rem",
              marginBottom: "12px"
            }}
          />

          <Button variant="coral" size="sm" onClick={handleConfirmObjection} style={{ width: "100%" }}>
            Lodge Formal Objection
          </Button>
        </div>
      )}

      {/* Quick Cite Article Modal */}
      {showCiteModal && (
        <div
          style={{
            position: "absolute",
            bottom: "80px",
            right: "20px",
            width: "320px",
            backgroundColor: "var(--card-subtle)",
            border: "2px solid var(--accent-mint)",
            borderRadius: "var(--radius-lg)",
            padding: "16px",
            boxShadow: "var(--shadow-md)",
            zIndex: 100
          }}
          className="animate-slide-up"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h4 style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--accent-mint)" }}>
              Cite Constitutional Provision
            </h4>
            <button
              onClick={() => setShowCiteModal(false)}
              style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.1rem" }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
            {quickArticles.map((art) => (
              <label
                key={art.num}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: selectedArticle === art.num ? "var(--chip-track)" : "transparent",
                  cursor: "pointer",
                  fontSize: "0.85rem"
                }}
              >
                <input
                  type="radio"
                  name="quickArticle"
                  checked={selectedArticle === art.num}
                  onChange={() => {
                    setSelectedArticle(art.num);
                    setCustomArticle("");
                  }}
                />
                <span style={{ fontWeight: "600", color: "var(--accent-mint)" }}>{art.num}:</span>
                <span style={{ color: "var(--text-muted)" }}>{art.title}</span>
              </label>
            ))}
          </div>

          <input
            type="text"
            value={customArticle}
            onChange={(e) => setCustomArticle(e.target.value)}
            placeholder="Or type e.g. Article 22(1)..."
            style={{
              width: "100%",
              height: "36px",
              backgroundColor: "var(--chip-track)",
              border: "1px solid var(--chip-track-light)",
              borderRadius: "var(--radius-sm)",
              padding: "0 10px",
              color: "var(--text-primary)",
              fontSize: "0.85rem",
              marginBottom: "12px"
            }}
          />

          <Button variant="mint" size="sm" onClick={handleConfirmCite} style={{ width: "100%" }}>
            Cite into Record
          </Button>
        </div>
      )}
    </footer>
  );
}
