"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, useGLTF, useAnimations } from "@react-three/drei";
import { useRef, useEffect, useState, Suspense, useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import Prism from "../components/Prism";
import Tunnel from "../components/Tunnel";
import DollarRain from "@/components/DollarRain";
import Navbar from "@/components/Navbar";
import CardSwap, { Card, CardSwapHandle } from "../components/CardsSwap";

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
    <div className="fixed top-4 right-4 z-[50001] bg-red-600 text-white font-mono text-xs p-3 rounded pointer-events-none">
      <div>SCROLL Y: {info.px}px</div>
      <div>VH: {info.vh}</div>
    </div>
  );
}

// =========================================
// IDLE MAN (Simplified Falling Man)
// =========================================
function FallingMan() {
  const group = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
  
  const gltf = useGLTF("/models/BusinessmanFinal-copy.glb");
  const scene = useMemo(() => SkeletonUtils.clone(gltf.scene), [gltf.scene]);
  const animations = gltf.animations;
  const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene]);

  const BASE_SCALE = 450; 

  // Setup Animations
  const actions = useMemo(() => {
    const actionMap: Record<string, THREE.AnimationAction> = {};
    animations.forEach((clip) => {
      const action = mixer.clipAction(clip);
      actionMap[clip.name.toLowerCase()] = action;
    });
    return actionMap;
  }, [mixer, animations]);

  useLayoutEffect(() => {
    mixerRef.current = mixer;
    actionsRef.current = actions;
    // Play Idle animation by default
    const idle = actions["idle"] || Object.values(actions)[0];
    idle?.reset().play();

    // Material setup
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.frustumCulled = false; // Prevent flickering
      }
    });
  }, [scene, mixer, actions]);

  useFrame((state, delta) => {
    if (!group.current) return;
    const scrollY = window.scrollY;
    const vh = window.innerHeight;

    // --- CONFIGURATION ---
    const appearStart = 300;     // When to start showing him
    const fullyExpanded = 1500;  // When he reaches full size
    const disappearStart = vh * 5.5; // Hide him after Expanding Section ends (~550vh)

    // 1. HIDDEN (Before expanding section OR after it ends)
    if (scrollY < appearStart || scrollY > disappearStart) {
        group.current.visible = false;
        return;
    }

    // 2. VISIBLE
    group.current.visible = true;

    // 3. ANIMATION: Expand and slide to center
    if (scrollY < fullyExpanded) {
        const expandProgress = (scrollY - appearStart) / (fullyExpanded - appearStart);
        const p = Math.max(0, Math.min(1, expandProgress));
        
        // Scale 0 -> 450
        const currentScale = THREE.MathUtils.lerp(0, BASE_SCALE, p);
        group.current.scale.set(currentScale, currentScale, currentScale);
        
        // Slide X: -3.5 -> 0
        const currentX = THREE.MathUtils.lerp(-3.5, 0, p);
        group.current.position.set(currentX, -1.0, 0);
    } else {
        // 4. LOCKED: He stays full size and centered
        group.current.scale.set(BASE_SCALE, BASE_SCALE, BASE_SCALE);
        group.current.position.set(0, -1.0, 0);
    }

    // Always reset rotation so he doesn't spin
    group.current.rotation.set(0, 0, 0);

    // Update animation mixer
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
  const model1 = useGLTF("/models/BusinessmanFinal.glb");
  const model2 = useGLTF("/models/onlyGreeting.glb"); 
  const actions1 = useAnimations(model1.animations, group).actions;
  const actions2 = useAnimations(model2.animations, group).actions;
  const [showSecondModel, setShowSecondModel] = useState(false);
  const [startRain, setStartRain] = useState(false);

  useEffect(() => {
    const idleAction = actions1["idle"];
    idleAction?.reset().fadeIn(0.5).play();

    const timer = setTimeout(() => {
      setShowSecondModel(true);
      const greetAction = actions2[""] || Object.values(actions2).find(a => a!.getClip().name.toLowerCase().includes("greet"));
      if (greetAction) greetAction.reset().fadeIn(0.1).play();
      setStartRain(true);
    }, 1500); 

    return () => clearTimeout(timer);
  }, [actions1, actions2]);

  return (
    <group ref={group}>
      {!showSecondModel && (
        <primitive object={model1.scene} position={[0, -7.5, 0]} scale={500} />
      )}
      {showSecondModel && (
        <primitive object={model2.scene} position={[0, -1.0, 0]} scale={500} />
      )}
      {startRain && <DollarRain />}
    </group>
  );
}
useGLTF.preload("/models/BusinessmanFinal.glb");

// =========================================
// EXPANDING SECTION
// =========================================
function ExpandingSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardSwapRef = useRef<CardSwapHandle>(null);
  const [progress, setProgress] = useState(0);
  const lastTriggerRef = useRef(0); 

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

  const timeline = progress * 2.5;
  const expansionCap = Math.min(1, timeline);
  const ease = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  const easedBox = ease(expansionCap);
  const isLocked = expansionCap >= 0.99;

  useEffect(() => {
    if (timeline > 1.3 && lastTriggerRef.current < 1) {
        cardSwapRef.current?.triggerSwap();
        lastTriggerRef.current = 1;
    } else if (timeline > 1.8 && lastTriggerRef.current < 2) {
        cardSwapRef.current?.triggerSwap();
        lastTriggerRef.current = 2;
    } else if (timeline < 1.0) {
        lastTriggerRef.current = 0; 
    }
  }, [timeline]);

  return (
      <section ref={containerRef} className="relative h-[500vh] bg-white font-sans z-20">          
          <div className="sticky top-0 h-screen w-full flex items-center overflow-hidden">
              <div 
                  className="absolute bg-[#e0e0e0] overflow-hidden z-20 border border-black/10"
                  style={{ 
                      width: isLocked ? '100%' : `${45 + easedBox * 55}%`, 
                      height: isLocked ? '100vh' : `${50 + easedBox * 50}vh`,
                      top: '50%',
                      left: isLocked ? '0' : `${10 * (1 - easedBox)}%`,
                      transform: isLocked ? 'translate(0, -50%)' : 'translateY(-50%)',
                      borderRadius: isLocked ? '0px' : `${40 * (1 - easedBox)}px`,
                      willChange: 'width, height, left, transform'
                  }}
              >
                 <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100%25' height='100%25' viewBox='0 0 1000 500' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 400 Q 250 450, 500 300 T 1000 50' stroke='%23000' stroke-width='2' fill='none' opacity='0.1'/%3E%3C/svg%3E")`, backgroundSize: '100% 100%', opacity: 0.6 + easedBox * 0.4 }} />
                 
                 {/* Text Content */}
                 <div className="absolute bottom-32 left-12 z-30 pointer-events-none">
                    <h2 
                        className="font-serif-display text-black text-6xl leading-none"
                        style={{
                            opacity: Math.max(0, (timeline - 0.5) * 5),
                            transform: `translateY(${timeline > 0.5 ? '0' : '20px'})`,
                            transition: 'opacity 0.5s, transform 0.5s'
                        }}
                    >
                        Take the Leap.
                    </h2>
                    <div 
                        className="overflow-hidden" 
                        style={{ 
                            maxHeight: timeline > 0.6 ? '200px' : '0px', 
                            opacity: Math.max(0, (timeline - 0.6) * 5),
                            marginTop: timeline > 0.6 ? '1rem' : '0', 
                            transition: 'all 0.5s' 
                        }}
                    >
                        <p className="text-gray-700 max-w-md text-lg">
                            Your journey from zero to one starts here.
                        </p>
                    </div>
                 </div>

                 {/* Card Swap */}
                 <div 
                    className="absolute top-1/2 right-12 md:right-32 -translate-y-1/2 z-30 pointer-events-none"
                    style={{
                          opacity: Math.max(0, (timeline - 0.8) * 5),
                          transition: 'opacity 0.5s'
                    }}
                 >
                    <div className="pointer-events-auto"> 
                        <CardSwap 
                            ref={cardSwapRef}
                            width="500px" 
                            height="420px" 
                            easing="elastic"
                        >
                            <Card customClass="bg-black border border-white/20 rounded-xl overflow-hidden shadow-2xl">
                                <div className="relative w-full h-full">
                                    <img src="https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" alt="Ashneer"/>
                                    <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
                                        <h3 className="text-white text-3xl font-serif-display italic">Ashneer</h3>
                                        <h3 className="text-white text-3xl font-bold -mt-2">Grover</h3>
                                        <p className="text-gray-400 text-xs mt-2 uppercase tracking-widest">BharatPe</p>
                                    </div>
                                </div>
                            </Card>
                            <Card customClass="bg-black border border-white/20 rounded-xl overflow-hidden shadow-2xl">
                                <div className="relative w-full h-full">
                                    <img src="https://images.unsplash.com/photo-1557862921-37829c790f19?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" alt="Aman"/>
                                    <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
                                        <h3 className="text-white text-3xl font-serif-display italic">Aman</h3>
                                        <h3 className="text-white text-3xl font-bold -mt-2">Gupta</h3>
                                        <p className="text-gray-400 text-xs mt-2 uppercase tracking-widest">boAt</p>
                                    </div>
                                </div>
                            </Card>
                            <Card customClass="bg-black border border-white/20 rounded-xl overflow-hidden shadow-2xl">
                                <div className="relative w-full h-full">
                                    <img src="https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?q=80&w=600&auto=format&fit=crop" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" alt="Ritesh"/>
                                    <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
                                        <h3 className="text-white text-3xl font-serif-display italic">Ritesh</h3>
                                        <h3 className="text-white text-3xl font-bold -mt-2">Agarwal</h3>
                                        <p className="text-gray-400 text-xs mt-2 uppercase tracking-widest">OYO</p>
                                    </div>
                                </div>
                            </Card>
                        </CardSwap>
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

  return (
    <div className="bg-[#050505] text-white w-full min-h-screen font-sans">
      {/* LAYER 3: THE UI (Always on top)
         FIX: Navbar is z-[50000] to beat the 3D Canvas
      */}
      <Navbar />

      {/* GLOBAL FALLING MAN CANVAS
         FIX: z-index is lower than Navbar
      */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 10 }}
      >
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
          style={{ pointerEvents: 'none' }} 
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

      {/* NAVBAR SCROLL TARGETS 
          Ensure these IDs match the hrefs in Navbar (#speakers, #events, etc.)
      */}

      {/* 1. SPEAKERS SECTION */}
      <section id="speakers" className="relative z-30 min-h-screen w-full flex items-center justify-center bg-[#050505] border-t border-white/10">
        <div className="text-center">
            <h2 className="text-6xl md:text-8xl font-serif-display italic text-white mb-6">Speakers</h2>
            <p className="text-gray-400 text-xl max-w-2xl mx-auto">Visionaries and industry leaders taking the stage.</p>
        </div>
      </section>

      {/* 2. EVENTS SECTION */}
      <section id="events" className="relative z-30 min-h-screen w-full flex items-center justify-center bg-[#0a0a0a] border-t border-white/5">
        <div className="text-center">
            <h2 className="text-6xl md:text-8xl font-serif-display italic text-white mb-6">Events</h2>
            <p className="text-gray-400 text-xl max-w-2xl mx-auto">Workshops, Hackathons, and Networking sessions.</p>
        </div>
      </section>

      {/* 3. TIMELINE SECTION */}
      <section id="timeline" className="relative z-30 min-h-screen w-full flex items-center justify-center bg-[#050505] border-t border-white/5">
        <div className="text-center">
            <h2 className="text-6xl md:text-8xl font-serif-display italic text-white mb-6">Timeline</h2>
            <p className="text-gray-400 text-xl max-w-2xl mx-auto">Three days of innovation and entrepreneurship.</p>
        </div>
      </section>

      {/* 4. PASSES SECTION */}
      <section id="passes" className="relative z-30 min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-[#0a0a0a] to-[#000000] border-t border-white/5">
        <div className="text-center">
            <h2 className="text-6xl md:text-8xl font-serif-display italic text-white mb-6">Passes</h2>
            <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-10">Secure your spot at MES 2026.</p>
            {/* Standard HTML link or Next Link here for redundant ticket button */}
            <a href="/signup" className="inline-block px-8 py-4 rounded-full bg-white text-black font-bold hover:scale-105 transition-transform duration-300">
                Get Tickets Now
            </a>
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