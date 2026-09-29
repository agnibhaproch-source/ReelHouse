// Hero slide change: noise displacement + chromatic aberration between two backdrops (spec 37).
uniform sampler2D uTex1;
uniform sampler2D uTex2;
uniform float uProgress;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uTex1Size;
uniform vec2 uTex2Size;
varying vec2 vUv;

#include <noise>

vec2 coverUv(vec2 uv, vec2 tex) {
  float rs = uResolution.x / uResolution.y;
  float ri = tex.x / tex.y;
  vec2 scale = rs > ri ? vec2(1.0, ri / rs) : vec2(rs / ri, 1.0);
  return (uv - 0.5) * scale + 0.5;
}

vec3 sampleRgb(sampler2D t, vec2 uv, vec2 dir, float amt) {
  return vec3(
    texture2D(t, uv + dir * amt).r,
    texture2D(t, uv).g,
    texture2D(t, uv - dir * amt).b
  );
}

void main() {
  float n = fbm(vUv * 3.0 + uTime * 0.05);
  float p = uProgress;
  float wave = sin(p * 3.14159);
  vec2 dir = normalize(vec2(n, n * 0.6) + 0.0001);
  vec2 uv1 = coverUv(vUv, uTex1Size) + dir * p * 0.35 * n;
  vec2 uv2 = coverUv(vUv, uTex2Size) - dir * (1.0 - p) * 0.35 * n;
  float ca = wave * 0.012;
  vec3 a = sampleRgb(uTex1, uv1, dir, ca);
  vec3 b = sampleRgb(uTex2, uv2, dir, ca);
  float edge = smoothstep(p - 0.15, p + 0.15, (n * 0.5 + 0.5) * 0.7 + vUv.x * 0.3);
  vec3 col = mix(b, a, edge);
  gl_FragColor = vec4(col, 1.0);
}
