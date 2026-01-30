"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, Environment, useGLTF, useAnimations } from "@react-three/drei";
import { useRef, useEffect, useState, Suspense, useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import Prism from "../components/Prism";
import Tunnel from "../components/Tunnel";
import DollarRain from "@/components/DollarRain";
import Navbar from "@/components/Navbar";
import GlassNavbar from "@/components/GlassNavbar";
// =========================================
// SCROLL DEBUGGER
// =========================================
function ScrollDebugger() {
  const [info, setInfo] = useState({ px: 0, vh: 0 });
  useEffect(() => {
    const update = () => {
      const px = window.scrollY;
      const h = window.innerHeight;
      const vh = (px / h).toFixed(2); 
      setInfo({ px: Math.round(px), vh: Number(vh) });
    };
    window.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    update();
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[9999] bg-red-600 text-white font-mono text-xs p-3 rounded pointer-events-none">
      <div>SCROLL Y: {info.px}px</div>
      <div>VH: {info.vh}</div>
    </div>
  );
}

// =========================================
// FALLING MAN (GLOBAL COMPONENT)
// =========================================
function FallingMan() {
  const group = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
  const [currentPhase, setCurrentPhase] = useState("idle");

  const gltf = useGLTF("/models/BusinessmanFinal-copy.glb");
  const scene = useMemo(() => SkeletonUtils.clone(gltf.scene), [gltf.scene]);
  const animations = gltf.animations;
  const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene]);

  const BASE_SCALE = 450; 

  const actions = useMemo(() => {
    const actionMap: Record<string, THREE.AnimationAction> = {};
    animations.forEach((clip) => {
      const action = mixer.clipAction(clip);
      if (clip.name.toLowerCase().match(/dive|run|jump/)) {
        action.clampWhenFinished = true;
        action.loop = THREE.LoopOnce;
      }
      actionMap[clip.name.toLowerCase()] = action;
    });
    return actionMap;
  }, [mixer, animations]);

  useLayoutEffect(() => {
    mixerRef.current = mixer;
    actionsRef.current = actions;
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.renderOrder = 999;
        mesh.frustumCulled = false;
        if (mesh.material) {
          const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
          mat.side = THREE.DoubleSide;
          mat.transparent = false;
          mat.opacity = 1;
        }
      }
    });
  }, [scene, mixer, actions]);

  const playAnimation = (name: string) => {
    Object.values(actionsRef.current).forEach(a => a.stop());
    let anim: THREE.AnimationAction | undefined = actionsRef.current[name];
    if (!anim) {
       const allAnims = Object.values(actionsRef.current);
       anim = allAnims.find(a => a
        
        
        .getClip().name.toLowerCase().includes(name));
    }
    if (!anim) anim = Object.values(actionsRef.current)[0];
    anim?.reset().fadeIn(0.5).play();
  };

  useFrame((state, delta) => {
    if (!group.current) return;
    const scrollY = window.scrollY;

    // --- CONFIGURATION ---
    const appearStart = 300;   
    const fullyExpanded = 1500; 

    // --- 1. VISIBILITY & POSITION LOCKING ---
    if (scrollY < appearStart) {
        group.current.visible = false;
        
        return; 
    } 
    
    group.current.visible = true;

    // EXPANSION PHASE (160px - 1500px)
    if (scrollY < fullyExpanded) {
        const expandProgress = (scrollY - appearStart) / (fullyExpanded - appearStart);
        const p = Math.max(0, Math.min(1, expandProgress));
        
        // SCALE: Grow from 0 to 450
        const currentScale = THREE.MathUtils.lerp(0, BASE_SCALE, p);
        group.current.scale.set(currentScale, currentScale, currentScale);
        const startX = -3.5; // <--- CHANGE THIS NUMBER
        const endX = 0;      // Where he ends up (Center)
        // X-LOCK: Slide from Left (-3.5) to Center (0) to match the card moving
const currentX = THREE.MathUtils.lerp(startX, endX, p);
        group.current.position.x = currentX;
        // Y-LOCK: Keep him vertically centered in the screen (-1.0 puts his center mass in middle)
        group.current.position.y = -1.0; 
        
        // Z-LOCK: Keep him close
        group.current.position.z = 0;

        // Ensure rotation is reset
        group.current.rotation.set(0, 0, 0);

        // Ensure Idle is playing
        if (currentPhase !== "idle") {
            setCurrentPhase("idle");
            const idle = actions["idle"] || Object.values(actions).find(a => !a.getClip().name.toLowerCase().includes("greet"));
            idle?.reset().play();
        }

        // Return early so we don't overwrite positions with later logic
        if (mixerRef.current) mixerRef.current.update(delta);
        return;
    } else {
        // LOCK to Normal Size after expansion
        group.current.scale.set(BASE_SCALE, BASE_SCALE, BASE_SCALE);
        // Reset X to perfect center for the rest of the animation
        group.current.position.x = 0;
    }

    // --- 2. REST OF THE SCROLL ANIMATION ---
    const startRotate = 2200; 
    const startDive = 3400;   
    const flashStart = 9530;   
    const reversePoint = 9701; 
    const galaxyExit = 13800;  
    const finalIdle = 14683;   

    // PHASE 1: IDLE & SPIN
    if (scrollY < startDive) {
      if (scrollY < startRotate) {
        // Just maintain position set in the else block above
        group.current.position.y = -1.0; 
        group.current.rotation.set(0, 0, 0);
      } else {
        const rotProg = (scrollY - startRotate) / (startDive - startRotate);
        group.current.rotation.y = rotProg * (Math.PI * 6);
        group.current.position.y = -1.0; 
      }
    } 
    // PHASE 2: DIVING
    else if (scrollY < flashStart) {
      if (currentPhase !== "diving") {
        setCurrentPhase("diving");
        playAnimation("dive"); 
      }
      const diveProg = (scrollY - startDive) / (flashStart - startDive);
      group.current.position.z = -(diveProg * 45); 
      group.current.position.y = -1.0; 
      group.current.rotation.set(Math.PI * 0.2, Math.PI, 0); 
    }
    // PHASE 3: FLIP (Hidden)
    else if (scrollY < reversePoint) {
      group.current.rotation.set(-Math.PI * 0.1, 0, 0); 
      group.current.position.z = -45;
    }
    // PHASE 4: COMING OUT
    else if (scrollY < galaxyExit) {
      if (currentPhase !== "exiting") setCurrentPhase("exiting");
      const exitProg = (scrollY - reversePoint) / (galaxyExit - reversePoint);
      group.current.position.z = THREE.MathUtils.lerp(-45, 5, exitProg);
      // Drop him down to floor level (-2.5) as he arrives
      group.current.position.y = THREE.MathUtils.lerp(-1.0, -2.5, exitProg);
      group.current.rotation.set(-Math.PI * 0.1, 0, 0); 
    }
    // PHASE 5: FINAL GREETING
    else {
      if (scrollY > finalIdle) {
        if (currentPhase !== "greeting") {
          setCurrentPhase("greeting");
          playAnimation("greeting");
        }
        group.current.position.set(0, -2.5, 5); 
        group.current.rotation.set(0, 0, 0);
      } else {
        const shatterProg = (scrollY - galaxyExit) / (finalIdle - galaxyExit);
        group.current.position.z = 5 + (shatterProg * 2);
      }
    }

    if (mixerRef.current) mixerRef.current.update(delta);
  });

  return <primitive object={scene} ref={group} />;
}

useGLTF.preload("/models/BusinessmanFinal-copy.glb");


// =========================================
// HERO MODEL (STATIC GREETING MAN)
// =========================================
function HeroBusinessman() {
  const group = useRef<THREE.Group>(null);
  
  // Load BOTH models
  const model1 = useGLTF("/models/BusinessmanFinal.glb");
  const model2 = useGLTF("/models/onlyGreeting.glb"); // Replace with your 2nd file name
  
  // Get animations for both
  const actions1 = useAnimations(model1.animations, group).actions;
  const actions2 = useAnimations(model2.animations, group).actions;

  const [showSecondModel, setShowSecondModel] = useState(false);
  const [startRain, setStartRain] = useState(false);

  useEffect(() => {
    // Play Idle on the first model immediately
    const idleAction = actions1["idle"];
    idleAction?.reset().fadeIn(0.5).play();

    const timer = setTimeout(() => {
      // 1. Hide Model 1, Show Model 2
      setShowSecondModel(true);
      
      // 2. Play Greeting on the NEW model
      const greetAction = actions2[""] || 
                         Object.values(actions2).find(a => a!.getClip().name.toLowerCase().includes("greet"));
      
      if (greetAction) {
        greetAction.reset().fadeIn(0.1).play();
      }

      // 3. Start the money rain
      setStartRain(true);
    }, 1500); // Trigger exactly when he hits the "spotlight"

    return () => clearTimeout(timer);
  }, [actions1, actions2]);

  return (
    <group ref={group}>
      {/* Model 1: The "Entry" Model */}
      {!showSecondModel && (
        <primitive 
          object={model1.scene} 
          position={[0, -7.5, 0]} 
          scale={500} 
        />
      )}

      {/* Model 2: The "Spotlight" Model */}
      {showSecondModel && (
        <primitive 
          object={model2.scene} 
          position={[0, -1.0, 0]} 
          scale={500} 
        />
      )}
      
      {startRain && <DollarRain />}
    </group>
  );
}

// Preload both to prevent a "flicker" during the swap
useGLTF.preload("/models/BusinessmanFinal.glb");
useGLTF.preload("/models/onlyGreeting.glb");



// =========================================
// EXPANDING SECTION
// =========================================
function ExpandingSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
      const handleScroll = () => {
          if (!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          const totalDistance = rect.height - window.innerHeight;
          const scrolled = -rect.top;
          setProgress(Math.max(0, Math.min(1, scrolled / totalDistance)));
      };
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const expansionProgress = Math.min(1, progress * 2);
  const ease = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  const easedP = ease(expansionProgress);
  const isLocked = expansionProgress >= 0.99;

  return (
      <section ref={containerRef} className="relative h-[500vh] bg-white font-sans z-20">           
          <div className="sticky top-0 h-screen w-full flex items-center overflow-hidden">
              <div 
                  className="absolute bg-[#e0e0e0] overflow-hidden z-20 border border-black/10"
                  style={{ 
                      width: isLocked ? '100%' : `${45 + easedP * 55}%`, 
                      height: isLocked ? '100vh' : `${50 + easedP * 50}vh`,
                      top: '50%',
                      left: isLocked ? '0' : `${10 * (1 - easedP)}%`,
                      transform: isLocked ? 'translate(0, -50%)' : 'translateY(-50%)',
                      borderRadius: isLocked ? '0px' : `${40 * (1 - easedP)}px`,
                      willChange: 'width, height, left, transform'
                  }}
              >
                 <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100%25' height='100%25' viewBox='0 0 1000 500' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 400 Q 250 450, 500 300 T 1000 50' stroke='%23000' stroke-width='2' fill='none' opacity='0.1'/%3E%3C/svg%3E")`, backgroundSize: '100% 100%', opacity: 0.6 + easedP * 0.4 }} />
                 <div className="absolute bottom-12 left-12 z-30 pointer-events-none">
                    <h2 className="font-serif-display text-black text-6xl leading-none">Take the Leap.</h2>
                    <div className="overflow-hidden" style={{ maxHeight: easedP > 0.8 ? '200px' : '0px', opacity: Math.max(0, (easedP - 0.8) * 5), marginTop: easedP > 0.8 ? '1rem' : '0', transition: 'all 0.5s' }}>
                        <p className="text-gray-700 max-w-md text-lg">Your journey from zero to one starts here.</p>
                    </div>
                 </div>
              </div>
          </div>
      </section>
  );
}

// =========================================
// SPONSOR FOOTER
// =========================================
function SponsorFooter() {
  return (
    <div className="absolute bottom-0 w-full z-40 pb-24 pt-32 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent">
      <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 items-end text-center">
        <div className="flex flex-col items-center md:items-center gap-3">
          <p className="text-gray-200 text-[10px] uppercase tracking-[0.2em] font-sans opacity-70">Presents</p>
          <div className="flex items-center gap-6 cursor-pointer">
            <span className="text-white font-serif text-base tracking-widest">WESTBRIDGE</span>
            <span className="text-white font-sans font-bold text-lg tracking-tighter">stripe</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-3">
          <p className="text-gray-200 text-[10px] uppercase tracking-[0.2em] font-sans opacity-70">Co-Presents</p>
          <div className="flex items-center gap-6 cursor-pointer">
             <span className="text-white font-sans font-bold text-lg">SBI</span>
             <span className="text-gray-200 font-sans font-medium text-sm">AdMob</span>
          </div>
        </div>
        <div className="flex flex-col items-center md:items-center gap-3">
          <p className="text-gray-200 text-[10px] uppercase tracking-[0.2em] font-sans opacity-70">In Association With</p>
          <div className="flex items-center gap-6 cursor-pointer">
             <span className="text-red-500 font-bold italic text-lg font-serif">Campa</span>
             <span className="text-white font-sans font-bold text-base">GitLab</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// =========================================
// MAIN PAGE
// =========================================
export default function Home() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const manZIndex = (scrollY > 9530 && scrollY < 10500) ? 40 : 9999;

  return (
<div className="bg-[#050505] text-white w-full min-h-screen font-sans">
  {/* LAYER 3: THE UI (Always on top and clickable) */}
  <div className="fixed top-0 left-0 w-full z-9999 pointer-events-none">
    {/* Wrap Navbar content in pointer-events-auto so links work */}
    <div className="pointer-events-auto">
      <Navbar />
    </div>
  </div>

  <ScrollDebugger />

      {/* 🚀 GLOBAL FALLING MAN CANVAS */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: manZIndex }}
      >
       <Navbar></Navbar>  
          <Canvas gl={{ antialias: true, alpha: true }}>
              <PerspectiveCamera makeDefault position={[0, 0, 16]} fov={50} />
              <ambientLight intensity={1.5} />
              <directionalLight position={[5, 5, 5]} intensity={2} />
              <directionalLight position={[-5, 3, -5]} intensity={1} />
              <spotLight position={[0, 10, 10]} intensity={2} angle={0.6} penumbra={1} />
              <Suspense fallback={null}>
                  <FallingMan />
              </Suspense>
          </Canvas>
      </div>

      {/* HERO SECTION */}

      <section className="relative h-screen w-full flex flex-col justify-center overflow-hidden z-[100] ">
         
        <div className="absolute inset-0 z-0"><Prism scale={4} colorFrequency={2.5} noise={0} /></div>
      
            <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 flex items-center justify-center">
                <h1 className="font-serif-display italic text-6xl md:text-8xl lg:text-[10rem] leading-none text-white mix-blend-difference flex-1 text-right pr-12 md:pr-24">MES</h1>
              <div className="relative w-full h-screen overflow-visible"> 
        <Canvas 
          shadows 
          camera={{ position: [0, 0, 10], fov: 50 }}
          style={{ pointerEvents: 'none' }} // Allows users to click buttons behind the 3D
        >    
            <ambientLight intensity={1} />
          
            <HeroBusinessman />
        </Canvas>
                </div>
                <h1 className="font-serif-display text-6xl md:text-8xl lg:text-[10rem] leading-none text-white mix-blend-difference flex-1 text-left pl-12 md:pl-24">2026</h1>
            </div>
        <SponsorFooter/>
      </section>

      <ExpandingSection />

      <section className="relative z-50 w-full">
        <Tunnel />
      </section>

      {/* HIGHLIGHTS SECTION */}
      <section className="relative z-30 px-6 md:px-16 py-32 bg-[#050505]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-serif-display italic mb-16 text-center text-white">
            <span className="text-green-500 not-italic font-sans font-bold">02.</span> Highlights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((item, i) => (
              <div key={i} className="h-[400px] bg-neutral-900 border border-neutral-800 rounded-sm relative group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-80"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-white/5 opacity-0 group-hover:opacity-100 transition duration-500 text-9xl font-bold">{item}</div>
                  <div className="absolute bottom-6 left-6 p-4">
                      <h3 className="text-xl font-bold text-white">Event Highlight {item}</h3>
                      <p className="text-gray-400 text-sm mt-2">Discover the future of entrepreneurship.</p>
                  </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative z-30 border-t border-white/10 px-6 md:px-16 py-20 bg-[#050505]">
         <div className="text-center md:text-left">
            <h3 className="font-bold text-2xl">MES 2026</h3>
            <p className="text-gray-500 text-sm mt-2">© 2026 Manipal Entrepreneurship Summit</p>
         </div>
      </footer>
    </div>
  );
}
