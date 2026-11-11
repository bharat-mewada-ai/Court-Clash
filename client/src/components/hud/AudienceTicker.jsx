import React from 'react';
import { useCourtStore } from '../../store/courtStore.js';

/**
 * Audience Shout Ticker:
 * Shows live crowd comments from law students in the gallery at the top-right
 */
export function AudienceTicker() {
  const activeShout = useCourtStore((s) => s.activeShout);

  const isVisible = Boolean(activeShout);

  return (
    <div
      style={{
        position: 'absolute',
        right: '3%',
        top: '4%',
        maxWidth: '60%',
        background: 'rgba(20, 17, 46, 0.88)',
        borderRadius: '999px',
        padding: '4px 14px',
        fontSize: 'clamp(0.68rem, 1.7vw, 0.82rem)',
        color: 'var(--ink, #f3eefc)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(-4px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        pointerEvents: 'none',
        zIndex: 15,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
      }}
    >
      {activeShout && (
        <>
          <strong style={{ color: 'var(--brass, #d6b46a)', marginRight: '6px' }}>
            @{activeShout.user}:
          </strong>
          <span>{activeShout.text}</span>
        </>
      )}
    </div>
  );
}

