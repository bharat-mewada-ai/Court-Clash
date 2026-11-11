import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Courtroom Room:
 * - Wood plank floor with floor plank line separators
 * - Central burgundy runner carpet
 * - Cream walls with mahogany wainscoting
 * - Spinning brass Ashoka/Judicial Chakra Emblem on back wall
 */
export function Room() {
  const emblemRef = useRef();

  useFrame((_, delta) => {
    if (emblemRef.current) {
      emblemRef.current.rotation.z += delta * 0.15;
    }
  });

  // 17 plank divider lines across the floor (from -8 to 8)
  const plankIndices = Array.from({ length: 17 }, (_, i) => i - 8);

  // 12 spokes for the emblem
  const spokeIndices = Array.from({ length: 12 }, (_, i) => i);

  return (
    <group>
      {/* 1. Main Wood Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 22]} />
        <meshStandardMaterial color={0x7a5233} roughness={0.85} />
      </mesh>

      {/* Floor Plank Groove Lines */}
      {plankIndices.map((i) => (
        <mesh key={i} position={[i * 1.1, 0.006, 0]} receiveShadow>
          <boxGeometry args={[0.04, 0.01, 22]} />
          <meshStandardMaterial color={0x5f3d22} roughness={0.85} />
        </mesh>
      ))}

      {/* 2. Central Burgundy Carpet */}
      <mesh position={[0, 0.012, 1]} receiveShadow>
        <boxGeometry args={[2.2, 0.02, 13]} />
        <meshStandardMaterial color={0x7a1f2b} roughness={0.85} />
      </mesh>

      {/* 3. Back Wall (Cream plaster + lower mahogany wainscoting) */}
      <mesh position={[0, 4, -6.6]} receiveShadow>
        <boxGeometry args={[18, 8, 0.3]} />
        <meshStandardMaterial color={0xd9c9a3} roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.1, -6.45]} receiveShadow>
        <boxGeometry args={[18, 2.2, 0.4]} />
        <meshStandardMaterial color={0x5b3a22} roughness={0.85} />
      </mesh>

      {/* 4. Left and Right Walls */}
      <mesh position={[-9, 4, 0]} receiveShadow>
        <boxGeometry args={[0.3, 8, 22]} />
        <meshStandardMaterial color={0xd9c9a3} roughness={0.85} />
      </mesh>
      <mesh position={[9, 4, 0]} receiveShadow>
        <boxGeometry args={[0.3, 8, 22]} />
        <meshStandardMaterial color={0xd9c9a3} roughness={0.85} />
      </mesh>

      {/* 5. Spinning Brass Judicial Chakra Emblem */}
      <group ref={emblemRef} position={[0, 4.7, -6.4]}>
        {/* Outer Torus Ring */}
        <mesh>
          <torusGeometry args={[0.7, 0.06, 8, 32]} />
          <meshStandardMaterial color={0xd6b46a} metalness={0.5} roughness={0.4} />
        </mesh>
        {/* 12 Spokes */}
        {spokeIndices.map((idx) => (
          <mesh key={idx} rotation={[0, 0, (idx * Math.PI) / 12]}>
            <boxGeometry args={[0.04, 1.2, 0.04]} />
            <meshStandardMaterial color={0xd6b46a} metalness={0.5} roughness={0.4} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
