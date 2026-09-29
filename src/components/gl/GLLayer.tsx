'use client';

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

/**
 * Persistent full-screen WebGL layer (spec 37): film grain + gate weave + light leaks at a
 * 24fps film cadence, low DPR, paused while the tab is hidden. Replaces the CSS grain while on;
 * off for reduced motion, low-end devices, or the settings toggle.
 */
export function GLLayer() {
  const { webglEnabled } = useMotionPrefs();
  const grain = useUiStore((s) => s.grain);
  const [supported] = useState(() => canUseWebGL());
  const on = webglEnabled && supported && grain > 0;
  const host = useRef<HTMLDivElement>(null);
  const intensity = useRef(grain);

  useEffect(() => {
    intensity.current = grain;
  }, [grain]);

  useEffect(() => {
    document.documentElement.classList.toggle('gl-grain', on);
    const el = host.current;
    if (!on || !el) return;
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1) * 0.6);
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
      uTime: { value: 0 },
      uIntensity: { value: 0.1 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uViolet: { value: new THREE.Color(COLORS.violet) },
      uAmber: { value: new THREE.Color(COLORS.amber) },
    };
    const material = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: withChunks(frag), uniforms, depthTest: false });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);
    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    };
    resize();
    window.addEventListener('resize', resize);
    const start = performance.now();
    const id = setInterval(() => {
      if (document.hidden) return;
      uniforms.uTime.value = (performance.now() - start) / 1000;
      uniforms.uIntensity.value = (intensity.current / 100) * 0.22;
      renderer.render(scene, camera);
    }, 1000 / FPS);
    return () => {
      clearInterval(id);
      window.removeEventListener('resize', resize);
      material.dispose();
      quad.geometry.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      document.documentElement.classList.remove('gl-grain');
    };
  }, [on]);

  if (!on) return null;
  return <div ref={host} aria-hidden="true" className="pointer-events-none fixed inset-0 z-(--z-overlay) mix-blend-overlay" />;
}
