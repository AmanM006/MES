"use client";

import { Sparkles, Environment } from "@react-three/drei";

interface SceneProps {
  scrollProgress: number;
}

export function Scene({ scrollProgress }: SceneProps) {
  return (
    <>
      {/* LIGHTING */}
      <ambientLight intensity={0.9} />
      <directionalLight position={[0, 5, 5]} intensity={2} />
      <directionalLight position={[0, 5, -5]} intensity={1.2} />

      {/* HERO SPARKLES - Visible only at start */}
      {scrollProgress < 0.15 && (
        <Sparkles count={250} scale={[40, 40, 20]} size={2} color="#ffffff" />
      )}

      {/* NO MODEL HERE - We render FallingMan in the parent component */}
      
      <Environment preset="city" />
    </>
  );
}