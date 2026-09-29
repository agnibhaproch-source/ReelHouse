import * as THREE from 'three';
import vert from '@/shaders/fullscreen.vert.glsl';
import frag from '@/shaders/filmBurn.frag.glsl';
import { COLORS } from '@/lib/tokens';
import { withChunks } from './shaderSource';
import { canUseWebGL } from './webglSupport';

/** One-shot WebGL film-burn over `host`. cover=true burns to black; false burns away to reveal. */
export function runFilmBurn(host: HTMLElement, cover: boolean): Promise<void> {
  if (!canUseWebGL()) return Promise.reject(new Error('webgl unavailable'));
  return new Promise((resolve) => {
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
    host.style.opacity = '1';
    host.style.background = 'transparent';
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
      uProgress: { value: cover ? 0 : 1 },
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uVoid: { value: new THREE.Color(COLORS.void) },
      uAmber: { value: new THREE.Color(COLORS.amber) },
      uHot: { value: new THREE.Color(COLORS.danger) },
    };
    const material = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: withChunks(frag),
      uniforms,
      transparent: true,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);
    const duration = cover ? 650 : 750;
    const start = performance.now();
    const frame = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = cover ? p * p * p : 1 - Math.pow(1 - p, 3);
      uniforms.uProgress.value = cover ? eased : 1 - eased;
      uniforms.uTime.value = t / 1000;
      renderer.render(scene, camera);
      if (p < 1) requestAnimationFrame(frame);
      else {
        if (!cover) {
          host.style.opacity = '0';
          host.style.background = '';
        }
        // Keep the covering frame on screen until the uncover run replaces it.
        setTimeout(
          () => {
            material.dispose();
            quad.geometry.dispose();
            renderer.dispose();
            renderer.forceContextLoss();
            renderer.domElement.remove();
          },
          cover ? 2000 : 0,
        );
        resolve();
      }
    };
    requestAnimationFrame(frame);
  });
}
