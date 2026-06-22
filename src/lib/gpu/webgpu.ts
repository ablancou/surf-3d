import * as THREE from "three";

export type RendererKind = "webgpu" | "webgl";

export async function createGameRenderer(
  canvas: HTMLCanvasElement,
): Promise<{ renderer: THREE.WebGLRenderer; kind: RendererKind }> {
  if (typeof navigator !== "undefined" && "gpu" in navigator) {
    try {
      const { WebGPURenderer } = await import("three/webgpu");
      const webgpu = new WebGPURenderer({
        canvas,
        antialias: true,
        powerPreference: "high-performance",
      });
      await webgpu.init();
      webgpu.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      webgpu.setSize(canvas.clientWidth, canvas.clientHeight, false);
      return { renderer: webgpu as unknown as THREE.WebGLRenderer, kind: "webgpu" };
    } catch {
      // Fall through to WebGL
    }
  }

  const webgl = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });
  webgl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  return { renderer: webgl, kind: "webgl" };
}