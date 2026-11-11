import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Judicial Bench:
 * - Elevated mahogany bench platform
 * - Front modesty panel with brass nameplate
 * - Gavel resting on sound block (with striking animation)
 */
export function Bench({ gavelStriking = false }) {
  const hammerRef = useRef();
  const strikeTimer = useRef(0);

  // Trigger strike animation when gavelStriking prop toggles or stays active
  useFrame((_, delta) => {
    if (gavelStriking && strikeTimer.current <= 0) {
      strikeTimer.current = 0.8;
    }

    if (strikeTimer.current > 0) {
      strikeTimer.current = Math.max(0, strikeTimer.current - delta);
      if (hammerRef.current) {
        hammerRef.current.rotation.x = -Math.abs(Math.sin(strikeTimer.current * 9)) * 0.9;
      }
    } else if (hammerRef.current && hammerRef.current.rotation.x !== 0) {
      hammerRef.current.rotation.x = 0;
    }
  });

  return (
    <group>
      {/* 1. Raised Wooden Platform */}
      <mesh position={[0, 0.2, -5.2]} castShadow receiveShadow>
        <boxGeometry args={[6, 0.4, 2.6]} />
        <meshStandardMaterial color={0x5b3a22} roughness={0.85} />
      </mesh>

      {/* 2. Main Judicial Bench Desk */}
      <mesh position={[0, 0.95, -4.4]} castShadow receiveShadow>
        <boxGeometry args={[4.6, 1.1, 1]} />
        <meshStandardMaterial color={0x6b4226} roughness={0.85} />
      </mesh>

      {/* Desk Top Bevel / Lip */}
      <mesh position={[0, 1.55, -4.4]} castShadow receiveShadow>
        <boxGeometry args={[4.8, 0.1, 1.2]} />
        <meshStandardMaterial color={0xa06a3c} roughness={0.85} />
      </mesh>

      {/* 3. Front Brass Judicial Nameplate */}
      <mesh position={[0, 1.0, -3.88]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.28, 0.05]} />
        <meshStandardMaterial color={0xd6b46a} metalness={0.5} roughness={0.4} />
      </mesh>

      {/* 4. Gavel on Sound Block */}
      <group position={[1.6, 1.6, -4.2]}>
        {/* Dark Hardwood Sound Block */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.4, 0.12, 0.4]} />
          <meshStandardMaterial color={0x3d2415} roughness={0.7} />
        </mesh>

        {/* Gavel Hammer with Pivot */}
        <group ref={hammerRef}>
          {/* Wood Handle */}
          <mesh position={[0, 0.25, 0]} castShadow>
            <boxGeometry args={[0.06, 0.5, 0.06]} />
            <meshStandardMaterial color={0xc79a52} roughness={0.6} />
          </mesh>
          {/* Brass Hammer Head */}
          <mesh position={[0, 0.55, 0]} castShadow>
            <boxGeometry args={[0.22, 0.14, 0.14]} />
            <meshStandardMaterial color={0xd6b46a} metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

