'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import vert from '@/shaders/scrollWave.vert.glsl';
import frag from '@/shaders/ripple.frag.glsl';
import { clamp } from '@/lib/utils';
import { canUseWebGL } from './webglSupport';

interface Plane {
  el: HTMLElement;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  hover: number;
  target: number;
}

/**
 * DOM-synced WebGL planes for the detail gallery (specs 37.2 + 37.3): one fixed canvas; each
 * `[data-gl-src]` element gets a plane matched to its rect every frame. Planes bend with scroll
 * velocity, split RGB at the edges and ripple under the pointer. DOM images stay as fallback and
 * are only hidden once their texture is live.
 */
export function GalleryGL({ scope }: { scope: React.RefObject<HTMLElement | null> }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = scope.current;
    const el = host.current;
    if (!root || !el || !canUseWebGL()) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.domElement.style.cssText =
      'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none';
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 0, 1, -1000, 1000);
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    const planes: Plane[] = [];
    const geometry = new THREE.PlaneGeometry(1, 1, 24, 12);
    let velocity = 0;
    let lastY = window.scrollY;
    let raf = 0;
    let visible = false;
    let disposed = false;

    const size = () => {
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      camera.left = 0;
      camera.right = window.innerWidth;
      camera.top = 0;
      camera.bottom = window.innerHeight;
      camera.updateProjectionMatrix();
    };
    size();
    window.addEventListener('resize', size);

    root.querySelectorAll<HTMLElement>('[data-gl-src]').forEach((node) => {
      const src = node.dataset.glSrc;
      if (!src) return;
      loader.load(src, (tex) => {
        if (disposed) return tex.dispose();
        tex.colorSpace = THREE.SRGBColorSpace;
        const img = tex.image as { width: number; height: number };
        const material = new THREE.ShaderMaterial({
          vertexShader: vert,
          fragmentShader: frag,
          uniforms: {
            uTex: { value: tex },
            uPlane: { value: new THREE.Vector2(1, 1) },
            uTexSize: { value: new THREE.Vector2(img.width, img.height) },
            uVelocity: { value: 0 },
            uPointer: { value: new THREE.Vector2(0.5, 0.5) },
            uHover: { value: 0 },
            uTime: { value: 0 },
            uViewport: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
          },
        });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        const plane: Plane = { el: node, mesh, hover: 0, target: 0 };
        planes.push(plane);
        node.addEventListener('pointerenter', () => (plane.target = 1));
        node.addEventListener('pointerleave', () => (plane.target = 0));
        node.addEventListener('pointermove', (e) => {
          const r = node.getBoundingClientRect();
          material.uniforms.uPointer!.value.set(
            (e.clientX - r.left) / r.width,
            1 - (e.clientY - r.top) / r.height,
          );
        });
        node.dataset.glLive = 'true';
      });
    });

    const io = new IntersectionObserver(([e]) => (visible = Boolean(e?.isIntersecting)));
    io.observe(root);

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden) {
        renderer.domElement.style.opacity = '0';
        return;
      }
      renderer.domElement.style.opacity = '1';
      const y = window.scrollY;
      velocity += (clamp((y - lastY) / 30, -1, 1) - velocity) * 0.12;
      lastY = y;
      for (const p of planes) {
        const r = p.el.getBoundingClientRect();
        p.hover += (p.target - p.hover) * 0.08;
        p.mesh.position.set(r.left + r.width / 2, r.top + r.height / 2, 0);
        p.mesh.scale.set(r.width, -r.height, 1);
        const u = p.mesh.material.uniforms;
        u.uPlane!.value.set(r.width, r.height);
        u.uVelocity!.value = velocity;
        u.uHover!.value = p.hover;
        u.uTime!.value = t / 1000;
        u.uViewport!.value.set(window.innerWidth, window.innerHeight);
        p.mesh.visible = r.bottom > 0 && r.top < window.innerHeight;
      }
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('resize', size);
      for (const p of planes) {
        delete p.el.dataset.glLive;
        (p.mesh.material.uniforms.uTex!.value as THREE.Texture).dispose();
        p.mesh.material.dispose();
      }
      geometry.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [scope]);

  return <div ref={host} aria-hidden="true" className="pointer-events-none" />;
}
