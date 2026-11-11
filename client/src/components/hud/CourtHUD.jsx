import React from 'react';
import { useCourtStore } from '../../store/courtStore.js';
import { TopBar } from './TopBar.jsx';
import { LiveCaption } from './LiveCaption.jsx';
import { ObjectionOverlay } from './ObjectionOverlay.jsx';
import { AudienceTicker } from './AudienceTicker.jsx';
import { BottomControls } from './BottomControls.jsx';

/**
 * Main HUD Overlay Container:
 * Renders HTML controls and overlays above the WebGL 3D Canvas
 * Matching the layout and responsive sizing of the prototype
 */
export function CourtHUD({ children, onBack }) {
  const cameraShot = useCourtStore((s) => s.cameraShot);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '12px',
        fontFamily: '"Baloo 2", system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column'
      }}
      className="animate-slide-up"
    >
      {/* 1. Top Bar */}
      <TopBar onBack={onBack} />

      {/* 2. 3D Viewport Frame */}
      <div
        id="scene"
        style={{
          position: 'relative',
          borderRadius: '18px',
          overflow: 'hidden',
          aspectRatio: '16/9',
          minHeight: '320px',
          background: '#1a1230',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* The 3D R3F Canvas */}
        {children}

        {/* Camera Shot Pill */}
        <div
          id="shot"
          style={{
            position: 'absolute',
            left: '3%',
            top: '4%',
            background: 'rgba(20, 17, 46, 0.85)',
            borderRadius: '999px',
            padding: '3px 12px',
            fontSize: '0.75rem',
            color: 'var(--ink, #f3eefc)',
            pointerEvents: 'none',
            zIndex: 15,
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          Camera: {cameraShot}
        </div>

        {/* Audience Shout Pill */}
        <AudienceTicker />

        {/* Big Objection Typography & Coral Flash */}
        <ObjectionOverlay />

        {/* Live Subtitle Caption */}
        <LiveCaption />
      </div>

      {/* 3. Bottom Controls */}
      <BottomControls />

      {/* 4. Quality Bar Legal Disclaimer */}
      <p
        style={{
          fontSize: '0.75rem',
          opacity: 0.6,
          textAlign: 'center',
          margin: '8px 0 0',
          lineHeight: 1.3,
          color: 'var(--ink, #f3eefc)'
        }}
      >
        3D prototype built from procedural simple shapes. Educational simulation, not legal advice.
      </p>
    </div>
  );
}

