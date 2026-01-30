'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

type ColorBendsProps = {
  className?: string;
  style?: React.CSSProperties;
  rotation?: number;
  speed?: number;
  colors?: string[];
  transparent?: boolean;
  autoRotate?: number;
  scale?: number;
  frequency?: number;
  warpStrength?: number;
  mouseInfluence?: number;
  parallax?: number;
  noise?: number;
};

const MAX_COLORS = 8;

const frag = `
#define MAX_COLORS ${MAX_COLORS}
uniform vec2 uCanvas;
uniform float uTime;
uniform float uSpeed;
uniform vec2 uRot;
uniform int uColorCount;
uniform vec3 uColors[MAX_COLORS];
uniform int uTransparent;
uniform float uScale;
uniform float uFrequency;
uniform float uWarpStrength;
uniform vec2 uPointer;
uniform float uMouseInfluence;
uniform float uParallax;
uniform float uNoise;
varying vec2 vUv;

void main() {
  float t = uTime * uSpeed;
  vec2 p = vUv * 2.0 - 1.0;
  p += uPointer * uParallax * 0.1;

  vec2 rp = vec2(
    p.x * uRot.x - p.y * uRot.y,
    p.x * uRot.y + p.y * uRot.x
  );

  vec2 q = vec2(rp.x * (uCanvas.x / uCanvas.y), rp.y);
  q /= max(uScale, 0.0001);
  q /= 0.5 + 0.2 * dot(q, q);
  q += 0.2 * cos(t) - 7.56;
  q += (uPointer - rp) * uMouseInfluence * 0.2;

  vec3 col = vec3(0.0);
  float a = 1.0;

  vec2 s = q;
  vec3 sumCol = vec3(0.0);
  float cover = 0.0;

  for (int i = 0; i < MAX_COLORS; i++) {
    if (i >= uColorCount) break;
    s -= 0.01;
    vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
    float m = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(i)) / 4.0);
    float w = 1.0 - exp(-6.0 / exp(6.0 * m));
    sumCol += uColors[i] * w;
    cover = max(cover, w);
  }

  col = clamp(sumCol, 0.0, 1.0);
  a = uTransparent > 0 ? cover : 1.0;

  if (uNoise > 0.0) {
    float n = fract(sin(dot(gl_FragCoord.xy + uTime, vec2(12.9898,78.233))) * 43758.5453);
    col += (n - 0.5) * uNoise;
  }

  gl_FragColor = vec4(col, a);
}
`;

const vert = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

export default function ColorBends({
  className,
  style,
  rotation = 0,
  speed = 0.2,
  colors = [],
  transparent = true,
  autoRotate = 0,
  scale = 1,
  frequency = 1,
  warpStrength = 1,
  mouseInfluence = 1,
  parallax = 0.5,
  noise = 0.1
}: ColorBendsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current!;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const geometry = new THREE.PlaneGeometry(2, 2);
    const uColorsArray = Array.from({ length: MAX_COLORS }, () => new THREE.Vector3());

    const material = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      uniforms: {
        uCanvas: { value: new THREE.Vector2(1, 1) },
        uTime: { value: 0 },
        uSpeed: { value: speed },
        uRot: { value: new THREE.Vector2(1, 0) },
        uColorCount: { value: 0 },
        uColors: { value: uColorsArray },
        uTransparent: { value: transparent ? 1 : 0 },
        uScale: { value: scale },
        uFrequency: { value: frequency },
        uWarpStrength: { value: warpStrength },
        uPointer: { value: new THREE.Vector2() },
        uMouseInfluence: { value: mouseInfluence },
        uParallax: { value: parallax },
        uNoise: { value: noise }
      }
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const resize = () => {
      renderer.setSize(container.clientWidth, container.clientHeight, false);
      material.uniforms.uCanvas.value.set(container.clientWidth, container.clientHeight);
    };
    resize();
    window.addEventListener('resize', resize);

    const clock = new THREE.Clock();
    const animate = () => {
      material.uniforms.uTime.value = clock.getElapsedTime();
      const r = (rotation + autoRotate * material.uniforms.uTime.value) * Math.PI / 180;
      material.uniforms.uRot.value.set(Math.cos(r), Math.sin(r));
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    // colors
    const toVec = (h: string) => {
      const n = parseInt(h.replace('#', ''), 16);
      return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
    };
    colors.slice(0, MAX_COLORS).forEach((c, i) => uColorsArray[i].copy(toVec(c)));
    material.uniforms.uColorCount.value = colors.length;

    return () => {
      window.removeEventListener('resize', resize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      container.innerHTML = '';
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        ...style
      }}
    />
  );
}
