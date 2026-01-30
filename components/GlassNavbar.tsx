'use client';

import GlassSurface from '../components/GlassSurface';
import Navbar from '@/components/Navbar';

const GlassNavbar = () => {
  return (
    <GlassSurface
  width={400}
  height={56}
  borderRadius={50}
  brightness={45}
  opacity={0.85}
  blur={12}
  distortionScale={6}
>

      <Navbar />
    </GlassSurface>
  );
};

export default GlassNavbar;
