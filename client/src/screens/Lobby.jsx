import React, { useState, useEffect } from 'react';
import { ScaleIcon, UserIcon, CopyIcon, CheckIcon, BookIcon, GavelIcon } from '../components/shared/Icons.jsx';
import { Button } from '../components/shared/Button.jsx';
import { Chip } from '../components/shared/Chip.jsx';
import { RulebookReaderModal } from '../components/shared/RulebookReaderModal.jsx';

export function Lobby({ onEnterCourt, onOpenEditor, onOpen3D }) {
  const [userName, setUserName] = useState("Aarav Sharma");
  const [selectedSide, setSelectedSide] = useState("petitioner");
  const [judgeMode, setJudgeMode] = useState("ai"); // 'ai' or 'human'
  const [selectedConstitution, setSelectedConstitution] = useState("indian_constitution");
  const [readingRulebookId, setReadingRulebookId] = useState(null);
  const [selectedPersona, setSelectedPersona] = useState("Strict");
  const [turnDuration, setTurnDuration] = useState(60);
  const [copied, setCopied] = useState(false);
  const [roomId, setRoomId] = useState(() => "court-" + Math.random().toString(36).substring(2, 7));

  const [rulebooks, setRulebooks] = useState([
    {
      id: "indian_constitution",
      name: "The Constitution of India",
      tag: "Built-in Standard",
      description: "Fundamental Rights, Directive Principles, and writ jurisdictions for real-world legal debates.",
      articlesCount: 44,
      isBuiltIn: true
    }
  ]);

  useEffect(() => {
    fetch("http://localhost:3001/api/constitutions")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (data && data.length > 0) {
          setRulebooks(data);
        }
      })
      .catch((err) => console.log("Using default rulebooks:", err.message));
  }, []);

  const handleDeleteConstitution = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await fetch(`http://localhost:3001/api/constitutions/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setRulebooks((prev) => prev.filter((r) => r.id !== id));
        if (selectedConstitution === id) {
          setSelectedConstitution("indian_constitution");
        }
      }
    } catch (err) {
      console.warn("Failed to delete constitution:", err);
    }
  };

  const personas = [
    {
      id: "STRICT",
      title: "Strict Judge",
      badge: "No-Nonsense & Sharp",
      quote: "\"Yeh court hai, chai ki tapri nahi. Point pe aao.\"",
      description: "Formal, authoritative, short sentences. Immediately disciplines sloppy arguments or emotional theatrics."
    },
    {
      id: "SARCASTIC",
      title: "Sarcastic Judge",
      badge: "Dry Wit & Savagery",
      quote: "\"Wah, kitni gehri baat. Ab isme koi Article hai ya sirf vibes?\"",
      description: "Dry wit. Roasts weak arguments politely but savagely while upholding constitutional grounding."
    },
    {
      id: "FILMY",
      title: "Filmy Judge",
      badge: "Bollywood Drama",
      quote: "\"Tareekh pe tareekh! Yeh court emotion se nahi, saboot se chalti hai!\"",
      description: "Full cinematic courtroom energy. Dramatic gavel bangers, high stakes, and unforgettable punchlines."
    },
    {
      id: "SLEEPY",
      title: "Sleepy Judge",
      badge: "Drowsy Veteran",
      quote: "\"...hmm? haan, continue. Zzz... Wakes up sharply on a good point.\"",
      description: "Occasional mid-sentence dozing. Hard to impress, but rewards brilliant legal citations with sudden excitement."
    }
  ];

  const inviteLink = `${window.location.origin}/court/${roomId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartCourt = () => {
    onEnterCourt({
      roomId,
      userName: userName.trim() || (selectedSide === "judge" ? "Hon'ble Judge" : "Advocate"),
      side: selectedSide,
      judgeMode,
      constitutionId: selectedConstitution,
      judgePersona: selectedPersona,
      turnDuration: Number(turnDuration)
    });
  };

  return (
    <div
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "36px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "28px"
      }}
      className="animate-slide-up"
    >
      {/* Header */}
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "var(--radius-lg)",
            backgroundColor: "var(--accent-gold)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "var(--shadow-glow-gold)"
          }}
        >
          <ScaleIcon size={38} color="var(--text-on-accent)" />
        </div>
        <h1 style={{ fontSize: "2.4rem", fontWeight: "700", letterSpacing: "1px", color: "var(--text-primary)" }}>
          COURT CLASH
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", maxWidth: "600px" }}>
          Step into a virtual courtroom where disputes are governed by an AI Judge grounded strictly in constitutional law.
        </p>
      </div>

      {/* 1. Identity & Side Selection */}
      <div
        style={{
          backgroundColor: "var(--card-bg)",
          borderRadius: "var(--radius-lg)",
          padding: "24px",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}
      >
        <h2 style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--text-primary)" }}>
          1. Your Counsel Profile
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>
              Your Name / Title:
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. Adv. Priya Sen"
              style={{
                width: "100%",
                minHeight: "var(--touch-target)",
                backgroundColor: "var(--chip-track)",
                border: "1.5px solid var(--chip-track-light)",
                borderRadius: "var(--radius-md)",
                padding: "0 14px",
                color: "var(--text-primary)",
                fontSize: "1rem",
                outline: "none"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px" }}>
              Your Courtroom Role:
            </label>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setSelectedSide("petitioner")}
                style={{
                  flex: 1,
                  minWidth: "120px",
                  minHeight: "var(--touch-target)",
                  borderRadius: "var(--radius-md)",
                  border: selectedSide === "petitioner" ? "2px solid var(--accent-coral)" : "1px solid var(--chip-track-light)",
                  backgroundColor: selectedSide === "petitioner" ? "rgba(255, 93, 115, 0.2)" : "var(--chip-track)",
                  color: selectedSide === "petitioner" ? "var(--accent-coral)" : "var(--text-muted)",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                <UserIcon size={18} color={selectedSide === "petitioner" ? "var(--accent-coral)" : "var(--text-muted)"} />
                Petitioner
              </button>

              <button
                type="button"
                onClick={() => setSelectedSide("respondent")}
                style={{
                  flex: 1,
                  minWidth: "120px",
                  minHeight: "var(--touch-target)",
                  borderRadius: "var(--radius-md)",
                  border: selectedSide === "respondent" ? "2px solid var(--accent-mint)" : "1px solid var(--chip-track-light)",
                  backgroundColor: selectedSide === "respondent" ? "rgba(61, 219, 176, 0.2)" : "var(--chip-track)",
                  color: selectedSide === "respondent" ? "var(--accent-mint)" : "var(--text-muted)",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                <UserIcon size={18} color={selectedSide === "respondent" ? "var(--accent-mint)" : "var(--text-muted)"} />
                Respondent
              </button>

              {judgeMode === "human" && (
                <button
                  type="button"
                  onClick={() => setSelectedSide("judge")}
                  style={{
                    flex: 1,
                    minWidth: "130px",
                    minHeight: "var(--touch-target)",
                    borderRadius: "var(--radius-md)",
                    border: selectedSide === "judge" ? "2px solid var(--accent-gold)" : "1px solid var(--chip-track-light)",
                    backgroundColor: selectedSide === "judge" ? "rgba(255, 197, 61, 0.2)" : "var(--chip-track)",
                    color: selectedSide === "judge" ? "var(--accent-gold)" : "var(--text-muted)",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px"
                  }}
                >
                  <GavelIcon size={18} color={selectedSide === "judge" ? "var(--accent-gold)" : "var(--text-muted)"} />
                  Presiding Judge
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Rulebook Cards */}
      <div
        style={{
          backgroundColor: "var(--card-bg)",
          borderRadius: "var(--radius-lg)",
          padding: "24px",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--text-primary)" }}>
              2. Select Courtroom Rulebook
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              The AI Judge will retrieve and cite strictly from this selected rulebook.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <Button
              variant="subtle"
              size="sm"
              onClick={() => setReadingRulebookId(selectedConstitution)}
              icon={<BookIcon size={16} />}
            >
              📖 Read Active Book
            </Button>
            <Button variant="outline" size="sm" onClick={onOpenEditor} icon={<BookIcon size={16} />}>
              + Custom Rulebook
            </Button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
          {rulebooks.map((book) => {
            const isSelected = selectedConstitution === book.id;
            const tagLabel = book.isBuiltIn ? "Built-in Standard" : "Custom Rulebook";
            const tagVariant = book.isBuiltIn ? "gold" : "mint";

            return (
              <div
                key={book.id}
                onClick={() => setSelectedConstitution(book.id)}
                style={{
                  backgroundColor: isSelected ? "rgba(255, 197, 61, 0.12)" : "var(--chip-track)",
                  border: isSelected ? "2px solid var(--accent-gold)" : "1px solid var(--chip-track-light)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <Chip variant={tagVariant}>{tagLabel}</Chip>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {book.articlesCount} clauses
                      </span>
                      {!book.isBuiltIn && (
                        <button
                          onClick={(e) => handleDeleteConstitution(e, book.id)}
                          title="Delete custom rulebook"
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--accent-coral)",
                            cursor: "pointer",
                            fontSize: "1rem",
                            padding: "0 4px"
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text-primary)", marginBottom: "6px" }}>
                    {book.name || book.title}
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                    {book.description}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "16px",
                    paddingTop: "12px",
                    borderTop: "1px solid rgba(255, 255, 255, 0.08)"
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.78rem",
                      color: isSelected ? "var(--accent-gold)" : "var(--text-muted)",
                      fontWeight: isSelected ? "700" : "500"
                    }}
                  >
                    {isSelected ? "✓ Active Rulebook" : "Click to select"}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setReadingRulebookId(book.id);
                    }}
                    style={{
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.18)",
                      borderRadius: "6px",
                      color: "var(--text-primary)",
                      padding: "5px 10px",
                      fontSize: "0.78rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      transition: "all 0.15s ease"
                    }}
                    title={`Read full clauses of ${book.name}`}
                  >
                    <span>📖</span>
                    <span>Read Clauses</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Judge Authority & Mode */}
      <div
        style={{
          backgroundColor: "var(--card-bg)",
          borderRadius: "var(--radius-lg)",
          padding: "24px",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          flexDirection: "column",
          gap: "18px"
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--text-primary)" }}>
            3. Presiding Judicial Authority
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Choose whether an automated AI Judge or a 3rd human participant will preside over the Bench.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div
            onClick={() => setJudgeMode("ai")}
            style={{
              padding: "16px",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              border: judgeMode === "ai" ? "2px solid var(--accent-gold)" : "1px solid var(--chip-track-light)",
              backgroundColor: judgeMode === "ai" ? "rgba(255, 197, 61, 0.15)" : "var(--chip-track)",
              transition: "all 0.2s"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <ScaleIcon size={20} color={judgeMode === "ai" ? "var(--accent-gold)" : "var(--text-muted)"} />
              <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "var(--text-primary)" }}>
                🤖 AI Judge Mode (2-Player)
              </h3>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
              Autonomous RAG judicial reasoning engine strictly applying constitutional law.
            </p>
          </div>

          <div
            onClick={() => {
              setJudgeMode("human");
            }}
            style={{
              padding: "16px",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              border: judgeMode === "human" ? "2px solid var(--accent-gold)" : "1px solid var(--chip-track-light)",
              backgroundColor: judgeMode === "human" ? "rgba(255, 197, 61, 0.15)" : "var(--chip-track)",
              transition: "all 0.2s"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <GavelIcon size={20} color={judgeMode === "human" ? "var(--accent-gold)" : "var(--text-muted)"} />
              <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "var(--text-primary)" }}>
                🧑‍⚖️ Human Judge Mode (3-Player)
              </h3>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
              A real 3rd person presides on the Bench: bangs the gavel, rules on objections, and signs the verdict!
            </p>
          </div>
        </div>

        {judgeMode === "ai" ? (
          <div>
            <h4 style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--accent-gold)", marginBottom: "10px" }}>
              Select AI Judge Persona:
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
              {personas.map((p) => {
                const isSelected = selectedPersona === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPersona(p.id)}
                    style={{
                      backgroundColor: isSelected ? "rgba(255, 197, 61, 0.12)" : "var(--chip-track)",
                      border: isSelected ? "2px solid var(--accent-gold)" : "1px solid var(--chip-track-light)",
                      borderRadius: "var(--radius-md)",
                      padding: "16px",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <GavelIcon size={18} color="var(--accent-gold)" />
                      <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text-primary)" }}>
                        {p.title}
                      </h3>
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--accent-gold)", fontWeight: "600", display: "block", marginBottom: "6px" }}>
                      {p.badge}
                    </span>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                      {p.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: "18px",
              backgroundColor: "rgba(255, 197, 61, 0.08)",
              borderRadius: "var(--radius-md)",
              border: "1px dashed var(--accent-gold)",
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-gold)", fontWeight: "700" }}>
              <GavelIcon size={20} color="var(--accent-gold)" />
              <span>3-Player Courtroom Chamber Active</span>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: "1.5" }}>
              Share your room invite link with <strong>2 friends</strong>. One friend will join as Petitioner, one as Respondent, and the third friend (or you) can select <strong>Presiding Judge</strong> in the profile section above to take the Bench.
            </p>
          </div>
        )}
      </div>

      {/* 4. Invite Link & Open Court Button */}
      <div
        style={{
          backgroundColor: "var(--card-bg)",
          borderRadius: "var(--radius-lg)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          boxShadow: "var(--shadow-sm)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: "700" }}>Share Courtroom Invite Link</h3>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Send this link to your respondent or co-counsel so they can enter the chamber.
            </span>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Turn Duration:</span>
            <select
              value={turnDuration}
              onChange={(e) => setTurnDuration(e.target.value)}
              style={{
                backgroundColor: "var(--chip-track)",
                border: "1px solid var(--chip-track-light)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-primary)",
                padding: "6px 10px",
                fontSize: "0.85rem",
                fontWeight: "600"
              }}
            >
              <option value={60}>60 Seconds (Standard)</option>
              <option value={30}>30 Seconds (Fast)</option>
              <option value={15}>15 Seconds (Lightning Demo)</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            readOnly
            value={inviteLink}
            style={{
              flex: 1,
              minHeight: "var(--touch-target)",
              backgroundColor: "var(--chip-track)",
              border: "1px solid var(--chip-track-light)",
              borderRadius: "var(--radius-md)",
              padding: "0 14px",
              color: "var(--text-muted)",
              fontSize: "0.9rem"
            }}
          />
          <Button variant="subtle" onClick={handleCopy} icon={copied ? <CheckIcon size={18} color="var(--accent-mint)" /> : <CopyIcon size={18} />}>
            {copied ? "Copied!" : "Copy Link"}
          </Button>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "8px" }}>
          <Button
            variant="primary"
            size="lg"
            onClick={handleStartCourt}
            icon={<ScaleIcon size={22} color="var(--text-on-accent)" />}
            style={{ flex: 1, minWidth: "220px" }}
          >
            Open 2D Court Session
          </Button>
          <Button
            variant="mint"
            size="lg"
            onClick={onOpen3D}
            style={{ flex: 1, minWidth: "220px", fontWeight: "700" }}
          >
            🎮 Enter 3D Courtroom (Three.js)
          </Button>
        </div>
      </div>

      <footer style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem" }}>
        Educational simulation only. Not legal advice. Grounded by constitutional RAG.
      </footer>

      {/* Interactive Rulebook & Clauses Reader Modal */}
      {readingRulebookId && (
        <RulebookReaderModal
          rulebookId={readingRulebookId}
          onClose={() => setReadingRulebookId(null)}
        />
      )}
    </div>
  );
}
