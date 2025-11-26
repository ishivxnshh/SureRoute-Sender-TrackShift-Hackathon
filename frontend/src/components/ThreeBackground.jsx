import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function FloatingOrb() {
  return (
    <mesh position={[0, 0, 0]}>
      <icosahedronGeometry args={[1.5, 1]} />
      <meshStandardMaterial
        color="#6366f1"
        roughness={0.15}
        metalness={0.5}
        wireframe={false}
      />
    </mesh>
  );
}

const ThreeBackground = () => {
  return (
    <div className="three-background">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={['transparent']} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[4, 4, 4]} intensity={0.8} />
        <Suspense fallback={null}>
          <FloatingOrb />
          <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.6} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default ThreeBackground;


