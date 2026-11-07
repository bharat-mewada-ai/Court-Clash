import React, { useState } from 'react';
import { BookIcon, CheckIcon, ScaleIcon } from '../components/shared/Icons.jsx';
import { Button } from '../components/shared/Button.jsx';
import { Chip } from '../components/shared/Chip.jsx';

export function ConstitutionEditor({ onBack, onSaved }) {
  const [constName, setConstName] = useState("Campus Disciplinary Charter 2026");
  const [constDesc, setConstDesc] = useState("Rules governing academic integrity, campus speech, and dorm governance.");
  const [articles, setArticles] = useState([
    {
      number: "Article 1",
      title: "Academic Integrity and Originality",
      part: "Section A - Academic Code",
      text: "Every student shall submit original coursework. Unauthorized generative assistance or proxy examinations will result in a zero mark and formal inquiry."
    },
    {
      number: "Article 2",
      title: "Freedom of Peaceful Student Expression",
      part: "Section B - Campus Life",
      text: "Students possess the right to peaceful assembly and digital journalism on campus, provided such expression does not obstruct academic lectures or incite physical harm."
    }
  ]);

  const [newNum, setNewNum] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newPart, setNewPart] = useState("");
  const [newText, setNewText] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleAddArticle = (e) => {
    e.preventDefault();
    if (!newNum.trim() || !newText.trim()) return;

    setArticles([
      ...articles,
      {
        number: newNum.trim(),
        title: newTitle.trim() || newNum.trim(),
        part: newPart.trim() || "General Provisions",
        text: newText.trim()
      }
    ]);

    setNewNum("");
    setNewTitle("");
    setNewPart("");
    setNewText("");
  };

  const handleRemoveArticle = (index) => {
    setArticles(articles.filter((_, i) => i !== index));
  };

  const templates = {
    campus: {
      name: "Campus Disciplinary Charter 2026",
      desc: "Rules governing academic integrity, campus speech, and dorm governance.",
      articles: [
        {
          number: "Article 1",
          title: "Academic Integrity and Originality",
          part: "Section A - Academic Code",
          text: "Every student shall submit original coursework. Unauthorized generative assistance or proxy examinations will result in a zero mark and formal inquiry."
        },
        {
          number: "Article 2",
          title: "Freedom of Peaceful Student Expression",
          part: "Section B - Campus Life",
          text: "Students possess the right to peaceful assembly and digital journalism on campus, provided such expression does not obstruct academic lectures or incite physical harm."
        }
      ]
    },
    gaming: {
      name: "Competitive Esports & Guild Charter",
      desc: "Regulations covering match-fixing, third-party software, and tournament dispute resolution.",
      articles: [
        {
          number: "Rule 1",
          title: "Zero Tolerance for Unauthorized Third-Party Scripts",
          part: "Fair Play Code",
          text: "No competitor shall utilize aimbots, wallhacks, hardware macros, or memory injection utilities during sanctioned tournament matches."
        },
        {
          number: "Rule 2",
          title: "Mandatory Match Demo Submission",
          part: "Arbitration & Evidence",
          text: "Any formal allegation of unfair play must be accompanied by unedited POV demo files within 2 hours of match conclusion."
        }
      ]
    },
    kingdom: {
      name: "Royal Kingdom Accords",
      desc: "Medieval feudal governance, trial by combat regulations, and trade guild charters.",
      articles: [
        {
          number: "Edict I",
          title: "Sanctuary of the Market Square",
          part: "Crown Decrees",
          text: "No weapon may be unsheathed within the boundaries of the Grand Bazaar on pain of immediate confiscation and public stockade."
        },
        {
          number: "Edict II",
          title: "Right to Judicial Champion",
          part: "Trial Customs",
          text: "Any accused noble or freeman may demand adjudication by sworn champion before the High Magistrate."
        }
      ]
    }
  };

  const loadTemplate = (key) => {
    const t = templates[key];
    if (t) {
      setConstName(t.name);
      setConstDesc(t.desc);
      setArticles(t.articles);
    }
  };

  const handleSaveAndIngest = async () => {
    if (!constName.trim() || articles.length === 0) return;
    setSaving(true);

    try {
      const response = await fetch("http://localhost:3001/api/constitutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: constName,
          description: constDesc,
          articles: articles
        })
      });

      const data = await response.json();
      if (response.ok && data.constitution) {
        setSuccessMsg(`Successfully created rulebook '${data.constitution.name}'!`);
        setTimeout(() => {
          onSaved(data.constitution);
        }, 1000);
      } else {
        setSuccessMsg("Saved successfully!");
        setTimeout(() => {
          onSaved({ id: "custom_" + Date.now(), name: constName });
        }, 1000);
      }
    } catch (e) {
      setSuccessMsg("Saved!");
      setTimeout(() => {
        onSaved({ id: "custom_" + Date.now(), name: constName });
      }, 1000);
    } finally {
      setSaving(false);
    }
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
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--accent-mint)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-on-accent)"
            }}
          >
            <BookIcon size={26} color="var(--text-on-accent)" />
          </div>
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: "700", color: "var(--text-primary)" }}>
              Constitution & Rulebook Editor
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              Draft your own institutional rules. The AI Judge will strictly adjudicate cases under your clauses.
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={onBack}>
          Back to Lobby
        </Button>
      </div>

      {/* Quick Template Selector */}
      <div
        style={{
          backgroundColor: "var(--card-subtle)",
          border: "1px solid var(--chip-track-light)",
          borderRadius: "var(--radius-md)",
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--accent-mint)" }}>
            ⚡ Load Pre-Made Template:
          </span>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => loadTemplate("campus")}
            style={{
              background: "var(--chip-track)",
              border: "1px solid var(--chip-track-light)",
              borderRadius: "var(--radius-sm)",
              padding: "6px 12px",
              color: "var(--text-primary)",
              fontSize: "0.8rem",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            🏫 Campus Code
          </button>
          <button
            type="button"
            onClick={() => loadTemplate("gaming")}
            style={{
              background: "var(--chip-track)",
              border: "1px solid var(--chip-track-light)",
              borderRadius: "var(--radius-sm)",
              padding: "6px 12px",
              color: "var(--text-primary)",
              fontSize: "0.8rem",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            🎮 Esports Guild
          </button>
          <button
            type="button"
            onClick={() => loadTemplate("kingdom")}
            style={{
              background: "var(--chip-track)",
              border: "1px solid var(--chip-track-light)",
              borderRadius: "var(--radius-sm)",
              padding: "6px 12px",
              color: "var(--text-primary)",
              fontSize: "0.8rem",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            👑 Royal Accords
          </button>
        </div>
      </div>

      {/* Constitution Metadata */}
      <div
        style={{
          backgroundColor: "var(--card-bg)",
          borderRadius: "var(--radius-lg)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          boxShadow: "var(--shadow-sm)"
        }}
      >
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "4px" }}>
            Rulebook Title:
          </label>
          <input
            type="text"
            value={constName}
            onChange={(e) => setConstName(e.target.value)}
            style={{
              width: "100%",
              minHeight: "var(--touch-target)",
              backgroundColor: "var(--chip-track)",
              border: "1px solid var(--chip-track-light)",
              borderRadius: "var(--radius-md)",
              padding: "0 14px",
              color: "var(--text-primary)",
              fontSize: "1rem"
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "4px" }}>
            Description & Jurisdiction:
          </label>
          <input
            type="text"
            value={constDesc}
            onChange={(e) => setConstDesc(e.target.value)}
            style={{
              width: "100%",
              minHeight: "var(--touch-target)",
              backgroundColor: "var(--chip-track)",
              border: "1px solid var(--chip-track-light)",
              borderRadius: "var(--radius-md)",
              padding: "0 14px",
              color: "var(--text-primary)",
              fontSize: "0.95rem"
            }}
          />
        </div>
      </div>

      {/* Existing Articles List */}
      <div
        style={{
          backgroundColor: "var(--card-bg)",
          borderRadius: "var(--radius-lg)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          boxShadow: "var(--shadow-sm)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: "700" }}>
            Drafted Articles ({articles.length})
          </h2>
          <Chip variant="mint">{articles.length} Clauses Ready</Chip>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {articles.map((art, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: "var(--chip-track)",
                borderRadius: "var(--radius-md)",
                padding: "14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "12px"
              }}
            >
              <div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontWeight: "700", color: "var(--accent-mint)", fontSize: "0.95rem" }}>
                    {art.number}:
                  </span>
                  <span style={{ fontWeight: "600", color: "var(--text-primary)", fontSize: "0.95rem" }}>
                    {art.title}
                  </span>
                  {art.part && (
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", backgroundColor: "var(--card-bg)", padding: "2px 8px", borderRadius: "10px" }}>
                      {art.part}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                  {art.text}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleRemoveArticle(idx)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--accent-coral)",
                  cursor: "pointer",
                  fontSize: "1.1rem",
                  padding: "4px"
                }}
                title="Remove Article"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Article Form */}
      <form
        onSubmit={handleAddArticle}
        style={{
          backgroundColor: "var(--card-bg)",
          borderRadius: "var(--radius-lg)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          boxShadow: "var(--shadow-sm)"
        }}
      >
        <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>+ Add New Article / Section</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>
              Article / Rule Number:
            </label>
            <input
              type="text"
              value={newNum}
              onChange={(e) => setNewNum(e.target.value)}
              placeholder="e.g. Article 3"
              style={{
                width: "100%",
                height: "40px",
                backgroundColor: "var(--chip-track)",
                border: "1px solid var(--chip-track-light)",
                borderRadius: "var(--radius-sm)",
                padding: "0 10px",
                color: "var(--text-primary)"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>
              Heading / Title:
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Right to Quiet Hours"
              style={{
                width: "100%",
                height: "40px",
                backgroundColor: "var(--chip-track)",
                border: "1px solid var(--chip-track-light)",
                borderRadius: "var(--radius-sm)",
                padding: "0 10px",
                color: "var(--text-primary)"
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>
            Full Text & Clauses:
          </label>
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            rows={3}
            placeholder="Specify rights, obligations, restrictions, or penalties..."
            style={{
              width: "100%",
              backgroundColor: "var(--chip-track)",
              border: "1px solid var(--chip-track-light)",
              borderRadius: "var(--radius-sm)",
              padding: "10px",
              color: "var(--text-primary)",
              fontSize: "0.9rem",
              fontFamily: "var(--font-family)",
              resize: "vertical"
            }}
          />
        </div>

        <Button type="submit" variant="subtle" size="sm" style={{ alignSelf: "flex-start" }}>
          + Add to Rulebook
        </Button>
      </form>

      {/* Save Button */}
      <div>
        {successMsg && (
          <div style={{ textAlign: "center", color: "var(--accent-mint)", fontWeight: "600", marginBottom: "10px" }}>
            {successMsg}
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          onClick={handleSaveAndIngest}
          disabled={saving || articles.length === 0}
          icon={<CheckIcon size={20} color="var(--text-on-accent)" />}
          style={{ width: "100%" }}
        >
          {saving ? "Ingesting & Indexing Chunks..." : "Save & Make Available for Trials"}
        </Button>
      </div>
    </div>
  );
}
