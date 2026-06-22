import { complex, type Complex } from "@/lib/waves/fft";

/** Phillips ocean spectrum — Tessendorf 2001 */
export function generatePhillipsSpectrum(
  size: number,
  oceanLength: number,
  windSpeed = 12,
  windDir = 0,
  amplitude = 0.0008,
): { h0: Complex[][]; omega: Float32Array } {
  const h0: Complex[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => complex(0)),
  );
  const omega = new Float32Array(size * size);

  const L = (windSpeed * windSpeed) / 9.81;
  const windX = Math.cos(windDir);
  const windZ = Math.sin(windDir);
  const dk = (2 * Math.PI) / oceanLength;
  const rng = seededRandom(42);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const kx = (x - size / 2) * dk;
      const kz = (y - size / 2) * dk;
      const kLen = Math.sqrt(kx * kx + kz * kz);

      if (kLen < 0.00001) continue;

      const kDotWind = (kx * windX + kz * windZ) / kLen;
      const phillips =
        amplitude *
        Math.exp(-1 / (kLen * L * kLen * L)) /
        (kLen * kLen * kLen * kLen) *
        kDotWind *
        kDotWind;

      const gauss1 = gaussianRandom(rng);
      const gauss2 = gaussianRandom(rng);
      h0[y][x] = complex(gauss1 * Math.sqrt(phillips / 2), gauss2 * Math.sqrt(phillips / 2));
      omega[y * size + x] = Math.sqrt(9.81 * kLen);
    }
  }

  return { h0, omega };
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function gaussianRandom(rng: () => number) {
  const u1 = Math.max(rng(), 1e-6);
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}