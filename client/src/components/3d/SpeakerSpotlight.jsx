import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCourtStore } from '../../store/courtStore.js';

/**
 * SpeakerSpotlight:
 * Smoothly pans and illuminates the character currently taking the floor
 * (Petitioner, Respondent, or Presiding Judge).
 */
export function SpeakerSpotlight() {
  const spotlightRef = useRef();
  const targetRef = useRef();
  const speaker = useCourtStore((s) => s.speaker);

  const characterPositions = useMemo(
    () => ({
      pet: new THREE.Vector3(-3, 0, 0.7),
      res: new THREE.Vector3(3, 0, 0.7),
      j: new THREE.Vector3(0, 0.4, -5.1)
    }),
    []
  );

  useEffect(() => {
    if (spotlightRef.current && targetRef.current) {
      spotlightRef.current.target = targetRef.current;
    }
  }, []);

  useFrame(() => {
    if (!spotlightRef.current || !targetRef.current) return;

    const spPos = characterPositions[speaker];

    if (spPos) {
      // Pan spotlight target directly to speaker torso/head
      targetRef.current.position.set(spPos.x, 1.4, spPos.z);

      // Pan spotlight source smoothly above and forward of the speaker
      spotlightRef.current.position.set(spPos.x * 0.3, 7, spPos.z + 4);

      // Lerp intensity to warm 1.3
      spotlightRef.current.intensity += (1.3 - spotlightRef.current.intensity) * 0.1;
    } else {
      // Dim spotlight to 0 when no one is speaking
      spotlightRef.current.intensity += (0 - spotlightRef.current.intensity) * 0.1;
    }
  });

  return (
    <>
      {/* Invisible target anchor object */}
      <object3D ref={targetRef} position={[0, 1.4, 0]} />

      {/* Dynamic warm spotlight */}
      <spotLight
        ref={spotlightRef}
        color="#fff0c0"
        intensity={0}
        distance={16}
        angle={0.45}
        penumbra={0.6}
        position={[0, 7, 4]}
        castShadow
        shadow-bias={-0.0001}
      />
    </>
  );
}

