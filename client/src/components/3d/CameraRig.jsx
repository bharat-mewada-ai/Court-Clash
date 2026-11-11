import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useCourtStore } from '../../store/courtStore.js';

/**
 * Named Camera Shots matching the prototype:
 * - wide: Full courtroom establishing view
 * - pet / petitioner: Close-up on petitioner desk
 * - res / respondent: Close-up on respondent desk
 * - j / judge: Close-up on presiding bench
 * - petObj / petitionerObjection: Dramatic low angle on petitioner objecting
 * - resObj / respondentObjection: Dramatic low angle on respondent objecting
 */
const CAMERA_SHOTS = {
  wide: {
    pos: new THREE.Vector3(0, 4.8, 11),
    look: new THREE.Vector3(0, 1.4, -1.5),
    label: 'wide'
  },
  pet: {
    pos: new THREE.Vector3(-0.7, 1.9, 2.5),
    look: new THREE.Vector3(-3, 1.55, 0.7),
    label: 'petitioner'
  },
  petitioner: {
    pos: new THREE.Vector3(-0.7, 1.9, 2.5),
    look: new THREE.Vector3(-3, 1.55, 0.7),
    label: 'petitioner'
  },
  res: {
    pos: new THREE.Vector3(0.7, 1.9, 2.5),
    look: new THREE.Vector3(3, 1.55, 0.7),
    label: 'respondent'
  },
  respondent: {
    pos: new THREE.Vector3(0.7, 1.9, 2.5),
    look: new THREE.Vector3(3, 1.55, 0.7),
    label: 'respondent'
  },
  j: {
    pos: new THREE.Vector3(0.9, 2.4, -1.3),
    look: new THREE.Vector3(0, 2, -5.1),
    label: 'judge'
  },
  judge: {
    pos: new THREE.Vector3(0.9, 2.4, -1.3),
    look: new THREE.Vector3(0, 2, -5.1),
    label: 'judge'
  },
  petObj: {
    pos: new THREE.Vector3(-1.6, 1.8, 2),
    look: new THREE.Vector3(-3, 1.8, 0.7),
    label: 'petitioner objection'
  },
  petitionerObjection: {
    pos: new THREE.Vector3(-1.6, 1.8, 2),
    look: new THREE.Vector3(-3, 1.8, 0.7),
    label: 'petitioner objection'
  },
  resObj: {
    pos: new THREE.Vector3(1.6, 1.8, 2),
    look: new THREE.Vector3(3, 1.8, 0.7),
    label: 'respondent objection'
  },
  respondentObjection: {
    pos: new THREE.Vector3(1.6, 1.8, 2),
    look: new THREE.Vector3(3, 1.8, 0.7),
    label: 'respondent objection'
  }
};

export function CameraRig() {
  const { camera } = useThree();
  const cameraShot = useCourtStore((s) => s.cameraShot);
  const objectionActive = useCourtStore((s) => s.objectionActive);

  // Motion reduction check
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const currentLookAt = useRef(new THREE.Vector3(0, 1.4, -1.5));
  const shakeIntensity = useRef(0);

  // Trigger camera shake on objection
  useEffect(() => {
    if (objectionActive && !prefersReducedMotion) {
      shakeIntensity.current = 0.6;
    }
  }, [objectionActive, prefersReducedMotion]);

  useFrame((_, delta) => {
    const shot = CAMERA_SHOTS[cameraShot] || CAMERA_SHOTS.wide;

    // Smooth Lerp Position & LookAt
    camera.position.lerp(shot.pos, 0.045);
    currentLookAt.current.lerp(shot.look, 0.07);

    // Apply procedural objection shake if active
    if (shakeIntensity.current > 0 && !prefersReducedMotion) {
      shakeIntensity.current = Math.max(0, shakeIntensity.current - delta);
      const shakeFactor = shakeIntensity.current * 0.08 * 2;
      camera.position.x += (Math.random() - 0.5) * shakeFactor;
      camera.position.y += (Math.random() - 0.5) * shakeFactor;
    }

    camera.lookAt(currentLookAt.current);
  });

  return null;
}
