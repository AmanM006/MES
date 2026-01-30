/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useRef, useId } from 'react';
import type { ReactNode, CSSProperties } from 'react';

type GlassSurfaceProps = {
  children: ReactNode;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  backgroundOpacity?: number; // Background opacity (separate from overall opacity)
  saturation?: number; // Color saturation
  borderWidth?: number; // Border thickness
  brightness?: number; // Brightness percentage
  opacity?: number; // Overall opacity
  blur?: number; // Blur amount in px
  displace?: number; // Displacement strength
  distortionScale?: number; // Distortion scale (negative values supported)
  redOffset?: number; // Chromatic aberration red channel
  greenOffset?: number; // Chromatic aberration green channel
  blueOffset?: number; // Chromatic aberration blue channel
  className?: string;
  style?: CSSProperties;
};

const GlassSurface = ({
  children,
  width,
  height = 56,
  borderRadius = 50,
  backgroundOpacity = 0.1,
  saturation = 1,
  borderWidth = 0.07,
  brightness = 50,
  opacity = 0.93,
  blur = 11,
  displace = 0.5,
  distortionScale = -180,
  redOffset = 0,
  greenOffset = 10,
  blueOffset = 20,
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
    // Semi-transparent background
    background: `rgba(255, 255, 255, ${backgroundOpacity})`,
    // Border with subtle opacity
    border: `${borderWidth}px solid rgba(255, 255, 255, ${borderWidth * 3})`,
    // Apply the filter
    backdropFilter: `url(#${filterId})`,
    WebkitBackdropFilter: `url(#${filterId})`,
    // Overall opacity
    opacity: opacity,
    // Ensure proper stacking
    position: 'relative' as const,
    isolation: 'isolate' as const,
    overflow: 'hidden' as const,
  };

  return (
    <div
      className={`glass-surface ${className}`}
      style={containerStyle}
    >
      {/* SVG FILTER DEFINITION */}
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
            {/* 1️⃣ Create turbulence for organic distortion */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency={0.01 + (displace * 0.01)}
              numOctaves="2"
              seed="5"
              result="turbulence"
            />

            {/* 2️⃣ Displacement map for water-like distortion */}
            <feDisplacementMap
              ref={feDisplaceRef}
              in="SourceGraphic"
              in2="turbulence"
              scale={distortionScale}
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />

            {/* 3️⃣ Main blur for glass effect */}
            <feGaussianBlur
              in="displaced"
              stdDeviation={blur}
              result="blurred"
            />

            {/* 4️⃣ Brightness adjustment */}
            <feComponentTransfer in="blurred" result="brightened">
              <feFuncR type="linear" slope={brightness / 50} />
              <feFuncG type="linear" slope={brightness / 50} />
              <feFuncB type="linear" slope={brightness / 50} />
            </feComponentTransfer>

            {/* 5️⃣ Saturation adjustment */}
            <feColorMatrix
              in="brightened"
              type="saturate"
              values={saturation}
              result="saturated"
            />

            {/* 6️⃣ CHROMATIC ABERRATION - Split into RGB channels */}
            {/* Red channel offset */}
            <feOffset
              in="saturated"
              dx={redOffset}
              dy={redOffset}
              result="redLayer"
            />
            <feComponentTransfer in="redLayer" result="onlyRed">
              <feFuncR type="identity" />
              <feFuncG type="discrete" tableValues="0" />
              <feFuncB type="discrete" tableValues="0" />
            </feComponentTransfer>

            {/* Green channel offset */}
            <feOffset
              in="saturated"
              dx={greenOffset}
              dy={greenOffset}
              result="greenLayer"
            />
            <feComponentTransfer in="greenLayer" result="onlyGreen">
              <feFuncR type="discrete" tableValues="0" />
              <feFuncG type="identity" />
              <feFuncB type="discrete" tableValues="0" />
            </feComponentTransfer>

            {/* Blue channel offset */}
            <feOffset
              in="saturated"
              dx={blueOffset}
              dy={blueOffset}
              result="blueLayer"
            />
            <feComponentTransfer in="blueLayer" result="onlyBlue">
              <feFuncR type="discrete" tableValues="0" />
              <feFuncG type="discrete" tableValues="0" />
              <feFuncB type="identity" />
            </feComponentTransfer>

            {/* 7️⃣ Combine RGB channels */}
            <feBlend in="onlyRed" in2="onlyGreen" mode="screen" result="redGreen" />
            <feBlend in="redGreen" in2="onlyBlue" mode="screen" result="final" />
          </filter>
        </defs>
      </svg>

      {/* CONTENT */}
      <div 
        className="glass-surface-content"
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: '100%',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default GlassSurface;