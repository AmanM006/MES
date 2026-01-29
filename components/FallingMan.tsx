"use client";

import { useRef, useEffect, useState } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// --- MATERIAL FIXER ---
function fixMaterials(scene: THREE.Object3D) {
  scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;

      const name = mesh.name.toLowerCase();
      if (name.includes("sphere") || name.includes("circle") || name.includes("shape")) {
          mesh.visible = false;
          return;
      }

      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.side = THREE.DoubleSide;
        mat.transparent = false;
        mat.opacity = 1;
      }
    }
  });
}

interface FallingManProps {
  scrollProgress: number;
}

// --- FALLING MAN COMPONENT (Deep Dive Fix) ---
export function FallingMan({ scrollProgress }: FallingManProps) {
  const group = useRef<THREE.Group>(null);
  const [currentAction, setCurrentAction] = useState("idle");
  const [diveState, setDiveState] = useState({ active: false, velocity: 0 });

  const { scene, animations } = useGLTF("/models/BusinessmanFinal.glb?v=DIVE_FINAL");
  const { actions } = useAnimations(animations, group);

  // 1. SETUP
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.frustumCulled = false;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
           const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
           mat.transparent = false;
           mat.opacity = 1;
           mat.side = THREE.DoubleSide;
        }
      }
    });

    const idle = actions["idle"];
    if (idle) {
        Object.values(actions).forEach(a => a?.stop());
        idle.reset().play();
        idle.paused = false; 
    }
  }, [scene, actions]);

  // 2. SCROLL LOOP
  useFrame((state, delta) => {
    if (!group.current) return;

    const scrollPixels = window.scrollY;
    const wh = window.innerHeight; 

    // =========================================================
    // PHASE 1: IDLE (0vh -> 350vh)
    // =========================================================
    if (scrollPixels < wh * 3.5) {
      if (currentAction !== "idle") {
          setCurrentAction("idle");
          Object.values(actions).forEach(a => a?.stop());
          const idle = actions["idle"];
          if(idle) { idle.play(); idle.paused = false; }
          setDiveState({ active: false, velocity: 0 });
      }

      group.current.position.set(0, -3, 0); 
      group.current.rotation.set(0, 0, 0);
      group.current.scale.set(450, 450, 450); 
    }
    
    // =========================================================
    // PHASE 2: 4x FLIP & RETREAT (350vh -> 450vh)
    // =========================================================
    else if (scrollPixels < wh * 4.5) {
      if (currentAction !== "180flip") setCurrentAction("180flip");

      const start = wh * 3.5;
      const end = wh * 4.5;
      const progress = (scrollPixels - start) / (end - start);

      const action = actions["180flip"];
      if (action) {
          if (!action.isRunning()) {
              Object.values(actions).forEach(a => a !== action && a?.stop());
              action.play();
          }
          action.paused = true; 
          const duration = action.getClip().duration;
          
          // He spins 4 times (1440 degrees)
          action.time = (progress * duration * 4) % duration; 
      }

      // Orientation: Smoothly rotate to face backward (180 deg) by the end
      group.current.rotation.set(0, progress * Math.PI, 0);

      // Retreat: Move slightly back
      group.current.position.z = -2 * progress;
      group.current.position.y = -3;
      setDiveState({ active: false, velocity: 0 });
    }

    // =========================================================
    // PHASE 3: THE DIVE (450vh+)
    // =========================================================
    else {
      // Initialize Dive ONCE
      if (!diveState.active) {
          setCurrentAction("runtodive");
          setDiveState({ active: true, velocity: 0.1 }); 

          const dive = actions["runtodive"];
          if (dive) {
              Object.values(actions).forEach(a => a !== dive && a?.stop());
              dive.reset().setLoop(THREE.LoopOnce, 1).clampWhenFinished = true;
              dive.paused = false; 
              dive.play();
          }
      }

      // ACCELERATE
      const newVelocity = diveState.velocity * 1.05; // Gets faster every frame
      if (newVelocity < 3) setDiveState(prev => ({ ...prev, velocity: newVelocity }));

      // MOVE DEEP & DOWN
      // Z: Move away from camera
      group.current.position.z -= diveState.velocity;
      
      // Y: Move DOWN the screen (simulating falling into the next section)
      // Since the Tunnel is below, we must move Y negatively.
      group.current.position.y -= diveState.velocity * 0.5;

      // Lock rotation to face tunnel
      group.current.rotation.set(0, Math.PI, 0);
    }
  });

  return (
    <group ref={group} position={[0, -3, 0]}>
      <primitive object={scene} />
    </group>
  );
}
useGLTF.preload("/models/BusinessmanFinal.glb?v=ANIM_FIX");