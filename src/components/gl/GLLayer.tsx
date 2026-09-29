'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import vert from '@/shaders/fullscreen.vert.glsl';
import frag from '@/shaders/grain.frag.glsl';
import { COLORS } from '@/lib/tokens';
import { useUiStore } from '@/stores/ui';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';
import { withChunks } from './shaderSource';
import { canUseWebGL } from './webglSupport';

const FPS = 24;

function GrainPlane({ intensity }: { intensity: number }) {
  const { size, invalidate } = useThree();
  const mat = useRef<THREE.ShaderMaterial>(null);
  const [uniforms] = useState(() => ({
    uTime: { value: 0 },
    uIntensity: { value: 0.1 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uViolet: { value: new THREE.Color(COLORS.violet) },
    uAmber: { value: new THREE.Color(COLORS.amber) },
  }));
  const [fragmentShader] = useState(() => withChunks(frag));

  useEffect(() => {
    mat.current?.uniforms.uResolution?.value.set(size.width, size.height);
  }, [size]);
  useEffect(() => {
    const u = mat.current?.uniforms.uIntensity;
    // eslint-disable-next-line react-hooks/immutability -- three.js uniforms are mutable by design
    if (u) u.value = (intensity / 100) * 0.22;
    invalidate();
  }, [intensity, invalidate]);

  // 24fps film cadence on a demand frameloop; paused while the tab is hidden.
  useEffect(() => {
    const id = setInterval(() => !document.hidden && invalidate(), 1000 / FPS);
    return () => clearInterval(id);
  }, [invalidate]);
  useFrame(({ clock }) => {
    const u = mat.current?.uniforms.uTime;
    // eslint-disable-next-line react-hooks/immutability -- three.js uniforms are mutable by design
    if (u) u.value = clock.getElapsedTime();
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial ref={mat} vertexShader={vert} fragmentShader={fragmentShader} uniforms={uniforms} transparent depthTest={false} />
    </mesh>
  );
}

/**
 * Persistent full-screen WebGL layer (spec 37): film grain + gate weave + light leaks. Replaces
 * the CSS grain while on; off for reduced motion, low-end devices, or the settings toggle.
 */
export function GLLayer() {
  const { webglEnabled } = useMotionPrefs();
  const grain = useUiStore((s) => s.grain);
  const [supported] = useState(() => canUseWebGL());
  const on = webglEnabled && supported && grain > 0;

  useEffect(() => {
    document.documentElement.classList.toggle('gl-grain', on);
    return () => document.documentElement.classList.remove('gl-grain');
  }, [on]);

  if (!on) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-(--z-overlay) mix-blend-overlay">
      <Canvas dpr={[0.5, 0.75]} frameloop="demand" gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }} orthographic camera={{ position: [0, 0, 1] }}>
        <GrainPlane intensity={grain} />
      </Canvas>
    </div>
  );
}
