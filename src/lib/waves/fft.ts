export type Complex = { re: number; im: number };

export function complex(re: number, im = 0): Complex {
  return { re, im };
}

/** In-place radix-2 Cooley-Tukey FFT. Length must be power of 2. */
export function fft1d(input: Complex[], inverse = false): Complex[] {
  const n = input.length;
  const out = input.map((c) => ({ re: c.re, im: c.im }));

  // Bit-reversal permutation
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
  }

  const sign = inverse ? 1 : -1;
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (sign * 2 * Math.PI) / len;
    const wLen = { re: Math.cos(ang), im: Math.sin(ang) };
    for (let i = 0; i < n; i += len) {
      let w = { re: 1, im: 0 };
      for (let j = 0; j < len / 2; j++) {
        const u = out[i + j];
        const v = {
          re: out[i + j + len / 2].re * w.re - out[i + j + len / 2].im * w.im,
          im: out[i + j + len / 2].re * w.im + out[i + j + len / 2].im * w.re,
        };
        out[i + j] = { re: u.re + v.re, im: u.im + v.im };
        out[i + j + len / 2] = { re: u.re - v.re, im: u.im - v.im };
        const wNext = {
          re: w.re * wLen.re - w.im * wLen.im,
          im: w.re * wLen.im + w.im * wLen.re,
        };
        w = wNext;
      }
    }
  }

  if (inverse) {
    for (let i = 0; i < n; i++) {
      out[i].re /= n;
      out[i].im /= n;
    }
  }

  return out;
}

/** 2D inverse FFT on a size×size complex grid (row-col algorithm). */
export function ifft2(grid: Complex[][], size: number): Float32Array {
  const rows: Complex[][] = [];
  for (let y = 0; y < size; y++) {
    rows.push(fft1d(grid[y].map((c) => ({ ...c })), true));
  }

  const cols: Complex[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => complex(0)),
  );

  for (let x = 0; x < size; x++) {
    const col = Array.from({ length: size }, (_, y) => rows[y][x]);
    const ifftCol = fft1d(col, true);
    for (let y = 0; y < size; y++) cols[y][x] = ifftCol[y];
  }

  const out = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      out[y * size + x] = cols[y][x].re;
    }
  }
  return out;
}