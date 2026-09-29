'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import vert from '@/shaders/displacement.vert.glsl';
import frag from '@/shaders/displacement.frag.glsl';
import { tmdbImage } from '@/lib/tmdb/images';
import type { HeroSlide } from '@/lib/hero';
import { withChunks } from './shaderSource';
import { canUseWebGL } from './webglSupport';

interface Props {
  slides: HeroSlide[];
  index: number;
  onReady: (ready: boolean) => void;
}

/**
 * WebGL hero displacement transition (spec 37). Renders on demand only (during a transition or
 * resize), pauses with the tab, disposes textures on unmount. The DOM image underneath is the
 * CSS fallback and LCP element.
 */
export function HeroCanvas({ slides, index, onReady }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<{ goTo: (i: number) => void } | null>(null);

  useEffect(() => {
    const el = host.current;
    if (!el || !canUseWebGL()) return;
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;opacity:0;transition:opacity 400ms';
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    const textures = new Map<number, THREE.Texture>();
    const blank = new THREE.DataTexture(new Uint8Array([8, 8, 13, 255]), 1, 1);
    blank.needsUpdate = true;
    const uniforms = {
      uTex1: { value: blank as THREE.Texture },
      uTex2: { value: blank as THREE.Texture },
      uTex1Size: { value: new THREE.Vector2(16, 9) },
      uTex2Size: { value: new THREE.Vector2(16, 9) },
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
    };
    const material = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: withChunks(frag), uniforms });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);
    let current = 0;
    let raf = 0;
    let disposed = false;

    const size = () => {
      const w = el.clientWidth || window.innerWidth;
      const h = el.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      uniforms.uResolution.value.set(w, h);
      renderer.render(scene, camera);
    };
    const load = (i: number) =>
      new Promise<THREE.Texture>((resolve, reject) => {
        const hit = textures.get(i);
        if (hit) return resolve(hit);
        const s = slides[i];
        const url = tmdbImage(s?.backdrop ?? s?.poster, 'w1280');
        if (!url) return reject(new Error('no image'));
        loader.load(
          url,
          (t) => {
            t.colorSpace = THREE.SRGBColorSpace;
            t.minFilter = THREE.LinearFilter;
            textures.set(i, t);
            resolve(t);
          },
          undefined,
          reject,
        );
      });
    const texSize = (t: THREE.Texture) => {
      const img = t.image as { width?: number; height?: number } | undefined;
      return new THREE.Vector2(img?.width ?? 16, img?.height ?? 9);
    };

    void load(0)
      .then((t) => {
        if (disposed) return;
        uniforms.uTex1.value = t;
        uniforms.uTex2.value = t;
        uniforms.uTex1Size.value = texSize(t);
        uniforms.uTex2Size.value = texSize(t);
        size();
        renderer.domElement.style.opacity = '1';
        onReady(true);
        slides.forEach((_, i) => i > 0 && void load(i).catch(() => {}));
      })
      .catch(() => onReady(false));

    api.current = {
      goTo: (i) => {
        if (i === current) return;
        void load(i)
          .then((next) => {
            if (disposed) return;
            cancelAnimationFrame(raf);
            uniforms.uTex2.value = next;
            uniforms.uTex2Size.value = texSize(next);
            const start = performance.now();
            const dur = 1200;
            const frame = (t: number) => {
              if (document.hidden) {
                raf = requestAnimationFrame(frame);
                return;
              }
              const p = Math.min(1, (t - start) / dur);
              uniforms.uProgress.value = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
              uniforms.uTime.value = t / 1000;
              renderer.render(scene, camera);
              if (p < 1) raf = requestAnimationFrame(frame);
              else {
                uniforms.uTex1.value = next;
                uniforms.uTex1Size.value = texSize(next);
                uniforms.uProgress.value = 0;
                renderer.render(scene, camera);
                current = i;
              }
            };
            raf = requestAnimationFrame(frame);
          })
          .catch(() => {});
      },
    };

    const ro = new ResizeObserver(size);
    ro.observe(el);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      onReady(false);
      textures.forEach((t) => t.dispose());
      blank.dispose();
      material.dispose();
      quad.geometry.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      api.current = null;
    };
  }, [slides, onReady]);

  useEffect(() => {
    api.current?.goTo(index);
  }, [index]);

  return <div ref={host} aria-hidden="true" className="absolute inset-0 z-[1]" />;
}
