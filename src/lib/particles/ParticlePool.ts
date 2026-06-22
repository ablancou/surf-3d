import * as THREE from "three";

export type ParticleKind = "spray" | "foam" | "splash";

export type EmitConfig = {
  kind: ParticleKind;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  count: number;
  spread?: number;
  speed?: number;
  size?: number;
  life?: number;
};

export class ParticlePool {
  readonly count: number;
  readonly positions: Float32Array;
  readonly velocities: Float32Array;
  readonly lives: Float32Array;
  readonly sizes: Float32Array;
  readonly kinds: Float32Array;

  private head = 0;

  constructor(maxParticles: number) {
    this.count = maxParticles;
    this.positions = new Float32Array(maxParticles * 3);
    this.velocities = new Float32Array(maxParticles * 3);
    this.lives = new Float32Array(maxParticles);
    this.sizes = new Float32Array(maxParticles);
    this.kinds = new Float32Array(maxParticles);
  }

  emit(config: EmitConfig) {
    const spread = config.spread ?? 1;
    const speed = config.speed ?? 3;
    const size = config.size ?? 0.12;
    const life = config.life ?? 0.8;
    const kindCode = config.kind === "spray" ? 0 : config.kind === "foam" ? 1 : 2;
    const max = this.count;

    for (let i = 0; i < config.count; i++) {
      const idx = this.head;
      this.head = (this.head + 1) % max;

      const ox = (Math.random() - 0.5) * spread;
      const oy = Math.random() * spread * 0.4;
      const oz = (Math.random() - 0.5) * spread;

      this.positions[idx * 3] = config.position.x + ox;
      this.positions[idx * 3 + 1] = config.position.y + oy;
      this.positions[idx * 3 + 2] = config.position.z + oz;

      const vx = config.velocity.x + (Math.random() - 0.5) * speed;
      const vy = config.velocity.y + Math.random() * speed * 0.8;
      const vz = config.velocity.z + (Math.random() - 0.5) * speed;

      this.velocities[idx * 3] = vx;
      this.velocities[idx * 3 + 1] = vy;
      this.velocities[idx * 3 + 2] = vz;

      this.lives[idx] = life * (0.7 + Math.random() * 0.6);
      this.sizes[idx] = size * (0.6 + Math.random() * 0.8);
      this.kinds[idx] = kindCode;
    }
  }

  update(dt: number, waterHeightAt: (x: number, z: number) => number) {
    const gravity = -12;
    const max = this.count;
    for (let i = 0; i < max; i++) {
      if (this.lives[i] <= 0) continue;

      this.lives[i] -= dt;
      if (this.lives[i] <= 0) {
        this.sizes[i] = 0;
        continue;
      }

      const px = this.positions[i * 3];
      const py = this.positions[i * 3 + 1];
      const pz = this.positions[i * 3 + 2];

      this.velocities[i * 3 + 1] += gravity * dt * 0.35;
      this.positions[i * 3] += this.velocities[i * 3] * dt;
      this.positions[i * 3 + 1] += this.velocities[i * 3 + 1] * dt;
      this.positions[i * 3 + 2] += this.velocities[i * 3 + 2] * dt;

      const waterY = waterHeightAt(px, pz);
      if (this.kinds[i] === 1) {
        this.positions[i * 3 + 1] = waterY + 0.05;
        this.velocities[i * 3] *= 0.92;
        this.velocities[i * 3 + 2] *= 0.92;
      } else if (py < waterY) {
        this.velocities[i * 3 + 1] *= -0.25;
        this.positions[i * 3 + 1] = waterY + 0.02;
        this.velocities[i * 3] *= 0.6;
        this.velocities[i * 3 + 2] *= 0.6;
      }

      if (this.lives[i] < 0.2) this.sizes[i] *= 0.95;
    }
  }
}