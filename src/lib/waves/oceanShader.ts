import { MAX_WAVES } from "./waveConfig";

export const oceanVertexShader = /* glsl */ `
#include <common>

uniform float uTime;
uniform vec4 uWaveA[${MAX_WAVES}];
uniform vec4 uWaveB[${MAX_WAVES}];

varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vFoam;
varying float vDepth;

vec3 gerstner(vec3 p, vec4 wa, vec4 wb, inout float foam, inout vec3 tangent, inout vec3 binormal) {
  float amp = wa.x;
  float wl = wa.y;
  float speed = wa.z;
  float steep = wa.w;
  float dirX = wb.x;
  float dirZ = wb.y;

  float k = 6.28318530718 / wl;
  float phase = k * (dirX * p.x + dirZ * p.z) - speed * uTime;
  float sinP = sin(phase);
  float cosP = cos(phase);
  float qa = steep * amp;
  float wkSin = k * amp * sinP;
  float wkCos = k * amp * cosP;

  p.x += dirX * qa * cosP;
  p.z += dirZ * qa * cosP;
  p.y += amp * sinP;

  tangent.x -= dirX * dirX * qa * wkSin;
  tangent.z -= dirX * dirZ * qa * wkSin;
  binormal.x -= dirX * dirZ * qa * wkSin;
  binormal.z -= dirZ * dirZ * qa * wkSin;
  tangent.y += dirX * wkCos;
  binormal.y += dirZ * wkCos;

  foam = max(foam, abs(wkCos) * steep);
  return p;
}

void main() {
  vec3 p = position;
  float foam = 0.0;
  vec3 tangent = vec3(1.0, 0.0, 0.0);
  vec3 binormal = vec3(0.0, 0.0, 1.0);

  for (int i = 0; i < ${MAX_WAVES}; i++) {
    p = gerstner(p, uWaveA[i], uWaveB[i], foam, tangent, binormal);
  }

  vec3 N = normalize(cross(binormal, tangent));

  vec4 world = modelMatrix * vec4(p, 1.0);
  vWorldPos = world.xyz;
  vFoam = foam;
  vDepth = world.y;
  vNormal = normalize(mat3(modelMatrix) * N);

  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const oceanFragmentShader = /* glsl */ `
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
  float spec = pow(max(dot(N, H), 0.0), 96.0);
  float diffuse = max(dot(N, L), 0.0) * 0.4 + 0.22;

  float depthMix = smoothstep(-2.5, 1.2, vDepth);
  vec3 water = mix(uDeepColor, uShallowColor, depthMix);

  float crestFoam = smoothstep(uFoamThreshold, uFoamThreshold + 0.35, vFoam);
  vec3 color = mix(water, uFoamColor, crestFoam * 0.85);

  color += vec3(spec * 0.55);
  color = mix(color, uShallowColor * 1.2, fresnel * 0.45);
  color *= diffuse;

  gl_FragColor = vec4(color, 1.0);
}
`;