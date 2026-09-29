// Film grain + gate weave + drifting light leaks (spec 37). Composited with mix-blend-mode: overlay,
// so mid-grey (0.5) is neutral.
uniform float uTime;
uniform float uIntensity;
uniform vec2 uResolution;
uniform vec3 uViolet;
uniform vec3 uAmber;
varying vec2 vUv;

#include <noise>

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  // Gate weave: sub-pixel vertical jitter (~0.3px)
  float weave = (hash(vec2(floor(uTime * 24.0), 1.0)) - 0.5) * (0.6 / uResolution.y);
  vec2 uv = vUv + vec2(0.0, weave);
  float frame = floor(uTime * 24.0);
  float g = hash(uv * uResolution + frame) - 0.5;
  // Light leaks: two slow blobs at ~6%
  vec2 p1 = vec2(0.15 + 0.1 * sin(uTime * 0.07), 0.8 + 0.1 * cos(uTime * 0.05));
  vec2 p2 = vec2(0.85 + 0.08 * cos(uTime * 0.06), 0.2 + 0.1 * sin(uTime * 0.04));
  float l1 = smoothstep(0.55, 0.0, distance(uv, p1)) * (0.6 + 0.4 * snoise(vec2(uTime * 0.1, 1.0)));
  float l2 = smoothstep(0.5, 0.0, distance(uv, p2)) * (0.6 + 0.4 * snoise(vec2(uTime * 0.1, 7.0)));
  vec3 leak = uViolet * l1 * 0.06 + uAmber * l2 * 0.06;
  float grain = g * uIntensity;
  gl_FragColor = vec4(vec3(0.5 + grain) + leak, 1.0);
}
