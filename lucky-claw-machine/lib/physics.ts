/**
 * PhysicsEngine — small, dependency-free helpers that give the claw machine
 * its "physical" feel: gentle idle bobbing for prizes, distance-based grab
 * odds, and a bit of randomness so outcomes feel fair but exciting rather
 * than purely deterministic.
 */

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

/** Idle floating offset (in px) for a prize, based on elapsed time and a phase offset. */
export function bobOffset(elapsedMs: number, phaseOffset: number, amplitude = 4): number {
  return Math.sin(elapsedMs / 900 + phaseOffset) * amplitude;
}

/**
 * Computes final grab success chance from several factors so the game feels
 * "fair but exciting": base rarity weight, how precisely the claw is
 * centered on the prize, and a small pity boost after a losing streak.
 */
export function computeGrabChance(opts: {
  baseWeight: number;
  distancePx: number; // 0 = perfectly centered
  maxDistance: number;
  missStreak: number;
}): number {
  const { baseWeight, distancePx, maxDistance, missStreak } = opts;
  const precision = clamp(1 - distancePx / maxDistance, 0, 1); // 1 = dead center
  const precisionFactor = 0.45 + precision * 0.55; // never fully zeroes out
  const pity = clamp(missStreak * 0.025, 0, 0.18);
  return clamp(baseWeight * precisionFactor + pity, 0.03, 0.95);
}

export function rollSuccess(chance: number): boolean {
  return Math.random() < chance;
}

/** Simple seeded-feeling jitter so the claw "grip" wobbles slightly while closing. */
export function grabJitter(seed: number): number {
  return Math.sin(seed * 12.9898) * 2;
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * Smoothly interpolates a 2D value (e.g. claw carriage position) over time.
 * Returns a cancel function so callers can abort mid-flight if needed.
 */
export function animateValue2D(
  from: { x: number; y: number },
  to: { x: number; y: number },
  durationMs: number,
  onUpdate: (v: { x: number; y: number }) => void,
  onDone?: () => void
): () => void {
  let raf = 0;
  const start = performance.now();
  let cancelled = false;

  const step = (now: number) => {
    if (cancelled) return;
    const t = clamp((now - start) / durationMs, 0, 1);
    const eased = easeInOutQuad(t);
    onUpdate({
      x: from.x + (to.x - from.x) * eased,
      y: from.y + (to.y - from.y) * eased,
    });
    if (t < 1) {
      raf = requestAnimationFrame(step);
    } else {
      onDone?.();
    }
  };
  raf = requestAnimationFrame(step);

  return () => {
    cancelled = true;
    cancelAnimationFrame(raf);
  };
}
