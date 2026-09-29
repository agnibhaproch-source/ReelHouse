// Image planes bend with scroll velocity (spec 37.2). Planes are sized in CSS pixels.
uniform float uVelocity;
uniform vec2 uViewport;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 p = position;
  vec4 world = modelMatrix * vec4(p, 1.0);
  // Bend along the screen x axis so the whole strip curves like film through a gate.
  float nx = world.x / uViewport.x;
  world.y += sin(nx * 3.14159) * uVelocity * 60.0;
  world.z += cos(uv.y * 3.14159) * abs(uVelocity) * 20.0;
  gl_Position = projectionMatrix * viewMatrix * world;
}
