import React, { useRef, useMemo, Suspense, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, useTexture, Text3D, Center } from '@react-three/drei';
import * as THREE from 'three';

function ImageRings() {
  // Sử dụng ảnh mặc định thay vì ảnh bạn đã gửi
  const texture = useTexture('https://picsum.photos/seed/love/200/200');
  const count = 2000;
  
  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    const color = new THREE.Color();
    
    for (let i = 0; i < count; i++) {
      const radius = 14.0 + Math.random() * 35.0;
      const theta = Math.random() * 2 * Math.PI;
      
      pos[i * 3] = radius * Math.cos(theta);
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8.0;
      pos[i * 3 + 2] = radius * Math.sin(theta);
      
      color.setHSL(Math.random(), 0.4, 0.7 + Math.random() * 0.3);
      cols[i * 3] = color.r;
      cols[i * 3 + 1] = color.g;
      cols[i * 3 + 2] = color.b;
    }
    return { positions: pos, colors: cols };
  }, [count]);

  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group rotation={[Math.PI / 12, 0, 0]}>
      <points ref={groupRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial 
          map={texture} 
          size={3.0} 
          vertexColors 
          transparent 
          opacity={0.8}
          alphaTest={0.01}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

function Planet() {
  const planetRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  useFrame((_, delta) => {
    if (planetRef.current) {
      planetRef.current.rotation.y += delta * 0.5;
    }
    if (materialRef.current) {
      materialRef.current.uniforms.time.value += delta;
    }
  });

  const shaderArgs = useMemo(() => ({
    uniforms: {
      time: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      uniform float time;

      void main() {
        float t = time * 0.2;

        // 🌈 Gradient cầu vồng mượt
        vec3 color = vec3(
          0.5 + 0.5 * sin(t + vUv.x * 6.0),
          0.5 + 0.5 * sin(t + vUv.y * 6.0 + 2.0),
          0.5 + 0.5 * sin(t + 2.0)
        );

        // ✨ glow viền
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);
        float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 2.0);

        color += vec3(1.0, 0.6, 1.0) * fresnel * 1.5;

        gl_FragColor = vec4(color, 1.0);
      }
    `
  }), []);

  return (
    <group>
      <mesh ref={planetRef}>
        <sphereGeometry args={[5.2, 32, 32]} />
        <meshBasicMaterial color="#ff99ff" transparent opacity={0.15} />
      </mesh>
      <mesh ref={planetRef}>
        <sphereGeometry args={[5, 64, 64]} />
        <shaderMaterial ref={materialRef} args={[shaderArgs]} />
      </mesh>
    </group>
  );
}

function TextRing() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5;
    }
  });

  const texts = [];
  const radius = 6;
  const count = 20;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    texts.push(
      <group 
        key={i} 
        position={[
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        ]}
        rotation={[0, -angle + Math.PI / 2, 0]}
      >
        <Center>
          <Text3D 
            font="https://threejs.org/examples/fonts/helvetiker_regular.typeface.json"
            size={0.5} 
            height={0.05}
          >
            LoveYou
            <meshBasicMaterial color="white" />
          </Text3D>
        </Center>
      </group>
    );
  }

  return <group ref={groupRef}>{texts}</group>;
}

function PurpleStars() {
  const count = 15000;
  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    const szs = new Float32Array(count);
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const r = 40 + Math.random() * 120;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      // Bảng màu tím, hồng, xanh lơ (Purple/Pink/Cyan palette)
      color.setHSL(0.7 + Math.random() * 0.2, 0.8, 0.4 + Math.random() * 0.6);
      cols[i * 3] = color.r;
      cols[i * 3 + 1] = color.g;
      cols[i * 3 + 2] = color.b;

      szs[i] = 0.8 + Math.random() * 1.5; // Kích thước nhỏ lại theo yêu cầu
    }
    return { positions: pos, colors: cols, sizes: szs };
  }, [count]);

  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value += delta;
    }
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.015;
      groupRef.current.rotation.z += delta * 0.005;
    }
  });

  const shaderArgs = useMemo(() => ({
    uniforms: {
      time: { value: 0 }
    },
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      varying float vAlpha;
      uniform float time;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float twinkle = sin(time * 1.5 + position.x * 50.0 + position.y * 50.0) * 0.5 + 0.5;
        vAlpha = 0.4 + twinkle * 0.6;
        gl_PointSize = size * (200.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        float d = distance(gl_PointCoord, vec2(0.5));
        if (d > 0.5) discard;
        float alpha = smoothstep(0.5, 0.0, d) * vAlpha;
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  }), []);

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
          <bufferAttribute attach="attributes-size" count={count} array={sizes} itemSize={1} />
        </bufferGeometry>
        <shaderMaterial ref={materialRef} args={[shaderArgs]} />
      </points>
    </group>
  );
}

function SystemGroup({ children, introFinished, setIntroFinished }: { children: React.ReactNode, introFinished: boolean, setIntroFinished: (v: boolean) => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const elapsedRef = useRef(0);
  const duration = 5.0; // 5 seconds

  useFrame((_, delta) => {
    if (introFinished) return;
    
    elapsedRef.current += delta;
    const progress = Math.min(elapsedRef.current / duration, 1.0);
    
    // Easing: easeOutQuart
    const ease = 1 - Math.pow(1 - progress, 4);

    if (groupRef.current) {
      // Scale: 6.0 -> 1.0 (thu nhỏ từ hành tinh nhỏ dần)
      const currentScale = 6.0 - 5.0 * ease;
      groupRef.current.scale.set(currentScale, currentScale, currentScale);

      // Position Y: -30 -> 0 (di chuyển hướng lên trên)
      const currentY = -30 + 30 * ease;
      groupRef.current.position.y = currentY;

      // Rotation X: Math.PI / 4 -> 0 (từ nằm ngang dần nghiêng về vị trí cũ)
      const currentRotX = (Math.PI / 4) * (1 - ease);
      groupRef.current.rotation.x = currentRotX;
    }

    if (progress === 1.0) {
      setIntroFinished(true);
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

function Scene() {
  const [introFinished, setIntroFinished] = useState(false);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={2} color="#e879f9" />
      <pointLight position={[-10, -10, -10]} intensity={1} color="#c084fc" />
      
      {/* Ngôi sao tùy chỉnh với bảng màu tím và hiệu ứng hòa trộn AdditiveBlending */}
      <PurpleStars />
      
      <SystemGroup introFinished={introFinished} setIntroFinished={setIntroFinished}>
        <Planet />
        <TextRing />
        <Suspense fallback={null}>
          <ImageRings />
        </Suspense>
      </SystemGroup>
      
      <OrbitControls 
        enableZoom={introFinished} 
        enablePan={false} 
        enableRotate={introFinished} 
        autoRotate={introFinished} 
        autoRotateSpeed={1.0}
      />
    </>
  );
}

export default function App() {
  return (
    <div className="w-full h-screen bg-[#1a0b2e] overflow-hidden relative">
      <Canvas camera={{ position: [0, 15, 55], fov: 45 }}>
        <color attach="background" args={['#1a0b2e']} />
        <Scene />
      </Canvas>
    </div>
  );
}
