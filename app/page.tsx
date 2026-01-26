"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, Environment, useGLTF, useAnimations } from "@react-three/drei";
import { useRef, useEffect, useState, Suspense, useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import Prism from "../components/Prism"
import Tunnel from "../components/Tunnel";

// =========================================
// SCROLL DEBUGGER (Top Right Red Box)
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
    <div className="fixed top-4 right-4 z-[9999] bg-red-600 text-white font-mono text-xs p-3 rounded shadow-lg border border-white/20 pointer-events-none">
      <div>SCROLL Y: {info.px}px</div>
      <div className="text-lg font-bold">VH: {info.vh}</div>
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

  const gltf = useGLTF("/models/BusinessmanFinal.glb");
  const scene = useMemo(() => SkeletonUtils.clone(gltf.scene), [gltf.scene]);
  const animations = gltf.animations;
  const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene]);

  const actions = useMemo(() => {
    const actionMap: Record<string, THREE.AnimationAction> = {};
    animations.forEach((clip) => {
      actionMap[clip.name.toLowerCase()] = mixer.clipAction(clip);
      actionMap[clip.name] = mixer.clipAction(clip); // Backup original name
    });
    return actionMap;
  }, [mixer, animations]);

  useLayoutEffect(() => {
    mixerRef.current = mixer;
    actionsRef.current = actions;
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        // Hide helper shapes
        const name = mesh.name.toLowerCase();
        if (name.includes("sphere") || name.includes("circle") || name.includes("shape")) {
          mesh.visible = false;
          return;
        }
        mesh.visible = true;
        mesh.frustumCulled = false;
        if (mesh.material) {
          const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
          mat.transparent = false;
          mat.opacity = 1;
          mat.side = THREE.DoubleSide;
        }
      }
    });
  }, [scene, mixer, actions]);

  useFrame((state, delta) => {
    if (!group.current) return;

    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    const currentVh = scrollY / vh;

    // --- TIMELINE CONFIG ---
    // 0 - 4.5vh: Idle (Matches Expanding Section)
    // 4.5 - 5.5vh: Rotate (Transition)
    // 5.5vh+: Dive (Tunnel Entry)
    const startRotate = 4.5; 
    const startDive = 5.5;   

    // ==========================================
    // PHASE 1: IDLE
    // ==========================================
    if (currentVh < startRotate) {
      if (currentPhase !== "idle") {
        setCurrentPhase("idle");
        Object.values(actions).forEach(a => a.stop());
        const idleAnim = actions["idle"] || Object.values(actions)[0];
        idleAnim?.reset().play();
      }

      // Default Position (Center Screen)
      group.current.position.set(0, -2, 0);
      group.current.rotation.set(0, 0, 0); 
      
      // OPTIONAL: Hide him during the very first Hero screen (0-1vh) so he doesn't block the Prism text
      // Change '0.5' to '0' if you want him visible immediately
      const scale = currentVh < 0.2 ? 0 : 1.1; 
      group.current.scale.set(scale, scale, scale);

      if (mixerRef.current) mixerRef.current.update(delta);
      return;
    }

    // ==========================================
    // PHASE 2: ROTATE (3 Times)
    // ==========================================
    if (currentVh < startDive) {
      const progress = (currentVh - startRotate) / (startDive - startRotate);

      if (currentPhase !== "rotating") {
        setCurrentPhase("rotating");
        // Keep Idle playing
        const idleAnim = actions["idle"] || Object.values(actions)[0];
        if (!idleAnim.isRunning()) idleAnim.reset().play();
      }

      // Rotate 3 full times (6 * PI)
      const spin = progress * (Math.PI * 6);
      
      group.current.rotation.set(0, spin, 0);
      group.current.position.set(0, -2, 0); 
      group.current.scale.set(1.1, 1.1, 1.1);

      if (mixerRef.current) mixerRef.current.update(delta);
      return;
    }

    // ==========================================
    // PHASE 3: DIVE INTO TUNNEL
    // ==========================================
    const diveProgress = currentVh - startDive; 

    if (currentPhase !== "diving") {
      setCurrentPhase("diving");
      Object.values(actions).forEach(a => a.stop());

      // Try multiple names for the dive animation
      const diveAction = actions["runtodive"] || actions["dive"] || Object.values(actions)[2];
      if (diveAction) diveAction.reset().play();
    }

    // 1. POSITION: Fly into negative Z
    const startZ = 0;
    // Speed = 20 (Adjust if he flies too fast/slow)
    group.current.position.z = startZ - (diveProgress * 20); 
    group.current.position.y = -2; // Lock Height
    
    // 2. ROTATION: Face Tunnel + Tilt Down
    group.current.rotation.set(Math.PI * 0.35, Math.PI, 0);
    
    if (mixerRef.current) mixerRef.current.update(delta);
  });

  return (
    <group ref={group} renderOrder={999}>
      <primitive object={scene} />
    </group>
  );
}
useGLTF.preload("/models/BusinessmanFinal.glb?falling1");

// =========================================
// HERO MODEL (STATIC GREETING MAN)
// =========================================
function HeroBusinessman() {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF("/models/BusinessmanFinal.glb");
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    // Play greeting or first animation
    const action = actions["greeting"] || actions[Object.keys(actions)[0]];
    action?.reset().fadeIn(0.5).play();
  }, [actions]);

  return (
    <group ref={group}>
      <primitive 
        object={scene} 
        position={[0, -5.9, 0]}
        rotation={[0, 0, 0]}
        scale={450} // Keeping your original scaling for Hero
      />
    </group>
  );
}

useGLTF.preload("/models/BusinessmanFinal.glb?hero");

// =========================================
// EXPANDING SECTION (NO CANVAS INSIDE)
// =========================================
function ExpandingSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
      const handleScroll = () => {
          if (!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const totalDistance = rect.height - viewportHeight;
          const scrolled = -rect.top;
          let rawProgress = scrolled / totalDistance;
          rawProgress = Math.max(0, Math.min(1, rawProgress));
          setProgress(rawProgress);
      };
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const expansionProgress = Math.min(1, progress * 2);
  const internalProgress = Math.max(0, (progress - 0.5) * 2);
  const isLocked = expansionProgress >= 0.99;
  
  const ease = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  const easedP = ease(expansionProgress);
  const easedIp = ease(internalProgress);

  const tabStyles = {
      width: isLocked ? '100%' : `${45 + easedP * 55}%`, 
      height: isLocked ? '100vh' : `${50 + easedP * 50}vh`,
      top: '50%',
      left: isLocked ? '0' : `${10 * (1 - easedP)}%`,
      transform: isLocked ? 'translate(0, -50%)' : 'translateY(-50%)',
      borderRadius: isLocked ? '0px' : `${40 * (1 - easedP)}px`,
  };
  
  const graphSVG = `data:image/svg+xml,%3Csvg width='100%25' height='100%25' viewBox='0 0 1000 500' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 400 Q 250 450, 500 300 T 1000 50' stroke='%23000' stroke-width='2' fill='none' vector-effect='non-scaling-stroke' opacity='0.1'/%3E%3Cpath d='M0 450 Q 250 500, 500 350 T 1000 100' stroke='%23000' stroke-width='1' fill='none' vector-effect='non-scaling-stroke' opacity='0.05'/%3E%3C/svg%3E`;

  return (
      <section ref={containerRef} className="relative h-[500vh] bg-white font-sans z-20">           
          <div className="sticky top-0 h-screen w-full flex items-center overflow-hidden">
              <div 
                  className="absolute bg-[#e0e0e0] overflow-hidden z-20 border border-black/10"
                  style={{ 
                      ...tabStyles,
                      willChange: 'width, height, left, transform',
                      boxShadow: `0 ${20 + easedP * 30}px ${60 + easedP * 40}px rgba(0,0,0,${0.1 + easedP * 0.15})`
                  }}
              >
                    {/* Graph Background */}
                    <div 
                      className="absolute inset-0 pointer-events-none" 
                      style={{ 
                          backgroundImage: `url("${graphSVG}")`, 
                          backgroundSize: '100% 100%',
                          opacity: 0.6 + easedP * 0.4
                      }}
                    />
                  
                    {/* Text Content */}
                    <div className="absolute bottom-12 left-12 z-30 pointer-events-none">
                      <h2 className="font-serif-display text-black text-6xl leading-none">
                          Take the Leap.
                      </h2>
                      <div 
                          className="overflow-hidden"
                          style={{ 
                              maxHeight: easedIp > 0.15 ? '200px' : '0px',
                              opacity: Math.max(0, (easedIp - 0.15) * 2),
                              marginTop: easedIp > 0.15 ? '1rem' : '0',
                              transition: 'all 0.5s'
                          }}
                      >
                          <p className="text-gray-700 max-w-md text-lg">
                              Your journey from zero to one starts here.
                          </p>
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
          <div className="flex items-center gap-6 transition-all duration-500 cursor-pointer">
            <div className="flex items-center gap-2">
               <div className="w-4 h-4 border-[1.5px] border-white transform rotate-45"></div>
               <span className="text-white font-serif text-base tracking-widest">WESTBRIDGE</span>
            </div>
            <span className="text-white font-sans font-bold text-lg tracking-tighter">stripe</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-3">
          <p className="text-gray-200 text-[10px] uppercase tracking-[0.2em] font-sans opacity-70">Co-Presents</p>
          <div className="flex items-center gap-6 transition-all duration-500 cursor-pointer">
             <div className="flex items-center gap-2">
               <div className="w-5 h-5 rounded-full bg-[#280071] border border-white/20 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute top-0.5 w-1.5 h-3 bg-white rounded-full"></div>
               </div>
               <span className="text-white font-sans font-bold text-lg">SBI</span>
             </div>
             <div className="flex items-center gap-2">
                <span className="text-gray-200 font-sans font-medium text-sm">AdMob</span>
             </div>
          </div>
        </div>
        <div className="flex flex-col items-center md:items-center gap-3">
          <p className="text-gray-200 text-[10px] uppercase tracking-[0.2em] font-sans opacity-70">In Association With</p>
          <div className="flex items-center gap-6 transition-all duration-500 cursor-pointer">
             <span className="text-red-500 font-bold italic text-lg font-serif">Campa</span>
             <div className="flex items-center gap-2">
                <span className="text-white font-sans font-bold text-base">GitLab</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// =========================================
// MAIN PAGE COMPONENT
// =========================================
export default function Home() {
  const [scroll, setScroll] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setScroll(Math.min(window.scrollY / window.innerHeight, 1));
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="bg-[#050505] text-white w-full min-h-screen font-sans selection:bg-green-400 selection:text-black">
      
      <style jsx global>{`
        html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            overflow-x: clip; 
            background-color: #050505;
        }
      `}</style>

      {/* 🔴 SCROLL DEBUGGER (Remove when done) */}
      <ScrollDebugger />

      {/* ================================================= */}
      {/* 🚀 GLOBAL 3D LAYER (The Falling Man)              */}
      {/* ================================================= */}
      <div className="fixed inset-0 z-50 pointer-events-none">
          <Canvas gl={{ antialias: true, alpha: true }}>
              {/* Camera matches previous Expanding Section settings */}
              <PerspectiveCamera makeDefault position={[0, 0, 16]} fov={50} />
              
              {/* Lighting matches previous Expanding Section settings */}
              <ambientLight intensity={1.2} />
              <directionalLight position={[5, 5, 5]} intensity={1.5} />
              <directionalLight position={[-5, 3, -5]} intensity={0.8} />
              <spotLight position={[0, 10, 10]} intensity={2} angle={0.6} penumbra={1} />

              <Suspense fallback={null}>
                  <FallingMan />
              </Suspense>
          </Canvas>
      </div>

      {/* ================= HERO SECTION ================= */}
      <section className="relative h-screen w-full flex flex-col justify-center overflow-hidden">
        
        {/* BACKGROUND LAYER */}
        <div className="absolute inset-0 z-0"> 
            <Prism 
               scale={4} 
               colorFrequency={1.5}
               noise={0}
            />
            {/* Optional Floor Glow */}
            <div className="absolute bottom-[-10%] left-0 w-full h-[60%] pointer-events-none bg-gradient-to-t from-cyan-500/30 via-white/20 to-transparent blur-[100px]" />
        </div>

        {/* NAV BAR */}
        <nav className="absolute top-0 w-full flex items-center justify-between p-8 z-50 text-gray-400 text-sm font-sans tracking-wide">
          <div>
            <span className="text-white font-bold">MES 2026</span><br />
            Manipal Entrepreneurship Summit
          </div>
          <div className="hidden md:flex gap-8 absolute left-1/2 -translate-x-1/2">
            <span>Investment</span>
            <span>Incubation</span>
            <span>Innovation</span>
          </div>
          <div>
            <button className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-gray-200 transition">
              Login
            </button>
          </div>
        </nav>

        {/* HERO CONTENT */}
        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 flex items-center justify-center">
            
            {/* Left Text */}
            <h1 className="font-serif-display italic text-6xl md:text-8xl lg:text-[10rem] leading-none text-white mix-blend-difference flex-1 text-right pr-12 md:pr-24">
              MES
            </h1>
            
            {/* CANVAS 1: HERO MODEL (Static Greeting Man) */}
            <div className="w-[200px] h-[200px] md:w-[450px] md:h-[450px] relative shrink-0 z-20">
                <Canvas gl={{ antialias: true, alpha: true }}>
                    <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} near={0.1} />
                    
                    <ambientLight intensity={0.5} />
                    <spotLight position={[10, 15, 10]} intensity={3} color="white" />
                    <spotLight position={[-5, 5, -10]} intensity={5} color="#22c55e" />
                    <spotLight position={[5, 0, -10]} intensity={5} color="#ef4444" />
                    <Environment preset="city" />

                    <Suspense fallback={null}>
                        <HeroBusinessman />
                    </Suspense>
                </Canvas>
            </div>

            {/* Right Text */}
            <h1 className="font-serif-display text-6xl md:text-8xl lg:text-[10rem] leading-none text-white mix-blend-difference flex-1 text-left pl-12 md:pl-24">
              2026
            </h1>
        </div>
        
        <SponsorFooter/>
      </section>

      {/* ================= 2. EXPANDING SECTION ================= */}
      <ExpandingSection />

      {/* ================= 3. TUNNEL SECTION ================= */}
      <section className="relative z-50 w-full">
        <Tunnel />
      </section>

      {/* ================= 4. HIGHLIGHTS ================= */}
      <section className="relative z-30 px-6 md:px-16 py-32 bg-[#050505]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-serif-display italic mb-16 text-center text-white">
            <span className="text-green-500 not-italic font-sans font-bold">02.</span> Highlights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((item, i) => (
              <div key={i} className="h-[400px] bg-neutral-900 border border-neutral-800 rounded-sm relative group">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-80"></div>
                  <div className="absolute bottom-6 left-6 p-4">
                      <h3 className="text-xl font-bold">Event Highlight {item}</h3>
                  </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="relative z-30 border-t border-white/10 px-6 md:px-16 py-20 bg-[#050505]">
         <div className="text-center md:text-left">
            <h3 className="font-bold text-2xl">MES 2026</h3>
            <p className="text-gray-500 text-sm mt-2">© 2026 Manipal Entrepreneurship Summit</p>
         </div>
      </footer>

    </div>
  );
}