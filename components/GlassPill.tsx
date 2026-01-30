/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useRef, useId } from 'react';
import type { ReactNode, CSSProperties } from 'react';

type GlassPillProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  darkBackground?: boolean;
};

const GlassPill = ({
  children,
  className = '',
  style = {},
  darkBackground = true,
}: GlassPillProps) => {
  const id = useId().replace(/:/g, '-');
  const filterId = `glass-pill-${id}`;

  const feDisplaceRef = useRef<SVGFEDisplacementMapElement | null>(null);
  
  const distortionScale = -180;

  useEffect(() => {
    feDisplaceRef.current?.setAttribute('scale', String(distortionScale));
  }, [distortionScale]);

  const containerStyle: CSSProperties = {
    ...style,
    padding: '12px 24px',
    borderRadius: '50px',
    // Much more transparent - almost invisible background
    background: 'rgba(255, 255, 255, 0.02)',
    border: `1px solid ${darkBackground ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)'}`,
    // Apply both standard blur AND the SVG filter
    backdropFilter: `blur(12px) saturate(180%) url(#${filterId})`,
    WebkitBackdropFilter: `blur(12px) saturate(180%) url(#${filterId})`,
    position: 'relative',
    isolation: 'isolate',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  };

  return (
    <div
      className={`glass-pill ${className}`}
      style={containerStyle}
    >
      {/* SVG FILTER */}
      <svg 
        width="0" 
        height="0" 
        style={{ position: 'absolute', width: 0, height: 0 }}
      >
        <defs>
          <filter
            id={filterId}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
            colorInterpolationFilters="sRGB"
          >
            {/* Turbulence for water effect */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.02"
              numOctaves="3"
              seed="2"
              result="turbulence"
            />

            {/* Displacement for ripple */}
            <feDisplacementMap
              ref={feDisplaceRef}
              in="SourceGraphic"
              in2="turbulence"
              scale={distortionScale}
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />

            {/* Light blur */}
            <feGaussianBlur
              in="displaced"
              stdDeviation="8"
              result="blurred"
            />
          </filter>
        </defs>
      </svg>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
};

export default GlassPill;