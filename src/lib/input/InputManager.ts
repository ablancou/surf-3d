import { getInputProfile, type InputProfile } from "@/lib/input/deviceProfile";
import { DEFAULT_INPUT, type GameInputState } from "./types";

const KEY_MAP: Record<string, Partial<GameInputState>> = {
  KeyW: { leanZ: 1 },
  ArrowUp: { leanZ: 1 },
  KeyS: { leanZ: -1 },
  ArrowDown: { leanZ: -1 },
  KeyA: { leanX: -1 },
  ArrowLeft: { leanX: -1 },
  KeyD: { leanX: 1 },
  ArrowRight: { leanX: 1 },
};

const POP_KEYS = new Set(["Space", "KeyE"]);

export class InputManager {
  readonly state: GameInputState = { ...DEFAULT_INPUT };

  private keys = new Set<string>();
  private pointerActive = false;
  private pointerOrigin = { x: 0, y: 0 };
  private pointerLean = { x: 0, y: 0 };
  private touchId: number | null = null;
  private touchOrigin = { x: 0, y: 0 };
  private gamepadLean = { x: 0, y: 0 };
  private gamepadPop = false;
  private smoothLean = { x: 0, z: 0 };
  private virtualActive = false;
  private virtualLean = { x: 0, z: 0 };
  private virtualPop = false;
  private profile: InputProfile = getInputProfile();
  private bound = false;

  setVirtualLean(x: number, z: number) {
    this.virtualActive = true;
    this.virtualLean.x = x;
    this.virtualLean.z = z;
  }

  clearVirtualLean() {
    this.virtualActive = false;
    this.virtualLean.x = 0;
    this.virtualLean.z = 0;
  }

  requestPop() {
    this.virtualPop = true;
  }

  bind(el: HTMLElement) {
    if (this.bound) return;
    this.bound = true;

    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);

    el.addEventListener("pointerdown", this.onPointerDown);
    el.addEventListener("pointermove", this.onPointerMove);
    el.addEventListener("pointerup", this.onPointerUp);
    el.addEventListener("pointercancel", this.onPointerUp);

    el.addEventListener("touchstart", this.onTouchStart, { passive: false });
    el.addEventListener("touchmove", this.onTouchMove, { passive: false });
    el.addEventListener("touchend", this.onTouchEnd);
    el.addEventListener("touchcancel", this.onTouchEnd);
  }

  unbind(el: HTMLElement) {
    if (!this.bound) return;
    this.bound = false;

    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);

    el.removeEventListener("pointerdown", this.onPointerDown);
    el.removeEventListener("pointermove", this.onPointerMove);
    el.removeEventListener("pointerup", this.onPointerUp);
    el.removeEventListener("pointercancel", this.onPointerUp);

    el.removeEventListener("touchstart", this.onTouchStart);
    el.removeEventListener("touchmove", this.onTouchMove);
    el.removeEventListener("touchend", this.onTouchEnd);
    el.removeEventListener("touchcancel", this.onTouchEnd);
  }

  update() {
    this.state.leanX = 0;
    this.state.leanZ = 0;
    this.state.popUp = false;

    const kb = this.profile.keyboardScale;
    for (const code of this.keys) {
      const map = KEY_MAP[code];
      if (map?.leanX) this.state.leanX += map.leanX * kb;
      if (map?.leanZ) this.state.leanZ += map.leanZ * kb;
      if (POP_KEYS.has(code)) this.state.popUp = true;
    }

    if (this.virtualActive) {
      this.state.leanX = clamp(this.virtualLean.x);
      this.state.leanZ = clamp(this.virtualLean.z);
    } else if (this.pointerActive) {
      this.state.leanX = clamp(this.pointerLean.x);
      this.state.leanZ = clamp(this.pointerLean.y);
    } else if (this.touchId !== null) {
      this.state.leanX = clamp(this.pointerLean.x);
      this.state.leanZ = clamp(this.pointerLean.y);
    }

    this.pollGamepad();

    if (
      this.touchId === null &&
      !this.pointerActive &&
      (Math.abs(this.gamepadLean.x) > 0.08 || Math.abs(this.gamepadLean.y) > 0.08)
    ) {
      this.state.leanX = clamp(this.gamepadLean.x);
      this.state.leanZ = clamp(this.gamepadLean.y);
    }

    if (this.gamepadPop || this.virtualPop) this.state.popUp = true;
    this.virtualPop = false;

    const targetX = clamp(this.state.leanX);
    const targetZ = clamp(this.state.leanZ);
    const smooth = this.virtualActive ? 0.32 : this.profile.smoothFactor;
    this.smoothLean.x += (targetX - this.smoothLean.x) * smooth;
    this.smoothLean.z += (targetZ - this.smoothLean.z) * smooth;
    this.state.leanX = this.smoothLean.x;
    this.state.leanZ = this.smoothLean.z;
  }

  private pollGamepad() {
    const pads = navigator.getGamepads?.();
    if (!pads) return;

    const pad = pads[0];
    if (!pad) return;

    const deadzone = 0.12;
    const lx = applyDeadzone(pad.axes[0] ?? 0, deadzone);
    const ly = applyDeadzone(pad.axes[1] ?? 0, deadzone);

    this.gamepadLean.x = lx;
    this.gamepadLean.y = -ly;

    const rt = pad.buttons[7]?.value ?? 0;
    const a = pad.buttons[0]?.pressed ?? false;
    this.gamepadPop = rt > 0.35 || a;
  }

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys.add(e.code);
    if (POP_KEYS.has(e.code)) e.preventDefault();
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private onBlur = () => {
    this.keys.clear();
    this.pointerActive = false;
    this.touchId = null;
    this.gamepadLean.x = 0;
    this.gamepadLean.y = 0;
    this.gamepadPop = false;
    this.smoothLean.x = 0;
    this.smoothLean.z = 0;
  };

  private onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    this.pointerActive = true;
    this.pointerOrigin.x = e.clientX;
    this.pointerOrigin.y = e.clientY;
    this.pointerLean.x = 0;
    this.pointerLean.y = 0;
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.pointerActive || e.pointerType === "touch") return;
    const dx = e.clientX - this.pointerOrigin.x;
    const dy = e.clientY - this.pointerOrigin.y;
    this.pointerLean.x = dx / this.profile.pointerRadius;
    this.pointerLean.y = -dy / this.profile.pointerRadius;
  };

  private onPointerUp = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    this.pointerActive = false;
    this.pointerLean.x = 0;
    this.pointerLean.y = 0;
  };

  private onTouchStart = (e: TouchEvent) => {
    if (this.virtualActive || this.touchId !== null) return;
    const touch = e.touches[0];
    if (!touch) return;
    e.preventDefault();
    this.touchId = touch.identifier;
    this.touchOrigin.x = touch.clientX;
    this.touchOrigin.y = touch.clientY;
    this.pointerLean.x = 0;
    this.pointerLean.y = 0;
  };

  private onTouchMove = (e: TouchEvent) => {
    if (this.touchId === null) return;
    const touch = Array.from(e.touches).find((t) => t.identifier === this.touchId);
    if (!touch) return;
    e.preventDefault();
    const dx = touch.clientX - this.touchOrigin.x;
    const dy = touch.clientY - this.touchOrigin.y;
    this.pointerLean.x = dx / this.profile.touchRadius;
    this.pointerLean.y = -dy / this.profile.touchRadius;
  };

  private onTouchEnd = (e: TouchEvent) => {
    const ended = Array.from(e.changedTouches).some((t) => t.identifier === this.touchId);
    if (!ended) return;
    this.touchId = null;
    this.pointerLean.x = 0;
    this.pointerLean.y = 0;
    this.state.popUp = true;
  };
}

function clamp(v: number, min = -1, max = 1) {
  return Math.max(min, Math.min(max, v));
}

function applyDeadzone(v: number, zone: number) {
  if (Math.abs(v) < zone) return 0;
  const sign = Math.sign(v);
  return sign * ((Math.abs(v) - zone) / (1 - zone));
}