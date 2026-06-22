import * as THREE from "three";
import { getActiveSpot } from "@/stores/spotStore";
import { complex, ifft2, type Complex } from "@/lib/waves/fft";
import { generatePhillipsSpectrum } from "@/lib/waves/phillipsSpectrum";

export const IFFT_LENGTH = 256;

const scratchNormal = new THREE.Vector3();

export type OceanSimOptions = {
  size: 32 | 64;
};

/**
 * Phillips IFFT ocean — shared heightfield for GPU mesh + CPU physics.
 */
export class OceanSimulator {
  readonly size: number;
  readonly length = IFFT_LENGTH;
  readonly heightField: Float32Array;
  readonly heightScale: number;

  private h0: Complex[][];
  private h0Conj: Complex[][];
  private omega: Float32Array;
  private freqBuffer: Complex[][];

  constructor(options: OceanSimOptions) {
    this.size = options.size;
    this.heightField = new Float32Array(this.size * this.size);

    const spot = getActiveSpot();
    const { windSpeed, windDirection, amplitude, heightScale } = spot.ifft;
    this.heightScale = heightScale;

    const spec = generatePhillipsSpectrum(
      this.size,
      IFFT_LENGTH,
      windSpeed,
      windDirection,
      amplitude,
    );
    this.h0 = spec.h0;
    this.omega = spec.omega;
    this.h0Conj = this.buildConjugate(this.h0);
    this.freqBuffer = Array.from({ length: this.size }, () =>
      Array.from({ length: this.size }, () => complex(0)),
    );
    this.step(0);
  }

  step(time: number) {
    const n = this.size;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const idx = y * n + x;
        const w = this.omega[idx];
        const wt = w * time;
        const cosWt = Math.cos(wt);
        const sinWt = Math.sin(wt);

        const h0 = this.h0[y][x];
        const h0c = this.h0Conj[y][x];

        const re = h0.re * cosWt + h0.im * sinWt + h0c.re * cosWt - h0c.im * sinWt;
        const im = -h0.re * sinWt + h0.im * cosWt + h0c.re * sinWt + h0c.im * cosWt;

        this.freqBuffer[y][x] = complex(re, im);
      }
    }

    const heights = ifft2(this.freqBuffer, n);
    this.heightField.set(heights);
  }

  sampleHeight(x: number, z: number): number {
    const n = this.size;
    const half = this.length * 0.5;
    const u = ((x + half) / this.length) * n;
    const v = ((z + half) / this.length) * n;

    const x0 = Math.floor(u) % n;
    const y0 = Math.floor(v) % n;
    const x1 = (x0 + 1) % n;
    const y1 = (y0 + 1) % n;
    const fx = u - Math.floor(u);
    const fy = v - Math.floor(v);

    const h00 = this.heightField[y0 * n + x0];
    const h10 = this.heightField[y0 * n + x1];
    const h01 = this.heightField[y1 * n + x0];
    const h11 = this.heightField[y1 * n + x1];

    const hx0 = h00 * (1 - fx) + h10 * fx;
    const hx1 = h01 * (1 - fx) + h11 * fx;
    return (hx0 * (1 - fy) + hx1 * fy) * this.heightScale;
  }

  sampleNormal(x: number, z: number, eps = 0.4): THREE.Vector3 {
    const hL = this.sampleHeight(x - eps, z);
    const hR = this.sampleHeight(x + eps, z);
    const hD = this.sampleHeight(x, z - eps);
    const hU = this.sampleHeight(x, z + eps);
    return scratchNormal.set(hL - hR, 2 * eps, hD - hU).normalize();
  }

  sampleSteepness(x: number, z: number): number {
    const n = this.sampleNormal(x, z);
    return Math.sqrt(1 - n.y * n.y);
  }

  getHeightTexture(): THREE.DataTexture {
    const tex = new THREE.DataTexture(
      this.heightField,
      this.size,
      this.size,
      THREE.RedFormat,
      THREE.FloatType,
    );
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.needsUpdate = true;
    return tex;
  }

  private buildConjugate(h0: Complex[][]): Complex[][] {
    const n = this.size;
    const out: Complex[][] = Array.from({ length: n }, () =>
      Array.from({ length: n }, () => complex(0)),
    );
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const cx = (n - x) % n;
        const cy = (n - y) % n;
        const src = h0[cy][cx];
        out[y][x] = complex(src.re, -src.im);
      }
    }
    return out;
  }
}