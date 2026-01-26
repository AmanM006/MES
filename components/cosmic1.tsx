"use client";

import { useEffect, useState } from "react";

export default function CosmicBackground1() {
  const [scroll, setScroll] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const windowHeight = window.innerHeight;
      const scrollPixels = window.scrollY;
      
      // Only show AFTER hero section (after 1vh scroll)
      // Fade out when tunnel starts (around 2-3vh)
      const startFade = windowHeight * 1; // Start showing after 1vh
      const endFade = windowHeight * 3; // Fade out at 3vh
      
      if (scrollPixels < startFade) {
        setScroll(-1); // Hidden before hero ends
      } else if (scrollPixels < endFade) {
        const fadeProgress = (scrollPixels - startFade) / (endFade - startFade);
        setScroll(fadeProgress);
      } else {
        setScroll(1); // Fully faded out
      }
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Hidden until after hero, then fades in and out
  if (scroll < 0) return null;
  
  const opacity = scroll < 0.5 ? scroll * 2 : (1 - scroll) * 2;

  return (
    <div 
      className="fixed inset-0 pointer-events-none"
      style={{ 
        zIndex: 5,
        opacity: opacity,
        transition: "opacity 0.3s ease-out"
      }}
    >
      {/* Chromatic aberration oil spill effect - LEFT SIDE */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1/2"
        style={{
          background: `
            radial-gradient(ellipse at left center,
              rgba(255, 0, 255, 0.35) 0%,
              rgba(0, 255, 255, 0.25) 20%,
              rgba(255, 255, 0, 0.18) 40%,
              transparent 70%
            )
          `,
          filter: "blur(60px)",
          mixBlendMode: "screen"
        }}
      />

      {/* Chromatic aberration oil spill effect - RIGHT SIDE */}
      <div 
        className="absolute right-0 top-0 bottom-0 w-1/2"
        style={{
          background: `
            radial-gradient(ellipse at right center,
              rgba(0, 255, 255, 0.35) 0%,
              rgba(255, 0, 255, 0.25) 20%,
              rgba(255, 100, 0, 0.18) 40%,
              transparent 70%
            )
          `,
          filter: "blur(60px)",
          mixBlendMode: "screen"
        }}
      />

      {/* Animated rainbow gradient wave */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            conic-gradient(from 180deg at 50% 50%,
              rgba(255, 0, 255, 0.25),
              rgba(0, 255, 255, 0.2),
              rgba(255, 255, 0, 0.15),
              rgba(255, 0, 255, 0.25)
            )
          `,
          filter: "blur(80px)",
          animation: "rotate 30s linear infinite",
          opacity: 0.6
        }}
      />

      {/* Subtle stars */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 0.5 + "px",
              height: Math.random() * 2 + 0.5 + "px",
              left: Math.random() * 100 + "%",
              top: Math.random() * 100 + "%",
              opacity: Math.random() * 0.3 + 0.1,
              animation: `twinkle ${Math.random() * 4 + 3}s infinite ease-in-out`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Bottom tunnel glow preview */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1/2"
        style={{
          background: `
            linear-gradient(to top,
              rgba(168, 85, 247, 0.2) 0%,
              rgba(168, 85, 247, 0.05) 30%,
              transparent 100%
            )
          `,
          opacity: scroll * 1.5 // Appears as you scroll
        }}
      />

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.4; }
        }

        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}