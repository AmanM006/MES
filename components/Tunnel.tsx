"use client";

import { useState, useEffect, useRef } from "react";

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

// --- MAIN ORCHESTRATOR ---
const TUNNEL_DEPTH_PX = 1650;
const GRID_ROWS = 10;
const GRID_COLS = 20;

export default function Tunnel() {
  const tunnelRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ z: -50, y: 0 });
  const [whiteFlash, setWhiteFlash] = useState(0);

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
      
      // Tunnel travels from 0px to 9000px, then flashes white
      const TUNNEL_END = 9000;
      const FLASH_DURATION = 726; // 9000 to 9726
      const FLASH_END = TUNNEL_END + FLASH_DURATION;

      // PHASE 1: STOCK TUNNEL (0px to 9000px)
      if (scrollY < TUNNEL_END) {
        const p = scrollY / TUNNEL_END;
        const zValue = -50 + (p * 1500); 
        setTransform({ z: zValue, y: 0 });
        setWhiteFlash(0);
      } 
      // PHASE 2: WHITE FLASH (9000px to 9726px)
      else if (scrollY < FLASH_END) {
        const p = (scrollY - TUNNEL_END) / FLASH_DURATION;
        setWhiteFlash(p); // Fades white from 0 to 1
      }
      // PHASE 3: AFTER FLASH (hold white at max)
      else {
        setWhiteFlash(1);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div ref={tunnelRef} className="relative h-[1000vh] bg-black">
      <div className="w-full h-screen sticky top-0 overflow-hidden" 
           style={{ perspective: "400px", transformStyle: "preserve-3d" }}>
        
        {/* CSS Grid Stock Tunnel */}
        <div
          className="w-full h-full absolute top-0 left-0"
          style={{
            transformStyle: "preserve-3d",
            transform: `translateZ(${transform.z}px)`,
            opacity: 1 - whiteFlash, // Fade out during flash
            transition: 'opacity 0.1s',
          }}
        >
          {walls.map((wall, i) => (
            <div key={i} className="absolute grid"
              style={{
                transform: wall.transform, 
                transformOrigin: wall.origin,
                width: wall.width, 
                height: wall.height,
                left: wall.left, 
                right: wall.right, 
                top: wall.top, 
                bottom: wall.bottom,
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

        {/* White Flash Overlay */}
        {whiteFlash > 0 && (
          <div
            className="absolute inset-0 pointer-events-none z-50"
            style={{
              background: 'white',
              opacity: whiteFlash,
            }}
          />
        )}
      </div>
    </div>
  );
}