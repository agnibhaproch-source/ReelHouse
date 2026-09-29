// Edge RGB shift from scroll velocity + liquid ripple from the pointer (specs 37.2, 37.3).
uniform sampler2D uTex;
uniform vec2 uPlane;
uniform vec2 uTexSize;
uniform float uVelocity;
uniform vec2 uPointer;
uniform float uHover;
uniform float uTime;
varying vec2 vUv;

vec2 coverUv(vec2 uv) {
  float rs = uPlane.x / uPlane.y;
  float ri = uTexSize.x / uTexSize.y;
  vec2 scale = rs > ri ? vec2(1.0, ri / rs) : vec2(rs / ri, 1.0);
  return (uv - 0.5) * scale + 0.5;
}

void main() {
  vec2 uv = vUv;
  float d = distance(uv * uPlane / uPlane.y, uPointer * uPlane / uPlane.y);
  float ripple = sin(d * 28.0 - uTime * 6.0) * exp(-d * 5.0) * 0.012 * uHover;
  uv += normalize(uv - uPointer + 0.0001) * ripple;
  // Hover zoom inside the mask
  uv = (uv - 0.5) * (1.0 - 0.05 * uHover) + 0.5;
  vec2 c = coverUv(uv);
  float shift = abs(uVelocity) * 0.012 * (0.3 + distance(vUv, vec2(0.5)));
  vec3 col = vec3(texture2D(uTex, c + vec2(shift, 0.0)).r, texture2D(uTex, c).g, texture2D(uTex, c - vec2(shift, 0.0)).b);
  gl_FragColor = vec4(col, 1.0);
}
