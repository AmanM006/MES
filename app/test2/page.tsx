"use client";
import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
// Ensure you have the image imported
import galaxyImg from "@/images/galaxy.jpg"; 

// --- GLASS SHARDS DATA ---
// 4x4 Glass Shards for the end effect
const glassShards = Array.from({ length: 16 }).map((_, i) => ({
  id: i,
  xDir: (Math.random() - 0.5) * 800,
  yDir: (Math.random() - 0.5) * 800,
  rotX: (Math.random() - 0.5) * 1000,
  rotY: (Math.random() - 0.5) * 1000,
}));

// --- [STOCK CHART COMPONENT] ---
function StockChart({ color }: { color: "green" | "red" }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const scale = window.devicePixelRatio || 2;
    canvas.width = 1200 * scale; canvas.height = 800 * scale;
    ctx.scale(scale, scale);
    const generateData = () => {
      const p = []; let v = 200;
      for (let i=0; i<50; i++) { v += (Math.random()-0.5)*40; v=Math.max(50, Math.min(350,v)); p.push(v); }
      return p;
    };
    let dataPoints = generateData(); let offset = 0;
    const draw = () => {
      ctx.clearRect(0, 0, 1200, 800); ctx.lineWidth = 2;
      ctx.strokeStyle = color==="green"?"rgba(34,197,94,0.2)":"rgba(239,68,68,0.2)";
      for(let y=0; y<800; y+=80){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1200,y);ctx.stroke();}
      for(let x=0; x<1200; x+=80){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,800);ctx.stroke();}
      const candleW=20; const spacing=24;
      for(let i=0; i<45; i++){
        const idx = Math.floor((i+offset)%dataPoints.length);
        const x=i*spacing; const o=dataPoints[idx]; const c=dataPoints[(idx+1)%dataPoints.length];
        const h=Math.max(o,c)+Math.random()*20; const l=Math.min(o,c)-Math.random()*20;
        const isG=c>o;
        ctx.fillStyle=color==="green"?(isG?"rgba(34,197,94,1)":"rgba(34,197,94,0.6)"):(isG?"rgba(239,68,68,0.6)":"rgba(239,68,68,1)");
        ctx.strokeStyle=ctx.fillStyle;
        ctx.beginPath();ctx.moveTo(x+candleW/2,h);ctx.lineTo(x+candleW/2,l);ctx.stroke();
        ctx.fillRect(x,Math.min(o,c),candleW,Math.abs(c-o));
      }
    };
    let id:number; let last=0;
    const loop=(t:number)=>{
        if(t-last>100){ offset+=0.2; if(offset>dataPoints.length){dataPoints=generateData();offset=0;} draw(); last=t;}
        id=requestAnimationFrame(loop);
    };
    loop(0);
    return ()=>cancelAnimationFrame(id);
  }, [color]);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" style={{mixBlendMode:"screen"}}/>;
}

// --- [GALAXY TUNNEL] (Density Trick Version) ---
function GalaxyTunnel({ scrollProgress }: { scrollProgress: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const scrollRef = useRef(0);
  
    useEffect(() => {
      scrollRef.current = scrollProgress;
    }, [scrollProgress]);
  
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
  
      const ww = window.innerWidth;
      const wh = window.innerHeight;
  
      // 1. SETUP RENDERER (THE VIBRANCY FIX)
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setSize(ww, wh);
      
      // FIX A: Enable sRGB encoding. This creates the "High Contrast/Vibrant" look.
      renderer.outputColorSpace = THREE.SRGBColorSpace; 
      
      const scene = new THREE.Scene();
      // FIX B: Deep Black Fog. Starts further back (30) so front is clear.
      scene.fog = new THREE.Fog(0x000000, 30, 150);
  
      const camera = new THREE.PerspectiveCamera(15, ww / wh, 0.01, 1000);
      camera.rotation.y = Math.PI;
      camera.position.z = 0.35;
  
      // 2. GEOMETRY
      const points = [];
      for (let i = 0; i < 5; i++) {
        points.push(new THREE.Vector3(0, 0, 3 * (i / 4)));
      }
      points[4].y = -0.06;
      
      const curve = new THREE.CatmullRomCurve3(points);
      const geometry = new THREE.TubeGeometry(curve, 70, 0.02, 50, false);
  
      // 3. TEXTURE (THE CLARITY FIX)
      const textureLoader = new THREE.TextureLoader();
      const imageSrc = typeof galaxyImg === "string" ? galaxyImg : galaxyImg.src;
      const texture = textureLoader.load(imageSrc);
      
      // FIX C: Tell Three.js this texture is sRGB (Removes the "Milky/Washed out" tint)
      texture.colorSpace = THREE.SRGBColorSpace;
      
      // FIX D: Anisotropy makes the texture sharp at oblique angles (Clean lines)
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  
      texture.wrapS = THREE.MirroredRepeatWrapping;
      texture.wrapT = THREE.MirroredRepeatWrapping;
      texture.repeat.set(10, 4); 
  
      const material = new THREE.MeshBasicMaterial({
        side: THREE.BackSide,
        map: texture,
        // FIX E: Slight dimming (0xbbbbbb) increases perceived contrast 
        // by making the darks darker without losing the brights.
        color: 0xffffff, 
      });
  
      const tubeMesh = new THREE.Mesh(geometry, material);
      scene.add(tubeMesh);
  
      // 4. ANIMATION
      let animId: number;
      let time = 0;
  
      const animate = () => {
        const scroll = scrollRef.current; 
        time += 0.01;
  
        if (tubeMesh.material instanceof THREE.MeshBasicMaterial && tubeMesh.material.map) {
          
          // HYPERDRIVE EFFECT
          const targetRepeatX = THREE.MathUtils.lerp(10, 0.3, scroll);
          tubeMesh.material.map.repeat.x = targetRepeatX;
          tubeMesh.material.map.offset.x = -(scroll * 20); 
          tubeMesh.material.map.offset.y += 0.002;
        }
  
        const shake = scroll * 0.005; 
        camera.position.x = (Math.random() - 0.5) * shake;
        camera.position.y = (Math.random() - 0.5) * shake;
  
        renderer.render(scene, camera);
        animId = requestAnimationFrame(animate);
      };
      animate();
  
      const handleResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', handleResize);
  
      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener('resize', handleResize);
        renderer.dispose();
        geometry.dispose();
        material.dispose();
        texture.dispose();
      };
    }, []);
  
    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full bg-black" />;
  }

// --- MAIN ORCHESTRATOR ---
const TUNNEL_DEPTH_PX = 1650;
const GRID_ROWS = 10;
const GRID_COLS = 20;

export default function Tunnel() {
  const [transform, setTransform] = useState({ z: 0, y: 0 });
  const [whiteFlash, setWhiteFlash] = useState(0);
  const [showGalaxy, setShowGalaxy] = useState(false);
  const [galaxyProgress, setGalaxyProgress] = useState(0);
  const [shatterProgress, setShatterProgress] = useState(0); // NEW STATE

  // --- AUTO SCROLL CONTROLLER ---
  useEffect(() => {
    let animationFrameId: number;
    let currentScrollY = window.scrollY;

    const autoScrollLoop = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(1, currentScrollY / maxScroll);

      let speed = 6.5; // Base Speed (0-0.5)

      // YOUR CUSTOM SPEED CURVE
      if (progress > 0.5 && progress <= 0.75) {
        // Ramp up 4 -> 6.5
        const rampRatio = (progress - 0.5) / 0.25; 
        speed = 6.5 + (rampRatio * 2);
      } else if (progress > 0.75 && progress <= 0.8) {
        // Brake 6.5 -> 2
        const flashRatio = (progress - 0.75) / 0.05; 
        speed = 6.5 - (flashRatio * 4.5);
      } else if (progress > 0.8) {
        // Recovery 2 -> 5
        const galaxyRatio = (progress - 0.8) / 0.2; 
        speed = 2 + (galaxyRatio * 3);
      }

      currentScrollY += speed;

      if (currentScrollY >= maxScroll) {
        currentScrollY = maxScroll;
      } else {
        animationFrameId = requestAnimationFrame(autoScrollLoop);
      }

      window.scrollTo(0, currentScrollY);
    };

    animationFrameId = requestAnimationFrame(autoScrollLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const walls = [
    { origin: "left center", transform: "rotateY(90deg)", width: `${TUNNEL_DEPTH_PX}px`, height: "100%", left: "0px", top: "0px", type: "side", side: "left" },
    { origin: "right center", transform: "rotateY(-90deg)", width: `${TUNNEL_DEPTH_PX}px`, height: "100%", right: "0px", top: "0px", type: "side", side: "right" },
    { origin: "top center", transform: "rotateX(-90deg)", height: `${TUNNEL_DEPTH_PX}px`, width: "100%", top: "0px", left: "0px", type: "flat", side: "top" },
    { origin: "bottom center", transform: "rotateX(90deg)", height: `${TUNNEL_DEPTH_PX}px`, width: "100%", bottom: "0px", left: "0px", type: "flat", side: "bottom" },
  ];

  const gridSquares = Array.from({ length: GRID_ROWS * GRID_COLS });

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = Math.max(0, Math.min(1, scrollY / maxScroll));

      // --- SEQUENCE LOGIC ---
      if (scrollProgress < 0.8) {
        // Phase 1: Stock Tunnel
        const zValue = scrollY * 0.6 + 200;
        const yValue = Math.max(0, 400 - scrollY * 0.2);
        setTransform({ z: zValue, y: yValue });
        setShowGalaxy(false);
        setShatterProgress(0); 

        if (scrollProgress > 0.75) {
          const flashIn = (scrollProgress - 0.75) / 0.05;
          setWhiteFlash(Math.min(1, flashIn));
        } else {
          setWhiteFlash(0);
        }
      } else {
        // Phase 2: Galaxy Tunnel
        setShowGalaxy(true);
        
        if (scrollProgress < 0.85) {
          const flashOut = 1 - ((scrollProgress - 0.8) / 0.05);
          setWhiteFlash(Math.max(0, flashOut));
        } else {
          setWhiteFlash(0);
        }
        
        const gProg = (scrollProgress - 0.8) * 5; 
        setGalaxyProgress(gProg);

        // --- TRIGGER SHATTER (Last 5% of scroll) ---
        if (scrollProgress > 0.97) { 
            // Calculate progress for the remaining 3% (0.03)
            const rawProgress = (scrollProgress - 0.97) / 0.03; 
            
            // Keep the easing or remove it if you want linear speed
            const delayedShatter = Math.pow(rawProgress, 3); 
            
            setShatterProgress(delayedShatter);
        } else {
            setShatterProgress(0);
        }
    }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="flex flex-col justify-center h-[500vh] bg-black">
      <div className="w-full h-screen sticky top-0 overflow-hidden" 
           style={{ perspective: "100px", transformStyle: "preserve-3d" }}>
        
        {/* SHATTER OVERLAY (Must be on top) */}
        <div className="absolute inset-0 z-[60] pointer-events-none flex flex-wrap" style={{ perspective: '1000px' }}>
            {glassShards.map((shard) => (
                <div key={shard.id} className="w-1/4 h-1/4 relative"
                    style={{
                        opacity: shatterProgress > 0 ? 1 : 0, 
                        transform: shatterProgress > 0 ? `
                            translate3d(${shard.xDir * shatterProgress}px, ${shard.yDir * shatterProgress}px, ${shatterProgress * 500}px)
                            rotateX(${shard.rotX * shatterProgress}deg) 
                            rotateY(${shard.rotY * shatterProgress}deg)
                        ` : 'none',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255,255,255,0.4)',
                        backdropFilter: 'blur(2px)',
                        boxShadow: '0 0 10px rgba(255,255,255,0.2)'
                    }}
                />
            ))}
        </div>

        {/* PHASE 1: CSS Grid Tunnel */}
        <div
          className="w-full h-full absolute top-0 left-0 transition-opacity duration-300"
          style={{
            transformStyle: "preserve-3d",
            transform: `translate3d(0px, ${transform.y}px, ${transform.z}px)`,
            opacity: showGalaxy ? 0 : 1,
            pointerEvents: showGalaxy ? 'none' : 'auto'
          }}
        >
          {walls.map((wall, i) => (
            <div key={i} className="absolute grid"
              style={{
                transform: wall.transform, transformOrigin: wall.origin,
                width: wall.width, height: wall.height,
                left: wall.left, right: wall.right, top: wall.top, bottom: wall.bottom,
                gridTemplateColumns: wall.type === "side" ? `repeat(${GRID_COLS}, 1fr)` : `repeat(${GRID_ROWS}, 1fr)`,
                gridTemplateRows: wall.type === "side" ? `repeat(${GRID_ROWS}, 1fr)` : `repeat(${GRID_COLS}, 1fr)`,
              }}
            >
              {(wall.side === "left" || wall.side === "right") && (
                <div className="absolute inset-0 pointer-events-none">
                  <StockChart color={wall.side === "left" ? "green" : "red"} />
                </div>
              )}
              {gridSquares.map((_, j) => (
                <div key={j} className={`bg-black border ${
                  wall.side === "left" ? "border-green-500 shadow-[0_0_12px_rgba(34,197,94,0.3)]" :
                  wall.side === "right" ? "border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]" :
                  "border-white shadow-[0_0_12px_rgba(255,255,255,0.3)]"
                }`} />
              ))}
            </div>
          ))}
        </div>

        {/* PHASE 2: Galaxy Tunnel */}
        {showGalaxy && (
          <div className="absolute inset-0 z-30">
            <GalaxyTunnel scrollProgress={galaxyProgress} />
          </div>
        )}

        {/* Flash Overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-50"
          style={{
            background: `white`,
            opacity: whiteFlash,
            mixBlendMode: "screen"
          }}
        />
      </div>
    </div>
  );
}