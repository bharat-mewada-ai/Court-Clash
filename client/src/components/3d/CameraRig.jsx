import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useCourtStore } from '../../store/courtStore.js';

/**
 * Enhanced Cinematic Camera Shots:
 * - wide: Immersive inside-the-chamber view (eye level, directly looking down the red carpet at the bench)
 * - overview: High overview showing whole room and gallery
 * - pet / petitioner: Close-up medium framing Petitioner Counsel at desk
 * - res / respondent: Close-up medium framing Respondent Counsel at desk
 * - j / judge: Majestic, authoritative low-angle framing the Presiding Judge & Ashoka Chakra
 * - petObj: Dynamic low hero-angle on Petitioner objecting with raised arm
 * - resObj: Dynamic low hero-angle on Respondent objecting with raised arm
 */
export const CAMERA_SHOTS = {
  wide: {
    pos: new THREE.Vector3(0, 2.15, 4.3),
    look: new THREE.Vector3(0, 1.85, -4.5),
    label: 'inside court'
  },
  inside: {
    pos: new THREE.Vector3(0, 2.15, 4.3),
    look: new THREE.Vector3(0, 1.85, -4.5),
    label: 'inside court'
  },
  overview: {
    pos: new THREE.Vector3(0, 3.6, 8.4),
    look: new THREE.Vector3(0, 1.7, -3.0),
    label: 'full chamber'
  },
  pet: {
    pos: new THREE.Vector3(-1.1, 1.6, 2.5),
    look: new THREE.Vector3(-3.0, 1.45, 0.7),
    label: 'petitioner'
  },
  petitioner: {
    pos: new THREE.Vector3(-1.1, 1.6, 2.5),
    look: new THREE.Vector3(-3.0, 1.45, 0.7),
    label: 'petitioner'
  },
  res: {
    pos: new THREE.Vector3(1.1, 1.6, 2.5),
    look: new THREE.Vector3(3.0, 1.45, 0.7),
    label: 'respondent'
  },
  respondent: {
    pos: new THREE.Vector3(1.1, 1.6, 2.5),
    look: new THREE.Vector3(3.0, 1.45, 0.7),
    label: 'respondent'
  },
  j: {
    pos: new THREE.Vector3(0, 2.1, -1.6),
    look: new THREE.Vector3(0, 2.05, -5.1),
    label: 'presiding judge'
  },
  judge: {
    pos: new THREE.Vector3(0, 2.1, -1.6),
    look: new THREE.Vector3(0, 2.05, -5.1),
    label: 'presiding judge'
  },
  petObj: {
    pos: new THREE.Vector3(-1.7, 1.35, 1.9),
    look: new THREE.Vector3(-3.0, 1.75, 0.7),
    label: 'petitioner objection'
  },
  petitionerObjection: {
    pos: new THREE.Vector3(-1.7, 1.35, 1.9),
    look: new THREE.Vector3(-3.0, 1.75, 0.7),
    label: 'petitioner objection'
  },
  resObj: {
    pos: new THREE.Vector3(1.7, 1.35, 1.9),
    look: new THREE.Vector3(3.0, 1.75, 0.7),
    label: 'respondent objection'
  },
  respondentObjection: {
    pos: new THREE.Vector3(1.7, 1.35, 1.9),
    look: new THREE.Vector3(3.0, 1.75, 0.7),
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

  const currentLookAt = useRef(new THREE.Vector3(0, 1.85, -4.5));
  const shakeIntensity = useRef(0);
  const mouse = useRef({ x: 0, y: 0 });

  // Mouse Parallax listener
  useEffect(() => {
    const handleMouseMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Trigger camera shake on objection
  useEffect(() => {
    if (objectionActive && !prefersReducedMotion) {
      shakeIntensity.current = 0.6;
    }
  }, [objectionActive, prefersReducedMotion]);

  useFrame((_, delta) => {
    const shot = CAMERA_SHOTS[cameraShot] || CAMERA_SHOTS.wide;
    const targetPos = shot.pos.clone();

    // Subtle gentle 3D parallax with mouse movement (bypassed if reduced motion)
    if (!prefersReducedMotion && (!cameraShot || cameraShot === 'wide' || cameraShot === 'inside')) {
      targetPos.x += mouse.current.x * 0.28;
      targetPos.y += -mouse.current.y * 0.16;
    }

    // Smooth Lerp Position & LookAt
    camera.position.lerp(targetPos, 0.05);
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
