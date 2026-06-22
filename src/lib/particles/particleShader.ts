export const particleVertexShader = /* glsl */ `
attribute float aLife;
attribute float aSize;
attribute float aKind;

varying float vLife;
varying float vKind;

void main() {
  vLife = aLife;
  vKind = aKind;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  float lifeScale = smoothstep(0.0, 0.15, aLife);
  gl_PointSize = aSize * lifeScale * (280.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const particleFragmentShader = /* glsl */ `
varying float vLife;
varying float vKind;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;

  float alpha = smoothstep(0.5, 0.1, d) * smoothstep(0.0, 0.2, vLife);
  vec3 spray = vec3(0.85, 0.95, 1.0);
  vec3 foam = vec3(0.95, 0.98, 1.0);
  vec3 splash = vec3(0.7, 0.88, 1.0);

  vec3 color = vKind < 0.5 ? spray : (vKind < 1.5 ? foam : splash);
  gl_FragColor = vec4(color, alpha * 0.85);
}
`;