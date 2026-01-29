"use client";

import { EffectComposer, Bloom } from "@react-three/postprocessing";

export function BloomEffect() {
  return (
    <EffectComposer>
      <Bloom 
        intensity={0.5} 
        luminanceThreshold={0.9} 
        luminanceSmoothing={0.9}
      />
    </EffectComposer>
  );
}