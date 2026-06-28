"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useSpotStore } from "@/stores/spotStore";

export function Coastline() {
  const spotId = useSpotStore((s) => s.spot.id);

  // Generamos un terreno en base a noise procedural
  const { geometry, material, position } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(1000, 400, 100, 50);
    geo.rotateX(-Math.PI / 2); // Acostado en el piso

    const positions = geo.attributes.position.array;
    let color = new THREE.Color("#4a5d23"); // Verde por defecto (Tahití/Hawái)
    let mountainHeight = 1;
    let offset = [0, 0, -350] as [number, number, number];

    // Personalizar el terreno dependiendo del spot
    switch (spotId) {
      case "teahupoo":
        color.set("#2e5223"); // Jungla densa
        mountainHeight = 150;
        break;
      case "nazare":
        color.set("#5c5c5c"); // Rocas grises oscuras, acantilado
        mountainHeight = 100;
        offset = [-150, 0, -300]; 
        break;
      case "capo_mannu":
        color.set("#8b7355"); // Mediterráneo seco/terroso
        mountainHeight = 60;
        break;
      case "zicatela":
        color.set("#e3c16f"); // Arena y vegetación seca
        mountainHeight = 30; // Más plano
        break;
    }

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];
      
      // Combinar senos y cosenos para hacer montañas procedurales
      const n1 = Math.sin(x * 0.005) * Math.cos(z * 0.005) * 0.5 + 0.5;
      const n2 = Math.sin(x * 0.02 + z * 0.01) * 0.2;
      
      // Hacer que la elevación crezca hacia atrás
      const depthFactor = Math.min(1, Math.max(0, (z + 200) / -400));
      
      positions[i + 1] = (n1 + n2) * mountainHeight * depthFactor;
    }

    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true // Le da un look "low-poly" estilizado y corre muy rápido
    });

    return { geometry: geo, material: mat, position: offset };
  }, [spotId]);

  return (
    <mesh 
      geometry={geometry} 
      material={material} 
      position={position}
      receiveShadow 
    />
  );
}
