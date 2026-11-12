import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

/**
 * Character Component
 *
 * Props:
 * - role: 'judge' | 'petitioner' | 'respondent' | 'audience'
 * - appearance: { skin, coat, hair, long, glasses, stache, robe, lite }
 * - state: 'idle' | 'talking' | 'objecting' | 'listening'
 * - ghosted: boolean (e.g. respondent awaiting connection)
 * - name: string (label displayed above character)
 * - position: [x, y, z]
 * - rotation: [x, y, z] or number (y rotation)
 * - scale: number or [x, y, z]
 */
export function Character({
  role = 'petitioner',
  appearance = {},
  state = 'idle',
  ghosted = false,
  name = '',
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1
}) {
  const groupRef = useRef();
  const bodyRef = useRef();
  const headRef = useRef();
  const mouthRef = useRef();
  const armRightRef = useRef();
  const armLeftRef = useRef();

  const {
    skin = 0xd9a06e,
    coat = 0x16141f,
    hair = 0x1b1b1b,
    long = false,
    glasses = false,
    stache = false,
    robe = role === 'judge',
    lite = role === 'audience'
  } = appearance;

  const isJudge = role === 'judge';
  const isTalking = state === 'talking';
  const isObjecting = state === 'objecting';

  // Base Y offset for judge (elevated chair) vs standing advocate
  const baseY = position[1] ?? (isJudge ? 0.4 : 0);

  // Material opacity settings for ghosting
  const opacity = ghosted ? 0.25 : 1.0;
  const transparent = ghosted;

  // Animation loop matching reference prototype physics
  useFrame((stateObj) => {
    const t = stateObj.clock.elapsedTime;

    // 1. Mouth Flap animation during speech
    if (mouthRef.current) {
      const targetMouthY = isTalking ? 0.5 + Math.abs(Math.sin(t * 18)) * 2.2 : 1.0;
      mouthRef.current.scale.y += (targetMouthY - mouthRef.current.scale.y) * 0.4;
    }

    // 2. Head Tilt & Rotation
    if (headRef.current) {
      headRef.current.rotation.x = isTalking ? Math.sin(t * 6) * 0.06 : 0;
      headRef.current.rotation.y = isTalking ? Math.sin(t * 2.5) * 0.12 : 0;
    }

    // 3. Body Breathing & Elevation on Objection
    if (groupRef.current) {
      const upOffset = isObjecting ? 0.28 : 0;
      groupRef.current.position.y += (baseY + upOffset - groupRef.current.position.y) * 0.15;
    }

    if (bodyRef.current) {
      bodyRef.current.scale.y = 1 + Math.sin(t * 1.8 + (isJudge ? 1 : 0)) * 0.008;
    }

    // 4. Arm Gestures: Rest = -0.9, Talking Gesture = -1.1 + sin, Objection = -2.9 (Arm Raised High)
    if (armRightRef.current) {
      const targetArmX = isObjecting ? -2.9 : isTalking ? -1.1 + Math.sin(t * 4) * 0.35 : -0.9;
      armRightRef.current.rotation.x += (targetArmX - armRightRef.current.rotation.x) * 0.18;
    }

    if (armLeftRef.current && isObjecting) {
      armLeftRef.current.rotation.x += (-2.9 - armLeftRef.current.rotation.x) * 0.18;
    }
  });

  const rotY = typeof rotation === 'number' ? rotation : rotation[1] || 0;

  return (
    <group
      ref={groupRef}
      position={[position[0], baseY, position[2]]}
      rotation={[0, rotY, 0]}
      scale={scale}
    >
      <group ref={bodyRef}>
        {/* Torso */}
        <mesh position={[0, 1.02, 0]} castShadow={!lite}>
          <cylinderGeometry args={[0.27, 0.36, 0.8, 20]} />
          <meshStandardMaterial color={coat} roughness={0.85} transparent={transparent} opacity={opacity} />
        </mesh>

        {/* Shoulders */}
        <mesh position={[0, 1.42, 0]} scale={[1.15, 0.55, 0.8]} castShadow={!lite}>
          <sphereGeometry args={[0.3, 18, 12]} />
          <meshStandardMaterial color={coat} roughness={0.85} transparent={transparent} opacity={opacity} />
        </mesh>

        {/* Shoulder Caps */}
        {[-0.36, 0.36].map((x) => (
          <mesh key={x} position={[x, 1.42, 0]} castShadow={!lite}>
            <sphereGeometry args={[0.1, 12, 10]} />
            <meshStandardMaterial color={coat} roughness={0.85} transparent={transparent} opacity={opacity} />
          </mesh>
        ))}

        {/* Robe (Judge) vs Advocate Suit (Petitioner/Respondent) */}
        {robe ? (
          <>
            {/* Judicial Robe Lower Flare */}
            <mesh position={[0, 0.62, 0]} castShadow={!lite}>
              <cylinderGeometry args={[0.36, 0.5, 0.5, 20]} />
              <meshStandardMaterial color={coat} roughness={0.85} transparent={transparent} opacity={opacity} />
            </mesh>
            {/* Judicial Red Sash */}
            <mesh position={[0, 1, 0.34]} castShadow={!lite}>
              <boxGeometry args={[0.16, 0.9, 0.03]} />
              <meshStandardMaterial color={0x8a1f2e} roughness={0.85} transparent={transparent} opacity={opacity} />
            </mesh>
            {/* Gold Borders */}
            <mesh position={[-0.1, 1, 0.345]} castShadow={!lite}>
              <boxGeometry args={[0.035, 0.9, 0.035]} />
              <meshStandardMaterial color={0xd6b46a} metalness={0.5} roughness={0.4} transparent={transparent} opacity={opacity} />
            </mesh>
            <mesh position={[0.1, 1, 0.345]} castShadow={!lite}>
              <boxGeometry args={[0.035, 0.9, 0.035]} />
              <meshStandardMaterial color={0xd6b46a} metalness={0.5} roughness={0.4} transparent={transparent} opacity={opacity} />
            </mesh>
          </>
        ) : (
          <>
            {/* White Advocate Shirt Inset */}
            <mesh position={[0, 1.22, 0.31]} castShadow={!lite}>
              <boxGeometry args={[0.2, 0.42, 0.03]} />
              <meshStandardMaterial color={0xf5f1e6} roughness={0.85} transparent={transparent} opacity={opacity} />
            </mesh>
            {/* Coat Lapels */}
            <mesh position={[-0.13, 1.22, 0.335]} rotation={[0, 0, -0.25]} castShadow={!lite}>
              <boxGeometry args={[0.09, 0.4, 0.03]} />
              <meshStandardMaterial color={coat} roughness={0.85} transparent={transparent} opacity={opacity} />
            </mesh>
            <mesh position={[0.13, 1.22, 0.335]} rotation={[0, 0, 0.25]} castShadow={!lite}>
              <boxGeometry args={[0.09, 0.4, 0.03]} />
              <meshStandardMaterial color={coat} roughness={0.85} transparent={transparent} opacity={opacity} />
            </mesh>
            {/* Advocate White Neck Bands / Tabs */}
            <mesh position={[-0.035, 1.28, 0.36]} castShadow={!lite}>
              <boxGeometry args={[0.05, 0.2, 0.02]} />
              <meshStandardMaterial color={0xffffff} roughness={0.7} transparent={transparent} opacity={opacity} />
            </mesh>
            <mesh position={[0.035, 1.28, 0.36]} castShadow={!lite}>
              <boxGeometry args={[0.05, 0.2, 0.02]} />
              <meshStandardMaterial color={0xffffff} roughness={0.7} transparent={transparent} opacity={opacity} />
            </mesh>
          </>
        )}

        {/* Neck */}
        <mesh position={[0, 1.54, 0]} castShadow={!lite}>
          <cylinderGeometry args={[0.08, 0.09, 0.16, 10]} />
          <meshStandardMaterial color={skin} roughness={0.55} transparent={transparent} opacity={opacity} />
        </mesh>

        {/* White Collar */}
        <mesh position={[0, 1.49, 0]} castShadow={!lite}>
          <cylinderGeometry args={[0.115, 0.12, 0.05, 14]} />
          <meshStandardMaterial color={0xf5f1e6} roughness={0.85} transparent={transparent} opacity={opacity} />
        </mesh>

        {/* Pants & Shoes (if not judge robe and not audience lite) */}
        {!lite && !robe && (
          <>
            {[-0.12, 0.12].map((x) => (
              <group key={x}>
                {/* Dark Trousers */}
                <mesh position={[x, 0.35, 0]} castShadow>
                  <cylinderGeometry args={[0.1, 0.09, 0.7, 10]} />
                  <meshStandardMaterial color={0x1c1a26} roughness={0.85} transparent={transparent} opacity={opacity} />
                </mesh>
                {/* Formal Shoes */}
                <mesh position={[x, 0.03, 0.05]} castShadow>
                  <boxGeometry args={[0.14, 0.07, 0.24]} />
                  <meshStandardMaterial color={0x0e0d14} roughness={0.6} transparent={transparent} opacity={opacity} />
                </mesh>
              </group>
            ))}
          </>
        )}

        {/* Head Group */}
        <group ref={headRef} position={[0, 1.72, 0]}>
          {/* Face Sphere */}
          <mesh scale={[0.95, 1.08, 1]} castShadow={!lite}>
            <sphereGeometry args={[0.22, 24, 18]} />
            <meshStandardMaterial color={skin} roughness={0.55} transparent={transparent} opacity={opacity} />
          </mesh>

          {/* Hair Cap */}
          <mesh position={[0, 0.02, -0.012]} rotation={[-0.5, 0, 0]} castShadow={!lite}>
            <sphereGeometry args={[0.238, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
            <meshStandardMaterial color={hair} roughness={0.9} transparent={transparent} opacity={opacity} />
          </mesh>

          {/* Hair Back Style (Long vs Short) */}
          {long ? (
            <mesh position={[0, -0.14, -0.09]} scale={[1, 1.6, 0.7]} castShadow={!lite}>
              <sphereGeometry args={[0.25, 16, 12]} />
              <meshStandardMaterial color={hair} roughness={0.9} transparent={transparent} opacity={opacity} />
            </mesh>
          ) : (
            <mesh position={[0, 0, -0.07]} scale={[1, 0.9, 0.7]} castShadow={!lite}>
              <sphereGeometry args={[0.2, 14, 10]} />
              <meshStandardMaterial color={hair} roughness={0.9} transparent={transparent} opacity={opacity} />
            </mesh>
          )}

          {/* Mouth (Animates when talking) */}
          <mesh ref={mouthRef} position={[0, -0.095, 0.2]} scale={[1.2, 0.35, 0.5]}>
            <sphereGeometry args={[0.045, 10, 8]} />
            <meshStandardMaterial color={0x7a2f35} roughness={0.85} transparent={transparent} opacity={opacity} />
          </mesh>

          {/* Nose */}
          <mesh position={[0, -0.02, 0.215]} scale={[1, 1.2, 1]}>
            <sphereGeometry args={[0.035, 10, 8]} />
            <meshStandardMaterial color={skin} roughness={0.55} transparent={transparent} opacity={opacity} />
          </mesh>

          {/* Eyes & Eyebrows */}
          {[-0.08, 0.08].map((x) => (
            <group key={x}>
              {/* White Sclera */}
              <mesh position={[x, 0.04, 0.185]}>
                <sphereGeometry args={[0.04, 12, 10]} />
                <meshStandardMaterial color={0xffffff} roughness={0.5} transparent={transparent} opacity={opacity} />
              </mesh>
              {/* Dark Pupil */}
              <mesh position={[x, 0.04, 0.218]}>
                <sphereGeometry args={[0.024, 10, 8]} />
                <meshStandardMaterial color={0x1a1a1a} roughness={0.4} transparent={transparent} opacity={opacity} />
              </mesh>
              {/* Eyebrow */}
              {!lite && (
                <mesh position={[x, 0.105, 0.195]} rotation={[0, 0, x < 0 ? 0.12 : -0.12]}>
                  <boxGeometry args={[0.07, 0.016, 0.02]} />
                  <meshStandardMaterial color={hair} roughness={0.9} transparent={transparent} opacity={opacity} />
                </mesh>
              )}
              {/* Ears */}
              {!lite && (
                <mesh position={[x * 2.6, 0, 0]} scale={[0.5, 1, 0.8]}>
                  <sphereGeometry args={[0.04, 8, 8]} />
                  <meshStandardMaterial color={skin} roughness={0.55} transparent={transparent} opacity={opacity} />
                </mesh>
              )}
            </group>
          ))}

          {/* Glasses */}
          {glasses && (
            <>
              {[-0.08, 0.08].map((x) => (
                <mesh key={x} position={[x, 0.04, 0.222]}>
                  <torusGeometry args={[0.05, 0.008, 6, 16]} />
                  <meshStandardMaterial color={0x222222} roughness={0.5} transparent={transparent} opacity={opacity} />
                </mesh>
              ))}
            </>
          )}

          {/* Mustache */}
          {stache && (
            <mesh position={[0, -0.06, 0.213]}>
              <boxGeometry args={[0.11, 0.02, 0.02]} />
              <meshStandardMaterial color={hair} roughness={0.9} transparent={transparent} opacity={opacity} />
            </mesh>
          )}
        </group>

        {/* Right Arm (Gestures during speech / raised on objection) */}
        <group ref={armRightRef} position={[0.4, 1.4, 0]} rotation={[-0.9, 0, 0]}>
          {/* Upper Arm */}
          <mesh position={[0, -0.17, 0]} castShadow={!lite}>
            <cylinderGeometry args={[0.075, 0.065, 0.34, 10]} />
            <meshStandardMaterial color={coat} roughness={0.85} transparent={transparent} opacity={opacity} />
          </mesh>
          {/* Forearm Pivot */}
          <group position={[0, -0.34, 0]} rotation={[-0.25, 0, 0]}>
            <mesh position={[0, -0.15, 0]} castShadow={!lite}>
              <cylinderGeometry args={[0.062, 0.055, 0.3, 10]} />
              <meshStandardMaterial color={coat} roughness={0.85} transparent={transparent} opacity={opacity} />
            </mesh>
            {/* White Shirt Cuff */}
            {!lite && (
              <mesh position={[0, -0.29, 0]} castShadow={!lite}>
                <cylinderGeometry args={[0.058, 0.058, 0.04, 10]} />
                <meshStandardMaterial color={0xf5f1e6} roughness={0.85} transparent={transparent} opacity={opacity} />
              </mesh>
            )}
            {/* Hand */}
            <mesh position={[0, -0.32, 0]} castShadow={!lite}>
              <sphereGeometry args={[0.058, 10, 8]} />
              <meshStandardMaterial color={skin} roughness={0.55} transparent={transparent} opacity={opacity} />
            </mesh>
          </group>
        </group>

        {/* Left Arm */}
        <group ref={armLeftRef} position={[-0.4, 1.4, 0]} rotation={[-0.9, 0, 0]}>
          <mesh position={[0, -0.17, 0]} castShadow={!lite}>
            <cylinderGeometry args={[0.075, 0.065, 0.34, 10]} />
            <meshStandardMaterial color={coat} roughness={0.85} transparent={transparent} opacity={opacity} />
          </mesh>
          <group position={[0, -0.34, 0]} rotation={[-0.25, 0, 0]}>
            <mesh position={[0, -0.15, 0]} castShadow={!lite}>
              <cylinderGeometry args={[0.062, 0.055, 0.3, 10]} />
              <meshStandardMaterial color={coat} roughness={0.85} transparent={transparent} opacity={opacity} />
            </mesh>
            {!lite && (
              <mesh position={[0, -0.29, 0]} castShadow={!lite}>
                <cylinderGeometry args={[0.058, 0.058, 0.04, 10]} />
                <meshStandardMaterial color={0xf5f1e6} roughness={0.85} transparent={transparent} opacity={opacity} />
              </mesh>
            )}
            <mesh position={[0, -0.32, 0]} castShadow={!lite}>
              <sphereGeometry args={[0.058, 10, 8]} />
              <meshStandardMaterial color={skin} roughness={0.55} transparent={transparent} opacity={opacity} />
            </mesh>
          </group>
        </group>
      </group>

      {/* Overhead Name Label Badge (Zero-suspension HTML billboard) */}
      {name && (
        <Html center position={[0, 2.35, 0]} distanceFactor={12} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              background: 'rgba(20, 17, 46, 0.88)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '999px',
              padding: '3px 12px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#ffffff',
              whiteSpace: 'nowrap',
              fontFamily: '"Baloo 2", system-ui, sans-serif',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
              userSelect: 'none'
            }}
          >
            {name}
          </div>
        </Html>
      )}
    </group>
  );
}

