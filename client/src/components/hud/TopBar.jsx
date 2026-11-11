import React from 'react';
import { useCourtStore } from '../../store/courtStore.js';

/**
 * HUD Top Bar:
 * Title, status text, articles in play pill, and 60-second timer pill
 */
export function TopBar({ onBack }) {
  const statusText = useCourtStore((s) => s.statusText);
  const articlesInPlay = useCourtStore((s) => s.articlesInPlay);
  const timer = useCourtStore((s) => s.timer);

  const formatTimer = (t) => {
    if (t === 60) return '01:00';
    return `00:${t < 10 ? '0' : ''}${t}`;
  };

  const articlesLabel =
    articlesInPlay.length > 0
      ? `Articles in play: ${articlesInPlay.join(', ')}`
      : 'Articles in play: none';

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap',
        background: 'var(--panel, #2b2563)',
        borderRadius: '16px',
        padding: '8px 14px',
        marginBottom: '10px',
        fontFamily: '"Baloo 2", system-ui, sans-serif',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)'
      }}
    >
      <div>
        <h1
          style={{
            fontSize: '1.15rem',
            margin: 0,
            lineHeight: 1.1,
            color: 'var(--ink, #f3eefc)',
            fontWeight: 700
          }}
        >
          Court Clash
        </h1>
        <small
          style={{
            display: 'block',
            fontWeight: 500,
            opacity: 0.7,
            fontSize: '0.75rem',
            color: 'var(--ink, #f3eefc)'
          }}
        >
          {statusText}
        </small>
      </div>

      <span
        style={{
          border: '1px solid var(--brass, #d6b46a)',
          color: 'var(--brass, #d6b46a)',
          borderRadius: '999px',
          padding: '2px 12px',
          fontSize: '0.85rem',
          fontWeight: 700
        }}
      >
        {articlesLabel}
      </span>

      <div style={{ flex: 1 }} />

      {onBack && (
        <button
          onClick={onBack}
          style={{
            background: 'transparent',
            border: '1px solid var(--brass, #d6b46a)',
            color: 'var(--brass, #d6b46a)',
            borderRadius: '999px',
            padding: '4px 14px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          ← Lobby
        </button>
      )}

      <span
        style={{
          border: '1px solid var(--brass, #d6b46a)',
          color: 'var(--brass, #d6b46a)',
          borderRadius: '999px',
          padding: '2px 12px',
          fontSize: '0.85rem',
          fontWeight: 700,
          minWidth: '55px',
          textAlign: 'center'
        }}
      >
        {formatTimer(timer)}
      </span>
    </header>
  );
}

