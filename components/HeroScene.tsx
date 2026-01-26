"use client";

import { Sparkles } from "@react-three/drei";

export function HeroScene() {
  return (
    <Sparkles
      count={200}
      scale={[40, 40, 20]}
      size={2}
      speed={0.3}
      opacity={0.6}
      color="#ffffff"
    />
  );
}
