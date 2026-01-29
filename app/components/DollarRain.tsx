import { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

const BILL_COUNT = 750;

function DollarRain() {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  
  // 1. Use useLoader to ensure the texture is loaded before rendering
  // Replace this path with the actual path to your image in the /public folder
  const texture = useLoader(THREE.TextureLoader, '/images/image.png');

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < BILL_COUNT; i++) {
      temp.push({
        t: Math.random() * 100,
        speed: 0.05 + Math.random() * 0.1,
        xFactor: -15 + Math.random() * 30,
        zFactor: -15 + Math.random() * 30,
      });
    }
    return temp;
  }, []);

  const dummy = new THREE.Object3D();

  useFrame((state) => {
    particles.forEach((particle, i) => {
      let { speed, xFactor, zFactor } = particle;
      
      particle.t += speed;
      const y = 20 - (particle.t % 35); 
      
      dummy.position.set(xFactor, y, zFactor);
      
      // Fluttering effect
      dummy.rotation.set(particle.t * 0.8, particle.t * 0.4, particle.t * 0.2);
      // Aspect ratio of a USD bill is roughly 2.3:1
      dummy.scale.set(1.2, 0.5, 1); 
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null!, null!, BILL_COUNT]}>
      <planeGeometry args={[1, 1]} />
      {/* 2. Use MeshBasicMaterial if you don't have lights in your scene. 
          Use transparent: true if your image has an alpha channel (PNG) */}
      <meshBasicMaterial 
        map={texture} 
        side={THREE.DoubleSide} 
        transparent={true}
        depthWrite={true} 
      />
    </instancedMesh>
  );
}

export default DollarRain;