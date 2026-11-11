import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Room } from './Room.jsx';
import { Bench } from './Bench.jsx';
import { CounselTable } from './CounselTable.jsx';
import { Character } from './Character.jsx';
import { Audience } from './Audience.jsx';

/**
 * Main 3D Courtroom Scene Root:
 * - R3F Canvas configured with shadows, lighting, and capped DPR (max 2)
 * - Room architecture, judicial bench, counsel tables, and characters
 */
export function CourtroomScene({
  judgeState = 'idle',
  judgePersona = 'Strict',
  petitionerState = 'idle',
  petitionerName = 'Aarav Sharma',
  respondentState = 'idle',
  respondentName = 'Meera Iyer',
  respondentGhosted = true,
  gavelStriking = false,
  children
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]} // Quality bar: Capped at 2 for smooth mobile/mid-range performance
      camera={{ fov: 48, position: [0, 4.8, 11], near: 0.1, far: 60 }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'block'
      }}
    >
      {/* 1. Deep Indigo Ambient & Fog */}
      <color attach="background" args={['#1a1230']} />
      <fog attach="fog" args={['#1a1230', 18, 36]} />

      {/* 2. Courtroom Warm Illumination */}
      <hemisphereLight args={['#fff1d6', '#3a2a1c', 0.75]} />
      <directionalLight
        position={[-4, 9, 7]}
        intensity={0.8}
        color="#ffe2b0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-11}
        shadow-camera-right={11}
        shadow-camera-top={11}
        shadow-camera-bottom={-11}
      />

      {/* 3. Environment: Room, Bench, and Tables */}
      <Room />
      <Bench gavelStriking={gavelStriking} />
      <CounselTable />

      {/* 4. Judge (Presiding Bench) */}
      <Character
        role="judge"
        position={[0, 0.4, -5.1]}
        appearance={{
          skin: 0xc68a5e,
          coat: 0x16141f,
          hair: 0xb9b9c4,
          robe: true,
          glasses: true,
          stache: true
        }}
        state={judgeState}
        name={`Presiding Bench · ${judgePersona}`}
      />

      {/* 5. Petitioner Counsel (Left Desk) */}
      <Character
        role="petitioner"
        position={[-3, 0, 0.7]}
        rotation={[0, 1.03, 0]}
        appearance={{
          skin: 0xd9a06e,
          coat: 0x16141f,
          hair: 0x1b1b1b
        }}
        state={petitionerState}
        name={petitionerName}
      />

      {/* 6. Respondent Counsel (Right Desk, ghosted when awaiting connection) */}
      <Character
        role="respondent"
        position={[3, 0, 0.7]}
        rotation={[0, -1.03, 0]}
        appearance={{
          skin: 0xb87a52,
          coat: 0x16141f,
          hair: 0x2a1d17,
          long: true
        }}
        state={respondentState}
        ghosted={respondentGhosted}
        name={respondentGhosted ? 'Awaiting respondent…' : respondentName}
      />

      {/* 7. Gallery Audience (18 Seated Spectators) */}
      <Audience />

      {/* 8. Extra rigs or controls (CameraRig, SpeakerSpotlight) */}
      {children}
    </Canvas>
  );
}

