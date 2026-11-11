import React from 'react';

/**
 * Counsel Tables (Petitioner & Respondent) and Audience Wooden Bar Rail.
 */
export function CounselTable() {
  const tablePositions = [-3, 3];

  return (
    <group>
      {/* 1. Counsel Tables for Petitioner (-3) and Respondent (+3) */}
      {tablePositions.map((x) => (
        <group key={x}>
          {/* Table Base */}
          <mesh position={[x, 0.45, 1.6]} castShadow receiveShadow>
            <boxGeometry args={[2.8, 0.9, 1.1]} />
            <meshStandardMaterial color={0x6b4226} roughness={0.85} />
          </mesh>
          {/* Table Top Lip */}
          <mesh position={[x, 0.94, 1.6]} castShadow receiveShadow>
            <boxGeometry args={[3.0, 0.08, 1.3]} />
            <meshStandardMaterial color={0xa06a3c} roughness={0.85} />
          </mesh>
        </group>
      ))}

      {/* 2. Wooden Bar Railing dividing Court Well and Gallery */}
      <mesh position={[0, 0.45, 3.5]} castShadow receiveShadow>
        <boxGeometry args={[9.0, 0.9, 0.1]} />
        <meshStandardMaterial color={0x4a2e1b} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.94, 3.5]} castShadow receiveShadow>
        <boxGeometry args={[9.2, 0.08, 0.2]} />
        <meshStandardMaterial color={0xa06a3c} roughness={0.85} />
      </mesh>
    </group>
  );
}

