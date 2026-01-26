"use client";
import { useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";

interface TunnelBackgroundProps {
  scrollProgress: number;
}

export function TunnelBackground({ scrollProgress }: TunnelBackgroundProps) {
  const tunnel1Ref = useRef<THREE.Points>(null);
  const tunnel2Ref = useRef<THREE.Points>(null);

  // Create tunnel geometry with noise
  const { geometry, colors } = useMemo(() => {
    const radius = 5;
    const tubeLength = 100;
    const tubeGeo = new THREE.CylinderGeometry(
      radius, 
      radius, 
      tubeLength, 
      64,    // radial segments
      512,   // height segments  
      true   // open ended
    );

    const tubeVerts = tubeGeo.attributes.position;
    const colors: number[] = [];
    
    // Simple noise function
    const noise = (x: number, y: number, z: number) => {
      return Math.sin(x * 10) * Math.cos(y * 10) * Math.sin(z * 10);
    };

    const noiseFreq = 0.15;
    const noiseAmp = 0.8;
    const color = new THREE.Color();
    
    for (let i = 0; i < tubeVerts.count; i++) {
      const x = tubeVerts.getX(i);
      const y = tubeVerts.getY(i);
      const z = tubeVerts.getZ(i);
      
      // Apply noise to vertices
      const vertexNoise = noise(x * noiseFreq, y * noiseFreq, z * noiseFreq);
      const newX = x + x * vertexNoise * noiseAmp;
      const newZ = z + z * vertexNoise * noiseAmp;
      
      tubeVerts.setXYZ(i, newX, y, newZ);
      
      // Color based on position - yellow to orange to red gradient
      const colorNoise = noise(x * 0.02, y * 0.02, i * 0.0001);
      const hue = 0.08 + colorNoise * 0.1; // Orange/yellow range
      const sat = 0.9 + colorNoise * 0.1;
      const light = 0.4 + Math.abs(colorNoise) * 0.3;
      
      color.setHSL(hue, sat, light);
      colors.push(color.r, color.g, color.b);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", tubeVerts);
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

    return { geometry: geo, colors };
  }, []);

  useFrame((state) => {
    const speed = 0.3 * (1 + scrollProgress * 2);
    const rotationSpeed = 0.003 * (1 + scrollProgress);

    if (tunnel1Ref.current) {
      tunnel1Ref.current.position.z += speed;
      tunnel1Ref.current.rotation.y += rotationSpeed;
      
      // Reset position for infinite loop
      if (tunnel1Ref.current.position.z > 50) {
        tunnel1Ref.current.position.z = -50;
      }

      // Fade in based on scroll
      if (tunnel1Ref.current.material instanceof THREE.PointsMaterial) {
        tunnel1Ref.current.material.opacity = Math.min(scrollProgress * 3, 0.9);
      }
    }

    if (tunnel2Ref.current) {
      tunnel2Ref.current.position.z += speed;
      tunnel2Ref.current.rotation.y += rotationSpeed;
      
      // Reset position for infinite loop
      if (tunnel2Ref.current.position.z > 50) {
        tunnel2Ref.current.position.z = -50;
      }

      // Fade in based on scroll
      if (tunnel2Ref.current.material instanceof THREE.PointsMaterial) {
        tunnel2Ref.current.material.opacity = Math.min(scrollProgress * 3, 0.9);
      }
    }
  });

  // Material for points
  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }, []);

  return (
    <group>
      {/* First tunnel segment */}
      <points 
        ref={tunnel1Ref} 
        geometry={geometry} 
        material={material}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, -50]}
      />
      
      {/* Second tunnel segment for seamless loop */}
      <points 
        ref={tunnel2Ref} 
        geometry={geometry} 
        material={material.clone()}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, -150]}
      />
    </group>
  );
}