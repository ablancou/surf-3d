"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { boardVisualState } from "@/lib/game/boardVisualState";

const SKIN_COLOR = "#f5cfa0";
const WETSUIT_COLOR = "#1a1a1a";
const BOARDSHORTS_COLOR = "#ef4444";

export function SurferCharacter() {
  const groupRef = useRef<THREE.Group>(null);
  
  // Referencias a los huesos/partes para animación procedural
  const torsoRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  const materials = useMemo(() => ({
    skin: new THREE.MeshStandardMaterial({ color: SKIN_COLOR, roughness: 0.6 }),
    wetsuit: new THREE.MeshStandardMaterial({ color: WETSUIT_COLOR, roughness: 0.8 }),
    shorts: new THREE.MeshStandardMaterial({ color: BOARDSHORTS_COLOR, roughness: 0.9 })
  }), []);

  useFrame(() => {
    if (!groupRef.current || !torsoRef.current || !headRef.current || 
        !leftLegRef.current || !rightLegRef.current || 
        !leftArmRef.current || !rightArmRef.current) return;

    const { speed, tiltX, inTube, airborne, airTime, verticalVelocity } = boardVisualState;
    
    // Cálculos de cinemática inversa falsos (Procedural Animation)
    // El centro de gravedad baja con la velocidad o al estar en el tubo
    const speedFactor = Math.min(speed / 20, 1);
    const crouchAmount = inTube ? 0.8 : 0.2 + (speedFactor * 0.4) + (Math.abs(tiltX) * 0.3);
    
    // Altura del torso
    torsoRef.current.position.y = 0.6 - (crouchAmount * 0.3);
    
    // Inclinación del torso hacia adelante
    torsoRef.current.rotation.x = crouchAmount * 0.8;
    // Inclinación lateral en giros
    torsoRef.current.rotation.z = -tiltX * 0.5;

    // Cabeza siempre mirando hacia adelante/arriba
    headRef.current.rotation.x = -torsoRef.current.rotation.x + (inTube ? 0.2 : -0.1);

    // Flexión de piernas
    leftLegRef.current.rotation.x = -crouchAmount * 0.6;
    rightLegRef.current.rotation.x = -crouchAmount * 0.7;

    // Brazos para equilibrio
    if (airborne) {
      // Grab aéreo o compactarse
      leftArmRef.current.rotation.z = 1.5; // Brazo extendido o agarrando la tabla
      leftArmRef.current.rotation.x = 0.5;
      rightArmRef.current.rotation.z = -2.5; // Brazo arriba para balance
      torsoRef.current.position.y = 0.4 + (Math.sin(airTime * Math.PI) * 0.2); // Compactar en el aire
      
      // Simulación visual del Grab (Air Grab)
      if (airTime > 0.3) {
        torsoRef.current.rotation.x = 1.2; // Muy agachado
        rightArmRef.current.rotation.x = 1.5; // Mano toca la tabla
      }
    } else if (inTube) {
      // Arrastrar la mano trasera o delantera en el tubo
      leftArmRef.current.rotation.z = 1.8; // Brazo delantero guiando
      leftArmRef.current.rotation.x = -0.5; // Hacia adelante tocando la pared
      rightArmRef.current.rotation.z = -0.5; // Brazo trasero recogido
    } else {
      // Surf normal
      leftArmRef.current.rotation.z = 1.2 + (tiltX * 0.5);
      leftArmRef.current.rotation.x = 0;
      rightArmRef.current.rotation.z = -1.2 + (tiltX * 0.5);
      rightArmRef.current.rotation.x = 0;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.05, 0.1]} rotation={[0, Math.PI / 2 + 0.3, 0]}>
      {/* Pierna Izquierda (Adelante) */}
      <group ref={leftLegRef} position={[-0.3, 0, 0]}>
        <mesh position={[0, 0.2, 0]} material={materials.wetsuit} castShadow>
          <cylinderGeometry args={[0.04, 0.03, 0.4]} />
        </mesh>
      </group>
      
      {/* Pierna Derecha (Atrás) */}
      <group ref={rightLegRef} position={[0.3, 0, 0]}>
        <mesh position={[0, 0.2, 0]} material={materials.wetsuit} castShadow>
          <cylinderGeometry args={[0.04, 0.03, 0.4]} />
        </mesh>
      </group>

      {/* Torso */}
      <group ref={torsoRef} position={[0, 0.6, 0]}>
        <mesh position={[0, 0.15, 0]} material={materials.wetsuit} castShadow>
          <boxGeometry args={[0.25, 0.35, 0.12]} />
        </mesh>
        <mesh position={[0, -0.1, 0]} material={materials.shorts} castShadow>
          <boxGeometry args={[0.26, 0.15, 0.13]} />
        </mesh>

        {/* Cabeza */}
        <group ref={headRef} position={[0, 0.35, 0]}>
          <mesh material={materials.skin} castShadow>
            <sphereGeometry args={[0.08]} />
          </mesh>
        </group>

        {/* Brazo Izquierdo */}
        <group ref={leftArmRef} position={[-0.15, 0.25, 0]}>
          <mesh position={[-0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.wetsuit} castShadow>
            <cylinderGeometry args={[0.03, 0.02, 0.3]} />
          </mesh>
        </group>

        {/* Brazo Derecho */}
        <group ref={rightArmRef} position={[0.15, 0.25, 0]}>
          <mesh position={[0.15, 0, 0]} rotation={[0, 0, -Math.PI / 2]} material={materials.wetsuit} castShadow>
            <cylinderGeometry args={[0.03, 0.02, 0.3]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
