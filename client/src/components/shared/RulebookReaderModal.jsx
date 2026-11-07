import React, { useState, useEffect, useMemo } from 'react';
import { BookIcon, CopyIcon, CheckIcon } from './Icons.jsx';
import { Chip } from './Chip.jsx';

export function RulebookReaderModal({ rulebookId, onClose, onSelectArticle = null }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPart, setSelectedPart] = useState("ALL");
  const [copiedIndex, setCopiedIndex] = useState(null);

  useEffect(() => {
    if (!rulebookId) return;
    setLoading(true);
    setError(null);

    fetch(`http://localhost:3001/api/constitutions/${rulebookId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Could not load rulebook");
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Rulebook fetch error:", err);
        setError("Unable to load rulebook articles. Please ensure server is running.");
        setLoading(false);
      });
  }, [rulebookId]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Extract unique parts for quick filter
  const uniqueParts = useMemo(() => {
    if (!data?.articles) return [];
    const parts = new Set();
    data.articles.forEach((a) => {
      if (a.part) parts.add(a.part);
    });
    return Array.from(parts).slice(0, 10); // Show top 10 parts
  }, [data]);

  // Filter articles by query and part
  const filteredArticles = useMemo(() => {
    if (!data?.articles) return [];
    const query = searchQuery.toLowerCase().trim();

    return data.articles.filter((art) => {
      const matchPart = selectedPart === "ALL" || art.part === selectedPart;
      if (!matchPart) return false;

      if (!query) return true;
      const numMatch = (art.number || "").toLowerCase().includes(query);
      const titleMatch = (art.title || "").toLowerCase().includes(query);
      const textMatch = (art.text || "").toLowerCase().includes(query);
      const partMatch = (art.part || "").toLowerCase().includes(query);

      return numMatch || titleMatch || textMatch || partMatch;
    });
  }, [data, searchQuery, selectedPart]);

  const handleCopy = (art, idx) => {
    const citation = `${art.number}: ${art.title}\n\n${art.text}`;
    navigator.clipboard.writeText(citation);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(10, 8, 30, 0.85)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "20px"
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "var(--card-bg)",
          border: "2px solid rgba(255, 197, 61, 0.4)",
          borderRadius: "var(--radius-lg)",
          width: "100%",
          maxWidth: "880px",
          height: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.6)",
          overflow: "hidden"
        }}
        onClick={(e) => e.stopPropagation()}
        className="animate-slide-up"
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--chip-track)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "rgba(34, 30, 84, 0.6)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--accent-gold)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-on-accent)",
                boxShadow: "var(--shadow-glow-gold)"
              }}
            >
              <BookIcon size={24} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--text-primary)" }}>
                  {data?.name || "Official Court Rulebook"}
                </h2>
                {data?.articles && (
                  <Chip variant="gold">{data.articles.length} Clauses</Chip>
                )}
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "2px" }}>
                {data?.description || "Authoritative clauses grounded in RAG for this simulation."}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "var(--text-muted)",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              cursor: "pointer",
              fontSize: "1.2rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s"
            }}
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid var(--chip-track)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            backgroundColor: "var(--card-subtle)"
          }}
        >
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Search by article number, title, or keywords (e.g. Article 19, speech, arrest, liberty)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              style={{
                width: "100%",
                minHeight: "44px",
                backgroundColor: "var(--chip-track)",
                border: "1.5px solid var(--chip-track-light)",
                borderRadius: "var(--radius-md)",
                padding: "0 40px 0 16px",
                color: "var(--text-primary)",
                fontSize: "0.95rem",
                outline: "none"
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "1rem"
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Part Filter Pills */}
          {uniqueParts.length > 1 && (
            <div
              style={{
                display: "flex",
                gap: "8px",
                overflowX: "auto",
                paddingBottom: "4px"
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedPart("ALL")}
                style={{
                  padding: "4px 12px",
                  borderRadius: "999px",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  border: selectedPart === "ALL" ? "1.5px solid var(--accent-gold)" : "1px solid var(--chip-track-light)",
                  backgroundColor: selectedPart === "ALL" ? "rgba(255, 197, 61, 0.2)" : "var(--chip-track)",
                  color: selectedPart === "ALL" ? "var(--accent-gold)" : "var(--text-muted)",
                  whiteSpace: "nowrap"
                }}
              >
                All Parts
              </button>
              {uniqueParts.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPart(p)}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "999px",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    border: selectedPart === p ? "1.5px solid var(--accent-gold)" : "1px solid var(--chip-track-light)",
                    backgroundColor: selectedPart === p ? "rgba(255, 197, 61, 0.2)" : "var(--chip-track)",
                    color: selectedPart === p ? "var(--accent-gold)" : "var(--text-muted)",
                    whiteSpace: "nowrap"
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Articles List Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "14px"
          }}
        >
          {loading && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "2rem", marginBottom: "8px" }}>⏳</div>
              <p>Loading constitutional clauses...</p>
            </div>
          )}

          {error && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--accent-coral)" }}>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && filteredArticles.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
              <p style={{ fontSize: "1.1rem" }}>No clauses found matching "{searchQuery}"</p>
              <button
                onClick={() => { setSearchQuery(""); setSelectedPart("ALL"); }}
                style={{
                  marginTop: "12px",
                  background: "transparent",
                  border: "1px solid var(--accent-gold)",
                  color: "var(--accent-gold)",
                  padding: "6px 14px",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer"
                }}
              >
                Reset Filters
              </button>
            </div>
          )}

          {!loading && !error && filteredArticles.map((art, idx) => (
            <div
              key={art.number || idx}
              style={{
                backgroundColor: "var(--chip-track)",
                border: "1px solid var(--chip-track-light)",
                borderRadius: "var(--radius-md)",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                transition: "border-color 0.2s ease"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span
                    style={{
                      backgroundColor: "var(--accent-gold)",
                      color: "var(--text-on-accent)",
                      fontWeight: "700",
                      fontSize: "0.85rem",
                      padding: "3px 8px",
                      borderRadius: "6px"
                    }}
                  >
                    {art.number}
                  </span>
                  <h3 style={{ fontSize: "0.98rem", fontWeight: "700", color: "var(--text-primary)" }}>
                    {art.title}
                  </h3>
                  {art.part && (
                    <span style={{ fontSize: "0.75rem", color: "var(--accent-mint)", opacity: 0.9 }}>
                      • {art.part}
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: "6px" }}>
                  {onSelectArticle && (
                    <button
                      onClick={() => onSelectArticle(art)}
                      style={{
                        backgroundColor: "rgba(61, 219, 176, 0.15)",
                        border: "1px solid var(--accent-mint)",
                        color: "var(--accent-mint)",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        cursor: "pointer"
                      }}
                    >
                      Cite in Court
                    </button>
                  )}
                  <button
                    onClick={() => handleCopy(art, idx)}
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: copiedIndex === idx ? "var(--accent-mint)" : "var(--text-muted)",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                    title="Copy full clause text"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <CheckIcon size={12} color="var(--accent-mint)" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <CopyIcon size={12} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <p
                style={{
                  fontSize: "0.88rem",
                  color: "var(--text-primary)",
                  lineHeight: "1.55",
                  marginTop: "4px",
                  whiteSpace: "pre-line",
                  opacity: 0.92
                }}
              >
                {art.text}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 24px",
            borderTop: "1px solid var(--chip-track)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.8rem",
            color: "var(--text-muted)",
            backgroundColor: "rgba(34, 30, 84, 0.4)"
          }}
        >
          <span>
            Showing {filteredArticles.length} of {data?.articles?.length || 0} clauses
          </span>
          <span>
            Tip: Press <kbd style={{ background: "var(--chip-track)", padding: "2px 6px", borderRadius: "4px" }}>Esc</kbd> to return to court
          </span>
        </div>
      </div>
    </div>
  );
}
