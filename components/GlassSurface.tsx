/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useRef, useId } from 'react';
import type { ReactNode, CSSProperties } from 'react';
import '../app/GlassSurface.css';

type GlassSurfaceProps = {
  children: ReactNode;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  brightness?: number;
  opacity?: number;
  blur?: number;
  distortionScale?: number;
  className?: string;
  style?: CSSProperties;
};

const GlassSurface = ({
  children,
  width,
  height = 56,
  borderRadius = 50,
  brightness = 45,
  opacity = 0.85,
  blur = 12,
  distortionScale = 6, // 🔑 LOW value = smooth
  className = '',
  style = {},
}: GlassSurfaceProps) => {
  const id = useId().replace(/:/g, '-');
  const filterId = `glass-filter-${id}`;

  const feDisplaceRef = useRef<SVGFEDisplacementMapElement | null>(null);

  useEffect(() => {
    feDisplaceRef.current?.setAttribute('scale', String(distortionScale));
  }, [distortionScale]);

  const containerStyle: CSSProperties = {
    ...style,
    ...(width !== undefined && {
      width: typeof width === 'number' ? `${width}px` : width,
    }),
    height: `${height}px`,
    borderRadius: `${borderRadius}px`,
    background: `hsl(0 0% ${brightness}% / ${opacity})`,
    backdropFilter: `url(#${filterId})`,
    WebkitBackdropFilter: `url(#${filterId})`,
  };

  return (
    <div
      className={`glass-surface isolate overflow-hidden ${className}`}
      style={containerStyle}
    >
      {/* SVG FILTER (invisible, only defines the effect) */}
      <svg width="0" height="0">
        <defs>
          <filter
            id={filterId}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
            colorInterpolationFilters="sRGB"
          >
            {/* 1️⃣ Organic noise */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015"
              numOctaves="1"
              seed="2"
              result="noise"
            />

            {/* 2️⃣ Smooth it (VERY important) */}
            <feGaussianBlur
              in="noise"
              stdDeviation="10"
              result="softNoise"
            />

            {/* 3️⃣ Subtle distortion (Chrome-safe) */}
            <feDisplacementMap
              ref={feDisplaceRef}
              in="SourceGraphic"
              in2="softNoise"
              scale={distortionScale}
              xChannelSelector="R"
              yChannelSelector="G"
              result="distorted"
            />

            {/* 4️⃣ Heavy blur hides text warping */}
            <feGaussianBlur
              in="distorted"
              stdDeviation={blur}
              result="blurred"
            />

            {/* 5️⃣ Final output */}
            <feComposite
              in="blurred"
              in2="SourceGraphic"
              operator="over"
            />
          </filter>
        </defs>
      </svg>

      {/* CONTENT (clean, not distorted visually) */}
      <div className="glass-surface-content">
        {children}
      </div>
    </div>
  );
};

export default GlassSurface;
