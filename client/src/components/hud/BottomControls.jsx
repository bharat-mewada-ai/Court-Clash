import React, { useState } from 'react';
import { useCourtStore } from '../../store/courtStore.js';

/**
 * Bottom Counsel Controls Bar:
 * - Oral submission text input (with Enter key listener)
 * - Objection! action button (Coral)
 * - Cite Article action button (Teal)
 * - Submit argument button (Brass)
 */
export function BottomControls() {
  const [inputText, setInputText] = useState('');
  const isBusy = useCourtStore((s) => s.isBusy);
  const currentTurn = useCourtStore((s) => s.currentTurn);
  const submitArgument = useCourtStore((s) => s.submitArgument);
  const raiseObjection = useCourtStore((s) => s.raiseObjection);
  const citeArticle = useCourtStore((s) => s.citeArticle);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (isBusy) return;
    submitArgument(inputText);
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <footer
      style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        background: 'var(--panel, #2b2563)',
        borderRadius: '16px',
        padding: '10px',
        marginTop: '10px',
        fontFamily: '"Baloo 2", system-ui, sans-serif',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)'
      }}
    >
      <input
        type="text"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={`Enter your oral submission as ${currentTurn}…`}
        aria-label="Oral submission input"
        disabled={isBusy}
        style={{
          flex: '1 1 220px',
          minWidth: 0,
          background: '#241f58',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '10px 14px',
          color: 'var(--ink, #f3eefc)',
          font: 'inherit',
          fontSize: '0.92rem',
          outline: 'none',
          opacity: isBusy ? 0.7 : 1
        }}
      />

      {/* Button 1: Objection! (Coral) */}
      <button
        type="button"
        onClick={raiseObjection}
        disabled={isBusy}
        style={{
          background: 'var(--coral, #ff5c7a)',
          color: '#1a1640',
          fontWeight: 700,
          border: 0,
          borderRadius: '12px',
          padding: '8px 18px',
          cursor: isBusy ? 'not-allowed' : 'pointer',
          font: 'inherit',
          opacity: isBusy ? 0.6 : 1,
          transition: 'transform 0.1s ease, filter 0.2s ease',
          boxShadow: '0 2px 8px rgba(255, 92, 122, 0.3)'
        }}
        title="Raise formal legal objection"
      >
        Objection!
      </button>

      {/* Button 2: Cite Article (Teal) */}
      <button
        type="button"
        onClick={() => citeArticle()}
        disabled={isBusy}
        style={{
          background: 'var(--teal, #2dd4a8)',
          color: '#1a1640',
          fontWeight: 700,
          border: 0,
          borderRadius: '12px',
          padding: '8px 18px',
          cursor: isBusy ? 'not-allowed' : 'pointer',
          font: 'inherit',
          opacity: isBusy ? 0.6 : 1,
          transition: 'transform 0.1s ease, filter 0.2s ease',
          boxShadow: '0 2px 8px rgba(45, 212, 168, 0.3)'
        }}
        title="Cite next constitutional provision into the record"
      >
        Cite Article
      </button>

      {/* Button 3: Submit Argument (Brass) */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isBusy}
        style={{
          background: 'var(--brass, #d6b46a)',
          color: '#1a1640',
          fontWeight: 700,
          border: 0,
          borderRadius: '12px',
          padding: '8px 18px',
          cursor: isBusy ? 'not-allowed' : 'pointer',
          font: 'inherit',
          opacity: isBusy ? 0.6 : 1,
          transition: 'transform 0.1s ease, filter 0.2s ease',
          boxShadow: '0 2px 8px rgba(214, 180, 106, 0.3)'
        }}
        title="Submit your argument to the presiding judge"
      >
        Submit argument
      </button>
    </footer>
  );
}
