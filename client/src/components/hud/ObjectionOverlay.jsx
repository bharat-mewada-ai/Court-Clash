import React from 'react';
import { useCourtStore } from '../../store/courtStore.js';

/**
 * Dramatic Objection Overlay:
 * - Full viewport coral screen flash
 * - Massive centered "Objection!" typography with dramatic drop shadow
 */
export function ObjectionOverlay() {
  const objectionActive = useCourtStore((s) => s.objectionActive);

  if (!objectionActive) return null;

  return (
    <>
      {/* Full-screen Coral Flash */}
      <div
        className="flash-anim"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--coral, #ff5c7a)',
          pointerEvents: 'none',
          zIndex: 25
        }}
      />

      {/* Big "Objection!" Typography */}
      <div
        className="ob-anim"
        style={{
          position: 'absolute',
          left: '50%',
          top: '38%',
          transform: 'translate(-50%, -50%) rotate(-4deg)',
          fontSize: 'clamp(2.4rem, 9vw, 4.8rem)',
          fontWeight: 700,
          color: '#ffffff',
          textShadow: '0 4px 0 var(--coral, #ff5c7a), 0 0 24px var(--coral, #ff5c7a)',
          pointerEvents: 'none',
          zIndex: 30,
          whiteSpace: 'nowrap',
          letterSpacing: '1px'
        }}
      >
        Objection!
      </div>
    </>
  );
}

