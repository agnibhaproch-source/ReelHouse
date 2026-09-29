// Film burn: a noise threshold eats the frame with glowing amber edges (spec 37).
uniform float uProgress;
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uVoid;
uniform vec3 uAmber;
uniform vec3 uHot;
varying vec2 vUv;

#include <noise>

void main() {
  vec2 p = vUv * vec2(uResolution.x / uResolution.y, 1.0) * 2.4;
  float n = fbm(p + uTime * 0.15) * 0.5 + 0.5;
  float d = distance(vUv, vec2(0.5, 0.55));
  float field = n * 0.55 + (1.0 - d) * 0.45;
  float t = uProgress * 1.25 - 0.1;
  float burned = smoothstep(t - 0.015, t, field);
  float edge = smoothstep(t - 0.08, t - 0.015, field) - burned;
  vec3 col = mix(uAmber, uHot, edge * 1.5) * edge * 2.2;
  float alpha = max(burned, edge);
  gl_FragColor = vec4(mix(col, uVoid, burned), alpha);
}
