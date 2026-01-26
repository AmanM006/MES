"use client";
import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

// 1. Allow inputs so we can have multiple different graphs
interface CandleBackgroundProps {
  position?: [number, number, number];
  scale?: [number, number, number];
  seed?: number; // Makes the random pattern different
}

export function CandleBackground({ 
  position = [0, 0, -10], 
  scale = [1, 1, 1],
  seed = 1 
}: CandleBackgroundProps) {
  const group = useRef<THREE.Group>(null);
  const bodyMesh = useRef<THREE.InstancedMesh>(null);
  const wickMesh = useRef<THREE.InstancedMesh>(null);

  const candleCount = 30; 

  // Helper for seeded random numbers
  const seededRandom = (s: number) => {
    const x = Math.sin(s++) * 10000;
    return x - Math.floor(x);
  };

  // 2. GENERATE CHART DATA (Using seed)
  const data = useMemo(() => {
    let currentPrice = 0;
    const candles = [];
    let currentSeed = seed; // Start with supplied seed

    for (let i = 0; i < candleCount; i++) {
      const r1 = seededRandom(currentSeed++);
      const r2 = seededRandom(currentSeed++);
      const r3 = seededRandom(currentSeed++);

      // Bigger moves for more dramatic look
      const move = (r1 - 0.5) * 6; 
      const open = currentPrice;
      const close = currentPrice + move;
      
      const high = Math.max(open, close) + r2 * 2;
      const low = Math.min(open, close) - r3 * 2;

      const isGreen = close > open;
      
      candles.push({
        x: (i - candleCount / 2) * 2.5, 
        open, close, high, low, isGreen,
      });

      currentPrice = close;
    }
    return candles;
  }, [seed]);

  const greenColor = new THREE.Color("#00ff00");
  const redColor = new THREE.Color("#ff0000");
  const dummy = new THREE.Object3D();

  // 3. BUILD THE MESHES
  useEffect(() => {
    if (!bodyMesh.current || !wickMesh.current) return;

    data.forEach((d, i) => {
      const color = d.isGreen ? greenColor : redColor;

      // Body
      const bodyHeight = Math.max(0.2, Math.abs(d.open - d.close));
      const bodyY = (d.open + d.close) / 2;
      dummy.position.set(d.x, bodyY, 0);
      dummy.scale.set(1.5, bodyHeight, 1); 
      dummy.updateMatrix();
      bodyMesh.current!.setMatrixAt(i, dummy.matrix);
      bodyMesh.current!.setColorAt(i, color);

      // Wick
      const wickHeight = d.high - d.low;
      const wickY = (d.high + d.low) / 2;
      dummy.position.set(d.x, wickY, 0);
      dummy.scale.set(0.2, wickHeight, 0.2); 
      dummy.updateMatrix();
      wickMesh.current!.setMatrixAt(i, dummy.matrix);
      wickMesh.current!.setColorAt(i, color);
    });

    bodyMesh.current.instanceMatrix.needsUpdate = true;
    if (bodyMesh.current.instanceColor) bodyMesh.current.instanceColor.needsUpdate = true;
    wickMesh.current.instanceMatrix.needsUpdate = true;
    if (wickMesh.current.instanceColor) wickMesh.current.instanceColor.needsUpdate = true;

  }, [data]);

  // 4. PARALLAX SWAY
  useFrame((state) => {
    if (group.current) {
        const mouseX = state.mouse.x * 0.5;
        const mouseY = state.mouse.y * 0.5;
        group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, mouseX * 0.1, 0.1);
        group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -mouseY * 0.1, 0.1);
    }
  });

  return (
    // USE THE POSITION PROP HERE
    <group ref={group} position={position} scale={scale}> 
      <instancedMesh ref={bodyMesh} args={[undefined, undefined, candleCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      <instancedMesh ref={wickMesh} args={[undefined, undefined, candleCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  );
}