'use client';

import GlassSurface from '../components/GlassSurface';
import Navbar from '@/components/Navbar';

const GlassNavbar = () => {
  return (
    <GlassSurface
      width={400}
      height={56}
      borderRadius={50}
      backgroundOpacity={0.1}
      saturation={1}
      borderWidth={0.07}
      brightness={50}
      opacity={0.93}
      blur={11}
      displace={0.5}
      distortionScale={-180}
      redOffset={0}
      greenOffset={10}
      blueOffset={20}
    >
      <Navbar />
    </GlassSurface>
  );
};

export default GlassNavbar;