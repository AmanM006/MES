"use client";
import { useState, useEffect, useRef } from "react";
import * as THREE from "three";

// ==========================================
// 1. NOISE HELPER (Required for the Wireframe Logic)
// ==========================================
const perm = new Uint8Array([151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180]);
function simplex2(xin: number, yin: number) {
  const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
  const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
  let s = (xin + yin) * F2;
  let i = Math.floor(xin + s);
  let j = Math.floor(yin + s);
  let t = (i + j) * G2;
  let X0 = i - t;
  let Y0 = j - t;
  let x0 = xin - X0;
  let y0 = yin - Y0;
  let i1, j1;
  if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }
  let x1 = x0 - i1 + G2;
  let y1 = y0 - j1 + G2;
  let x2 = x0 - 1.0 + 2.0 * G2;
  let y2 = y0 - 1.0 + 2.0 * G2;
  let ii = i & 255;
  let jj = j & 255;
  let n0, n1, n2;
  let t0 = 0.5 - x0 * x0 - y0 * y0;
  if (t0 < 0) n0 = 0.0; else { t0 *= t0; n0 = t0 * t0 * dot(grad2[perm[ii + perm[jj]] % 12], x0, y0); }
  let t1 = 0.5 - x1 * x1 - y1 * y1;
  if (t1 < 0) n1 = 0.0; else { t1 *= t1; n1 = t1 * t1 * dot(grad2[perm[ii + i1 + perm[jj + j1]] % 12], x1, y1); }
  let t2 = 0.5 - x2 * x2 - y2 * y2;
  if (t2 < 0) n2 = 0.0; else { t2 *= t2; n2 = t2 * t2 * dot(grad2[perm[ii + 1 + perm[jj + 1]] % 12], x2, y2); }
  return 70.0 * (n0 + n1 + n2);
}
const grad2 = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[1,0],[-1,0],[0,1],[0,-1],[0,1],[0,-1]];
const dot = (g: number[], x: number, y: number) => g[0]*x + g[1]*y;


// ==========================================
// 2. WIREFRAME TUNNEL (Replaces Glass Shards)
// ==========================================
function WireframeTunnel({ scrollProgress }: { scrollProgress: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef(0);

  useEffect(() => { scrollRef.current = scrollProgress; }, [scrollProgress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // --- SETUP ---
    const ww = window.innerWidth;
    const wh = window.innerHeight;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(ww, wh);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 30, 150); // From snippet

    const camera = new THREE.PerspectiveCamera(45, ww / wh, 0.1, 150);
    // FIX: Set Y to 50 instead of 400 to start INSIDE the tunnel
    camera.position.y = 50; 
    camera.position.z = 400;

    // --- POINTS ---
    const rawPoints = [
      [68.5, 185.5], [1, 262.5], [270.9, 281.9], [345.5, 212.8],
      [178, 155.7], [240.3, 72.3], [153.4, 0.6], [52.6, 53.3], [68.5, 185.5]
    ];
    const vectors: THREE.Vector3[] = [];
    for (let i = 0; i < rawPoints.length; i++) {
      vectors.push(new THREE.Vector3(rawPoints[i][0], Math.random() * 100, rawPoints[i][1]));
    }
    const path = new THREE.CatmullRomCurve3(vectors);
    path.closed = true;

    // --- GEOMETRY ---
    const tubeDetail = 400; 
    const circlesDetail = 8;
    const radius = 8;
    const frames = path.computeFrenetFrames(tubeDetail, true);
    
    const vertices: number[] = [];
    const colors: number[] = [];
    const colorHelper = new THREE.Color();

    for (let i = 0; i < tubeDetail; i++) {
      const normal = frames.normals[i];
      const binormal = frames.binormals[i];
      const index = i / tubeDetail;
      const p = path.getPointAt(index);

      // Color from Noise
      const noiseVal = simplex2(index * 10, 0);
      const hue = ((noiseVal * 60 + 300) % 360) / 360; 
      colorHelper.setHSL(hue, 0.5, 0.5);

      const ringPoints: THREE.Vector3[] = [];
      for (let j = 0; j <= circlesDetail; j++) {
        const position = p.clone();
        const angle = (j / circlesDetail) * Math.PI * 2 + noiseVal;
        const sin = Math.sin(angle);
        const cos = -Math.cos(angle);
        const normalPoint = new THREE.Vector3(0,0,0);
        normalPoint.x = (cos * normal.x + sin * binormal.x);
        normalPoint.y = (cos * normal.y + sin * binormal.y);
        normalPoint.z = (cos * normal.z + sin * binormal.z);
        normalPoint.multiplyScalar(radius);
        position.add(normalPoint);
        ringPoints.push(position);
      }

      for(let k=0; k < ringPoints.length - 1; k++) {
          vertices.push(ringPoints[k].x, ringPoints[k].y, ringPoints[k].z);
          vertices.push(ringPoints[k+1].x, ringPoints[k+1].y, ringPoints[k+1].z);
          colors.push(colorHelper.r, colorHelper.g, colorHelper.b);
          colors.push(colorHelper.r, colorHelper.g, colorHelper.b);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const material = new THREE.LineBasicMaterial({ vertexColors: true, linewidth: 1 });
    const lines = new THREE.LineSegments(geometry, material);
    scene.add(lines);

    // --- ANIMATION LOOP ---
    let animationId: number;
    const animate = () => {
      const scrollVal = scrollRef.current;
      
      // REVERSE LOGIC: 
      // Start Deep (0.5) -> End Out (0.0)
      const startPct = 0.5;
      const endPct = 0.0;
      let percentage = startPct + (scrollVal * (endPct - startPct));
      if (percentage < 0) percentage += 1;

      const p1 = path.getPointAt(percentage % 1);
      const p2 = path.getPointAt((percentage + 0.01) % 1);

      camera.position.set(p1.x, p1.y, p1.z);
      camera.lookAt(p2);

      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block bg-black" />;
}


// ==========================================
// 3. STOCK CHART (Your Original Component)
// ==========================================
function StockChart({ color }: { color: "green" | "red" }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const scale = window.devicePixelRatio || 2;
    canvas.width = 1200 * scale;
    canvas.height = 800 * scale;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    ctx.scale(scale, scale);

    const generateData = () => {
      const points: number[] = [];
      let value = 200;
      for (let i = 0; i < 50; i++) {
        value += (Math.random() - 0.5) * 40;
        value = Math.max(50, Math.min(350, value));
        points.push(value);
      }
      return points;
    };
    let dataPoints = generateData();
    let offset = 0;
    const draw = () => {
      ctx.clearRect(0, 0, 1200, 800);
      ctx.imageSmoothingEnabled = true;
      ctx.lineWidth = 2;
      ctx.strokeStyle = color === "green" ? "rgba(34, 197, 94, 0.5)" : "rgba(239, 68, 68, 0.5)";
      for (let y = 0; y < 800; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1200, y); ctx.stroke(); }
      for (let x = 0; x < 1200; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 800); ctx.stroke(); }
      const candleWidth = 20;
      const spacing = 24;
      for (let i = 0; i < 45; i++) {
        const idx = Math.floor((i + offset) % dataPoints.length);
        const open = dataPoints[idx];
        const close = dataPoints[(idx + 1) % dataPoints.length];
        const high = Math.max(open, close) + Math.random() * 20;
        const low = Math.min(open, close) - Math.random() * 20;
        const isGreen = close > open;
        ctx.fillStyle = color === "green" 
            ? (isGreen ? "rgba(34, 197, 94, 1)" : "rgba(34, 197, 94, 0.6)") 
            : (isGreen ? "rgba(239, 68, 68, 0.6)" : "rgba(239, 68, 68, 1)");
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(i * spacing + candleWidth / 2, high); ctx.lineTo(i * spacing + candleWidth / 2, low); ctx.stroke();
        ctx.fillRect(i * spacing, Math.min(open, close), candleWidth, Math.abs(close - open));
      }
    };
    let animationId: number;
    let lastTime = 0;
    const animate = (time: number) => {
      if (time - lastTime > 100) { offset += 0.2; draw(); lastTime = time; }
      animationId = requestAnimationFrame(animate);
    };
    animate(0);
    return () => cancelAnimationFrame(animationId);
  }, [color]);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-80" style={{ mixBlendMode: "screen" }} />;
}


// ==========================================
// 4. MAIN COMPONENT (Tunnel Integration)
// ==========================================
const TUNNEL_DEPTH_PX = 1650;
const GRID_ROWS = 10;
const GRID_COLS = 20;
const gridSquares = Array.from({ length: GRID_ROWS * GRID_COLS });
const walls = [
  { origin: "left center", transform: "rotateY(90deg)", width: `${TUNNEL_DEPTH_PX}px`, height: "100%", left: "0px", top: "0px", type: "side", side: "left" },
  { origin: "right center", transform: "rotateY(-90deg)", width: `${TUNNEL_DEPTH_PX}px`, height: "100%", right: "0px", top: "0px", type: "side", side: "right" },
  { origin: "top center", transform: "rotateX(-90deg)", height: `${TUNNEL_DEPTH_PX}px`, width: "100%", top: "0px", left: "0px", type: "flat", side: "top" },
  { origin: "bottom center", transform: "rotateX(90deg)", height: `${TUNNEL_DEPTH_PX}px`, width: "100%", bottom: "0px", left: "0px", type: "flat", side: "bottom" },
];

export default function Tunnel() {
  const [transform, setTransform] = useState({ z: 0, y: 0 });
  const [whiteFlash, setWhiteFlash] = useState(0);
  const [showWireframeTunnel, setShowWireframeTunnel] = useState(false);
  const [wireframeProgress, setWireframeProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      const totalScrollHeight = rect.height - windowHeight;
      const scrolled = Math.abs(Math.min(0, rect.top)); 
      const p = Math.max(0, Math.min(1, scrolled / totalScrollHeight));

      // PHASE 1: ENTERING THE GRID TUNNEL (0% - 50%)
      if (p < 0.5) {
        setShowWireframeTunnel(false);
        const localP = p * 2; 
        
        // Move Forward
        const zValue = 200 + (localP * 1300); 
        const yValue = 400 - (localP * 400);
        setTransform({ z: zValue, y: yValue });

        // FLASH START (Longer): Starts at 75% of Phase 1 instead of 80%
        if (localP > 0.75) {
            setWhiteFlash((localP - 0.75) / 0.25); // 0 to 1
        } else {
            setWhiteFlash(0);
        }
      } 
      
      // PHASE 2: WIREFRAME TUNNEL (50% - 100%)
      else {
        setShowWireframeTunnel(true);
        const localP = (p - 0.5) * 2;
        setWireframeProgress(localP); 

        // FLASH END (Longer): Fades out over first 30% of Phase 2 instead of 20%
        if (localP < 0.3) {
            setWhiteFlash(1 - (localP / 0.3));
        } else {
            setWhiteFlash(0);
        }
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    // 800vh total height (Kept exactly as requested)
    <div ref={containerRef} className="relative h-[800vh] w-full bg-black">
      <div className="sticky top-0 h-screen w-full overflow-hidden perspective-[100px]" style={{ perspective: "100px" }}>
        
        {/* === LAYER 1: GRID TUNNEL === */}
        <div
          className="w-full h-full absolute top-0 left-0 transition-opacity duration-0"
          style={{
            transformStyle: "preserve-3d",
            transform: `translate3d(0px, ${transform.y}px, ${transform.z}px)`,
            opacity: showWireframeTunnel ? 0 : 1, // Hide when wireframe starts
            pointerEvents: showWireframeTunnel ? 'none' : 'auto'
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
              {wall.side === "left" && <div className="absolute inset-0 pointer-events-none"><StockChart color="green" /></div>}
              {wall.side === "right" && <div className="absolute inset-0 pointer-events-none"><StockChart color="red" /></div>}
              
              {gridSquares.map((_, j) => {
                let borderColor = "border-fuchsia-500/30";
                let boxShadow = "0 0 15px rgba(168,85,247,0.2)";
                if (wall.side === "left") { borderColor = "border-green-500/40"; boxShadow = "0 0 15px rgba(34,197,94,0.2)"; } 
                else if (wall.side === "right") { borderColor = "border-red-500/40"; boxShadow = "0 0 15px rgba(239,68,68,0.2)"; } 
                else { borderColor = "border-white/10"; boxShadow = "none"; }
                return <div key={j} className={`bg-transparent border ${borderColor}`} style={{ boxShadow }} />;
              })}
            </div>
          ))}
        </div>

        {/* === LAYER 2: WHITE FLASH === */}
        <div 
            className="absolute inset-0 z-50 pointer-events-none bg-white mix-blend-normal"
            style={{ opacity: whiteFlash }}
        />

        {/* === LAYER 3: WIREFRAME TUNNEL === */}
        {showWireframeTunnel && (
          <div className="absolute inset-0 z-40 bg-black">
            <WireframeTunnel scrollProgress={wireframeProgress} />
          </div>
        )}

      </div>
    </div>
  );
}

