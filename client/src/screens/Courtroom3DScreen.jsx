import React, { useState } from 'react';
import { CourtroomScene } from '../components/3d/CourtroomScene.jsx';

/**
 * Phase 1 Screen:
 * Renders the full 3D Courtroom matching the reference prototype's layout:
 * - 16:9 responsive viewport with 4:3 mobile fallback
 * - Room with wood planks, red carpet, cream walls, spinning chakra emblem
 * - Judicial bench with gavel and nameplate
 * - Counsel tables and gallery rail
 * - Presiding Judge, Petitioner, Respondent (ghosted), and 18 Audience spectators
 */
export function Courtroom3DScreen({ onBack }) {
  const [judgePersona] = useState('Strict');
  const [petitionerName] = useState('Aarav Sharma');
  const [respondentName] = useState('Meera Iyer');
  const [respondentGhosted, setRespondentGhosted] = useState(true);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '12px',
        fontFamily: '"Baloo 2", system-ui, sans-serif'
      }}
      className="animate-slide-up"
    >
      {/* Top Bar Preview */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          background: 'var(--panel, #2b2563)',
          borderRadius: '16px',
          padding: '8px 14px',
          marginBottom: '10px'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.15rem', margin: 0, lineHeight: 1.1, color: '#f3eefc' }}>
            Court Clash (3D View)
          </h1>
          <small style={{ display: 'block', fontWeight: 500, opacity: 0.7, fontSize: '0.75rem', color: '#f3eefc' }}>
            Phase 1: 3D Environment & Characters Port
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
          Articles in play: none
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
              padding: '2px 12px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ← Back to Lobby
          </button>
        )}
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
          01:00
        </span>
      </div>

      {/* 3D Scene Viewport */}
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
        <CourtroomScene
          judgePersona={judgePersona}
          petitionerName={petitionerName}
          respondentName={respondentName}
          respondentGhosted={respondentGhosted}
        />

        {/* Camera indicator */}
        <div
          style={{
            position: 'absolute',
            left: '3%',
            top: '4%',
            background: '#14112ecc',
            borderRadius: '999px',
            padding: '3px 12px',
            fontSize: '0.75rem',
            color: '#f3eefc',
            pointerEvents: 'none',
            zIndex: 10
          }}
        >
          Camera: wide (Phase 1)
        </div>
      </div>

      {/* Phase 1 Dev Controls */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          background: 'var(--panel, #2b2563)',
          borderRadius: '16px',
          padding: '10px',
          marginTop: '10px'
        }}
      >
        <button
          onClick={() => setRespondentGhosted((prev) => !prev)}
          style={{
            background: 'var(--teal, #2dd4a8)',
            border: 0,
            borderRadius: '12px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontWeight: 700,
            color: '#1a1640'
          }}
        >
          Toggle Respondent Ghosting ({respondentGhosted ? 'Ghosted' : 'Joined'})
        </button>
      </div>

      <p
        style={{
          fontSize: '0.75rem',
          opacity: 0.6,
          textAlign: 'center',
          margin: '8px 0 0',
          lineHeight: 1.3,
          color: '#f3eefc'
        }}
      >
        3D prototype built from procedural simple shapes. Educational simulation, not legal advice.
      </p>
    </div>
  );
}
