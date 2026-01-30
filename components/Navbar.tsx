'use client';

import GlassPill from './GlassPill';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const Navbar = () => {
  const [isDarkBackground, setIsDarkBackground] = useState(true);

  useEffect(() => {
    const checkBackground = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      
      // 1. Hero Section: Dark BG
      const isHero = scrollY < (windowHeight * 0.9);

      // 2. Expanding Section (Light BG) ends at roughly 5.8 x viewport height
      const isPastWhiteSection = scrollY > (windowHeight * 5.8);

      // If we are in the Hero OR past the white expanding section, 
      // the background is "Dark" (so we need Light Text).
      const shouldBeLightText = isHero || isPastWhiteSection;
      
      setIsDarkBackground(shouldBeLightText);
    };

    window.addEventListener('scroll', checkBackground, { passive: true });
    checkBackground();
    
    return () => window.removeEventListener('scroll', checkBackground);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-[50000] pointer-events-none">
      <div className="flex items-center justify-between px-8 py-6 pointer-events-auto">
        
        {/* Left: MES 2026 Logo (Click to Scroll Top) */}
        <div 
            className="flex items-center cursor-pointer group" 
            onClick={scrollToTop}
        >
          <h1 className="font-serif-display text-2xl font-bold tracking-wide transition-colors duration-300">
            {/* MES changes color based on background, 2026 stays RED */}
            <span style={{ color: isDarkBackground ? 'beige':'beige' }}>MES</span>
            <span className="text-red-600 ml-1.5">2026</span>
          </h1>
        </div>

        {/* Center: Navigation Pills */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <GlassPill darkBackground={isDarkBackground}>
            <div className="flex items-center gap-8 px-4">
              <a 
                href="#speakers" 
                className="text-sm font-medium hover:opacity-70 transition-all duration-300"
                style={{ color: isDarkBackground ? 'white' : 'black' }}
              >
                SPEAKERS
              </a>

              <a 
                href="#events" 
                className="text-sm font-medium hover:opacity-70 transition-all duration-300"
                style={{ color: isDarkBackground ? 'white' : 'black' }}
              >
                EVENTS
              </a>

              <a 
                href="#timeline" 
                className="text-sm font-medium hover:opacity-70 transition-all duration-300"
                style={{ color: isDarkBackground ? 'white' : 'black' }}
              >
                TIMELINE
              </a>

              <a 
                href="#passes" 
                className="text-sm font-medium hover:opacity-70 transition-all duration-300"
                style={{ color: isDarkBackground ? 'white' : 'black' }}
              >
                PASSES
              </a>
            </div>
          </GlassPill>
        </div>

        {/* Right: Get Tickets Button */}
        <div className="flex items-center">
          <Link 
            href="/signup"
            className="px-6 py-2.5 rounded-full font-medium text-sm transition-all hover:scale-105 duration-300 cursor-pointer relative z-50"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: isDarkBackground 
                ? '1px solid rgba(255, 255, 255, 0.2)' 
                : '1px solid rgba(0, 0, 0, 0.1)',
            }}
          >
            GET TICKETS
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;