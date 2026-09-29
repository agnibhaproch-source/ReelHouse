'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import vert from '@/shaders/dust.vert.glsl';
import frag from '@/shaders/dust.frag.glsl';
import { COLORS } from '@/lib/tokens';
import { canUseWebGL } from './webglSupport';

const COUNT = 300;

/**
 * Ambient dust drifting in the projector light over the detail hero (spec 37.6): 300 points in
 * a light cone that react slightly to the cursor. Pauses off-screen and while the tab is hidden.
 */
export function DustField({ color }: { color: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el || !canUseWebGL()) return;
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    const dpr = Math.min(window.devicePixelRatio, 1.75);
    renderer.setPixelRatio(dpr);
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
    camera.position.z = 1;

    const geometry = new THREE.BufferGeometry();
    const pos = new Float32Array(COUNT * 3);
    const seed = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = Math.random() * 2 - 1;
      pos[i * 3 + 1] = Math.random() * 2 - 1;
      seed[i] = Math.random();
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    const uniforms = {
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2() },
      uPixelRatio: { value: dpr },
      uColor: { value: new THREE.Color(COLORS.reel).lerp(new THREE.Color(color), 0.25) },
    };
    const material = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    scene.add(points);

    const target = new THREE.Vector2();
    const onMove = (e: PointerEvent) => target.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    window.addEventListener('pointermove', onMove, { passive: true });

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = Boolean(e?.isIntersecting)));
    io.observe(el);
    const resize = () => renderer.setSize(el.clientWidth, el.clientHeight, false);
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    const start = performance.now();
    let raf = 0;
    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden) return;
      uniforms.uTime.value = (t - start) / 1000;
      uniforms.uPointer.value.lerp(target, 0.05);
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [color]);

  return <div ref={host} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-[5]" />;
}
