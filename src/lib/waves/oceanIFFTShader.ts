export const ifftOceanVertexShader = /* glsl */ `
#include <common>

uniform float uTime;
uniform sampler2D uHeightMap;
uniform float uOceanSize;
uniform float uHeightScale;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vFoam;
varying float vDepth;

float sampleH(vec2 worldXZ) {
  vec2 uv = worldXZ / uOceanSize + 0.5;
  return texture2D(uHeightMap, uv).r * uHeightScale;
}

void main() {
  vec3 p = position;
  float h = sampleH(p.xz);
  float hR = sampleH(p.xz + vec2(0.8, 0.0));
  float hF = sampleH(p.xz + vec2(0.0, 0.8));
  float hL = sampleH(p.xz - vec2(0.8, 0.0));
  float hB = sampleH(p.xz - vec2(0.0, 0.8));

  p.y += h;
  vec3 tangent = vec3(1.0, hR - hL, 0.0);
  vec3 binormal = vec3(0.0, hF - hB, 1.0);
  vec3 N = normalize(cross(binormal, tangent));

  vec4 world = modelMatrix * vec4(p, 1.0);
  vWorldPos = world.xyz;
  vNormal = normalize(mat3(modelMatrix) * N);
  vFoam = abs(hR - hL) + abs(hF - hB);
  vDepth = world.y;

  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const ifftOceanFragmentShader = /* glsl */ `
#include <common>

uniform vec3 uDeepColor;
uniform vec3 uShallowColor;
uniform vec3 uFoamColor;
uniform vec3 uSunDirection;
uniform float uFoamThreshold;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vFoam;
varying float vDepth;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 L = normalize(uSunDirection);
  vec3 H = normalize(L + V);

  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  float spec = pow(max(dot(N, H), 0.0), 128.0);
  float diffuse = max(dot(N, L), 0.0) * 0.42 + 0.2;

  float depthMix = smoothstep(-2.5, 1.5, vDepth);
  vec3 water = mix(uDeepColor, uShallowColor, depthMix);

  float crestFoam = smoothstep(uFoamThreshold, uFoamThreshold + 0.4, vFoam);
  vec3 color = mix(water, uFoamColor, crestFoam * 0.9);

  color += vec3(spec * 0.6);
  color = mix(color, uShallowColor * 1.25, fresnel * 0.5);
  color *= diffuse;

  gl_FragColor = vec4(color, 1.0);
}
`;