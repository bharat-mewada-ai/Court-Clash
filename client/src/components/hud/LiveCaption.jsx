import React from 'react';
import { useCourtStore } from '../../store/courtStore.js';

/**
 * Live Caption Subtitle Box:
 * Renders spoken arguments and judicial statements at the bottom of the 3D viewport
 */
export function LiveCaption() {
  const speakerName = useCourtStore((s) => s.speakerName);
  const speakerText = useCourtStore((s) => s.speakerText);
  const captionVisible = useCourtStore((s) => s.captionVisible);

  return (
    <div
      style={{
        position: 'absolute',
        left: '3%',
        right: '3%',
        bottom: '4%',
        background: 'rgba(20, 17, 46, 0.88)',
        borderRadius: '14px',
        padding: '8px 14px',
        fontSize: 'clamp(0.78rem, 2vw, 1rem)',
        lineHeight: 1.3,
        color: 'var(--ink, #f3eefc)',
        opacity: captionVisible ? 1 : 0,
        transform: captionVisible ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        pointerEvents: 'none',
        zIndex: 20,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}
    >
      <strong style={{ color: 'var(--brass, #d6b46a)', marginRight: '6px' }}>
        {speakerName}:
      </strong>
      <span>{speakerText}</span>
    </div>
  );
}

