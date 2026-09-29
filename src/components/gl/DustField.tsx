'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import vert from '@/shaders/dust.vert.glsl';
import frag from '@/shaders/dust.frag.glsl';
import { canUseWebGL } from './webglSupport';

const COUNT = 300;

function Dust({ color }: { color: string }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { gl } = useThree();
  const [geometry] = useState(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(COUNT * 3);
    const seed = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = Math.random() * 2 - 1;
      pos[i * 3 + 1] = Math.random() * 2 - 1;
      pos[i * 3 + 2] = 0;
      seed[i] = Math.random();
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    return g;
  });
  const [uniforms] = useState(() => ({
    uTime: { value: 0 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uPixelRatio: { value: 1 },
    uColor: { value: new THREE.Color('#ede8df') },
  }));

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => {
    const m = mat.current;
    if (!m) return;
    m.uniforms.uPixelRatio!.value = gl.getPixelRatio();
    (m.uniforms.uColor!.value as THREE.Color).set('#ede8df').lerp(new THREE.Color(color), 0.25);
  }, [gl, color]);

  useFrame(({ clock, pointer }) => {
    const m = mat.current;
    if (!m) return;
    m.uniforms.uTime!.value = clock.getElapsedTime();
    (m.uniforms.uPointer!.value as THREE.Vector2).lerp(pointer, 0.05);
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial ref={mat} vertexShader={vert} fragmentShader={frag} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

/** Ambient dust drifting in the projector light over the detail hero (spec 37.6). */
export function DustField({ color }: { color: string }) {
  const [ok] = useState(() => canUseWebGL());
  const [visible, setVisible] = useState(true);
  const host = useRef<HTMLDivElement>(null);

  // Pause when scrolled away or tab hidden.
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(Boolean(e?.isIntersecting) && !document.hidden));
    io.observe(el);
    const onVis = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  if (!ok) return null;
  return (
    <div ref={host} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-[5]">
      <Canvas dpr={[1, 1.75]} frameloop={visible ? 'always' : 'never'} gl={{ antialias: false, alpha: true }} camera={{ position: [0, 0, 1] }} orthographic>
        <Dust color={color} />
      </Canvas>
    </div>
  );
}
