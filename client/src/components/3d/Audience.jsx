import React, { useMemo } from 'react';
import { Character } from './Character.jsx';

/**
 * Audience Component:
 * - 2 staggered rows of low-poly courtroom spectators seated behind the wooden railing.
 * - Diverse procedural skin, suit colors, and hairstyles matching the prototype.
 */
export function Audience() {
  const skins = [0xd9a06e, 0xb87a52, 0xc68a5e, 0xe2b184];
  const coats = [0x2c3e66, 0x5a2a3a, 0x2f5a4a, 0x6a5a2a, 0x3a3a52];
  const hairs = [0x1b1b1b, 0x2a1d17, 0x3a2a1f, 0x101010, 0x5a3a22];

  const members = useMemo(() => {
    const list = [];
    for (let r = 0; r < 2; r++) {
      for (let k = -4; k <= 4; k++) {
        list.push({
          id: `aud-${r}-${k}`,
          position: [k * 0.95 + (r ? 0.45 : 0), 0, 5.2 + r * 1.7],
          appearance: {
            skin: skins[(k + r + 9) % 4],
            coat: coats[Math.abs(k * 3 + r + 9) % 5],
            hair: hairs[Math.abs(k + 9 + r * 2) % 5],
            lite: true,
            long: (k + r + 9) % 3 === 0
          }
        });
      }
    }
    return list;
  }, []);

  return (
    <group>
      {members.map((m) => (
        <Character
          key={m.id}
          role="audience"
          appearance={m.appearance}
          state="idle"
          position={m.position}
          rotation={[0, Math.PI, 0]}
          scale={0.95}
        />
      ))}
    </group>
  );
}

