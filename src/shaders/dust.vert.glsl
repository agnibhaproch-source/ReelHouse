// Dust motes drifting in a projector light cone (spec 37).
uniform float uTime;
uniform vec2 uPointer;
uniform float uPixelRatio;
attribute float aSeed;
varying float vAlpha;

void main() {
  vec3 p = position;
  float t = uTime * (0.04 + aSeed * 0.05);
  p.x += sin(t + aSeed * 40.0) * 0.08 + uPointer.x * 0.05 * aSeed;
  p.y = mod(p.y + t * 0.3 + 1.0, 2.0) - 1.0;
  p.y += uPointer.y * 0.04 * aSeed;
  // Light cone from the top-left projector
  float cone = smoothstep(0.9, 0.0, abs(p.x - (p.y * 0.55 - 0.1)));
  vAlpha = cone * (0.25 + 0.75 * aSeed);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (1.2 + aSeed * 2.6) * uPixelRatio;
}
