import * as THREE from "three";

export type RendererKind = "webgpu" | "webgl";

/** WebGL only — WebGPURenderer breaks R3F (no getContextAttributes) and our GLSL ocean shaders. */
export async function createGameRenderer(
  canvas: HTMLCanvasElement,
): Promise<{ renderer: THREE.WebGLRenderer; kind: RendererKind }> {
  const webgl = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });
  webgl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  return { renderer: webgl, kind: "webgl" };
}