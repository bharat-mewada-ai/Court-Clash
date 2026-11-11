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
  const setCameraShot = useCourtStore((s) => s.setCameraShot);

  const shotButtons = [
    { id: 'wide', label: 'Inside' },
    { id: 'j', label: 'Bench' },
    { id: 'pet', label: 'Petitioner' },
    { id: 'res', label: 'Respondent' },
    { id: 'overview', label: 'Overview' }
  ];

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

        {/* Interactive Camera Angle Selector */}
        <div
          id="shot"
          style={{
            position: 'absolute',
            left: '3%',
            top: '4%',
            background: 'rgba(20, 17, 46, 0.88)',
            borderRadius: '999px',
            padding: '3px 6px 3px 12px',
            fontSize: '0.75rem',
            color: 'var(--ink, #f3eefc)',
            zIndex: 15,
            border: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)'
          }}
        >
          <span style={{ fontWeight: 600, color: 'var(--brass, #d6b46a)' }}>
            Camera:
          </span>
          <div style={{ display: 'flex', gap: '3px' }}>
            {shotButtons.map((btn) => {
              const isActive =
                cameraShot === btn.id ||
                (cameraShot === 'inside' && btn.id === 'wide') ||
                (cameraShot === 'judge' && btn.id === 'j') ||
                (cameraShot === 'petitioner' && btn.id === 'pet') ||
                (cameraShot === 'respondent' && btn.id === 'res');

              return (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setCameraShot(btn.id)}
                  style={{
                    background: isActive ? 'var(--brass, #d6b46a)' : 'rgba(255, 255, 255, 0.08)',
                    color: isActive ? '#1a1640' : 'var(--ink, #f3eefc)',
                    border: 0,
                    borderRadius: '999px',
                    padding: '2px 8px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title={`Switch to ${btn.label} view`}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>
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

