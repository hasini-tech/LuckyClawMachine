"use client";

import { create } from "zustand";
import { PRIZE_TEMPLATES, PrizeTemplate, Rarity, randomPrizeTemplate } from "@/lib/prizes";

export const ROUND_DURATION_SECONDS = 60;
const CLAW_MIN_X = 6;
const CLAW_MAX_X = 94;
const CLAW_MIN_Y = 6;
const CLAW_MAX_Y = 90;

export type ClawPhase =
  | "ready" // round is waiting to begin
  | "aiming" // player has control of the joystick
  | "dropping" // claw descending toward the prize field
  | "grabbing" // claw jaws closing
  | "lifting" // claw rising back up, holding (or not) a prize
  | "moving_to_drop" // claw sliding to the chute
  | "releasing" // jaws open, prize (maybe) falls into the chute
  | "success" // reward has been secured
  | "failure" // attempt missed
  | "settling"; // brief pause before control returns

export interface PrizeInstance {
  uid: string;
  template: PrizeTemplate;
  x: number; // percentage across the play field (0-100)
  y: number; // percentage down the play field (0-100), i.e. depth
  bob: number; // phase offset for idle floating animation
  depth: number; // 0 = foreground edge, 1 = back wall
  grabbed: boolean;
  fallen: boolean; // true once physically dropped into the chute
}

export interface WonPrize {
  uid: string;
  template: PrizeTemplate;
  wonAt: number;
}

interface GameState {
  coins: number;
  timeLeft: number;
  gameStarted: boolean;
  gameOver: boolean;
  score: number;
  streak: number;
  bestStreak: number;
  jackpotProgress: number; // 0-100
  attempts: number;
  totalPlays: number;
  inventory: WonPrize[];
  prizes: PrizeInstance[];
  clawX: number; // 0-100
  clawY: number; // 0-100
  clawExtension: number; // 0-1, how far the arm currently reaches down for a grab
  clawPhase: ClawPhase;
  heldPrizeUid: string | null;
  lastReward: WonPrize | null;
  showReward: boolean;
  isJackpotWin: boolean;
  cameraMode: "front" | "cinematic";
  musicOn: boolean;
  sfxOn: boolean;

  // actions
  insertCoin: (amount?: number) => boolean;
  moveClaw: (dx: number, dy: number) => void;
  setClawPos: (x: number, y: number) => void;
  setClawExtension: (v: number) => void;
  setClawPhase: (phase: ClawPhase) => void;
  setHeldPrize: (uid: string | null) => void;
  releaseHeldPrize: (uid: string) => void;
  recordAttempt: () => void;
  markPrizeGrabbed: (uid: string, grabbed: boolean) => void;
  markPrizeFallen: (uid: string) => void;
  removePrize: (uid: string) => void;
  respawnPrize: () => void;
  awardPrize: (template: PrizeTemplate) => void;
  clearReward: () => void;
  registerMiss: () => void;
  bumpJackpot: () => void;
  toggleCamera: () => void;
  toggleMusic: () => void;
  toggleSfx: () => void;
  initPrizes: (count: number) => void;
  startRound: () => void;
  tickTimer: () => void;
  resetRound: () => void;
}

function makePrize(existing: PrizeInstance[], forcedTemplate?: PrizeTemplate): PrizeInstance {
  const template = forcedTemplate ?? randomPrizeTemplate();
  let x = 0;
  let y = 0;
  let tries = 0;
  do {
    x = 10 + Math.random() * 80;
    y = 48 + Math.random() * 42;
    tries++;
  } while (
    tries < 20 &&
    existing.some((p) => !p.fallen && Math.hypot(p.x - x, p.y - y) < 9)
  );
  return {
    uid: `${template.id}-${Math.random().toString(36).slice(2, 9)}`,
    template,
    x,
    y,
    bob: Math.random() * Math.PI * 2,
    depth: Math.random(),
    grabbed: false,
    fallen: false,
  };
}

export const useGameStore = create<GameState>((set, get) => ({
  coins: 25,
  timeLeft: ROUND_DURATION_SECONDS,
  gameStarted: false,
  gameOver: false,
  score: 0,
  streak: 0,
  bestStreak: 0,
  jackpotProgress: 0,
  attempts: 0,
  totalPlays: 0,
  inventory: [],
  prizes: [],
  clawX: 50,
  clawY: 12,
  clawExtension: 0,
  clawPhase: "ready",
  heldPrizeUid: null,
  lastReward: null,
  showReward: false,
  isJackpotWin: false,
  cameraMode: "front",
  musicOn: true,
  sfxOn: true,

  insertCoin: (amount = 1) => {
    const { coins, gameOver } = get();
    if (gameOver && amount > 0) return false;
    set({ coins: coins + amount });
    return true;
  },

  moveClaw: (dx, dy) => {
    const { clawX, clawY, clawPhase, gameOver } = get();
    // Joystick and keyboard input share this guard, so invalid input can never
    // push the claw outside the playable field or poison the position with NaN.
    if (clawPhase !== "aiming" || gameOver || !Number.isFinite(dx) || !Number.isFinite(dy)) return;
    set({
      clawX: Math.min(CLAW_MAX_X, Math.max(CLAW_MIN_X, clawX + dx)),
      clawY: Math.min(CLAW_MAX_Y, Math.max(CLAW_MIN_Y, clawY + dy)),
    });
  },

  setClawPos: (x, y) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    set({
      clawX: Math.min(CLAW_MAX_X, Math.max(CLAW_MIN_X, x)),
      clawY: Math.min(CLAW_MAX_Y, Math.max(CLAW_MIN_Y, y)),
    });
  },
  setClawExtension: (v) => {
    if (!Number.isFinite(v)) return;
    set({ clawExtension: Math.min(1, Math.max(0, v)) });
  },
  setClawPhase: (phase) => set({ clawPhase: phase }),
  setHeldPrize: (uid) => set({ heldPrizeUid: uid }),
  releaseHeldPrize: (uid) =>
    set((s) => ({
      heldPrizeUid: s.heldPrizeUid === uid ? null : s.heldPrizeUid,
      prizes: s.prizes.map((p) => (p.uid === uid ? { ...p, grabbed: false } : p)),
    })),
  recordAttempt: () => set((s) => ({ attempts: s.attempts + 1 })),

  markPrizeGrabbed: (uid, grabbed) =>
    set((s) => ({
      prizes: s.prizes.map((p) => (p.uid === uid ? { ...p, grabbed } : p)),
    })),

  markPrizeFallen: (uid) =>
    set((s) => ({
      prizes: s.prizes.map((p) => (p.uid === uid ? { ...p, fallen: true } : p)),
    })),

  removePrize: (uid) =>
    set((s) => ({ prizes: s.prizes.filter((p) => p.uid !== uid) })),

  respawnPrize: () =>
    set((s) => ({ prizes: [...s.prizes, makePrize(s.prizes)] })),

  awardPrize: (template) => {
    const reward: WonPrize = {
      uid: `${template.id}-${Date.now()}`,
      template,
      wonAt: Date.now(),
    };
    set((s) => {
      if (s.gameOver) return s;
      const isJackpot = s.jackpotProgress >= 100;
      const bonus = isJackpot ? 500 : 0;
      const newStreak = s.streak + 1;
      return {
        inventory: [reward, ...s.inventory],
        score: s.score + template.points + bonus,
        streak: newStreak,
        bestStreak: Math.max(s.bestStreak, newStreak),
        lastReward: reward,
        showReward: true,
        jackpotProgress: isJackpot ? 0 : Math.min(100, s.jackpotProgress + 14),
        isJackpotWin: isJackpot,
        totalPlays: s.totalPlays + 1,
      };
    });
  },

  clearReward: () => set({ showReward: false, isJackpotWin: false }),

  registerMiss: () =>
    set((s) => {
      if (s.gameOver) return s;
      return {
        streak: 0,
        jackpotProgress: Math.min(100, s.jackpotProgress + 5),
        totalPlays: s.totalPlays + 1,
      };
    }),

  bumpJackpot: () =>
    set((s) => ({ jackpotProgress: Math.min(100, s.jackpotProgress + 5) })),

  toggleCamera: () => set((s) => ({ cameraMode: s.cameraMode === "front" ? "cinematic" : "front" })),
  toggleMusic: () => set((s) => ({ musicOn: !s.musicOn })),
  toggleSfx: () => set((s) => ({ sfxOn: !s.sfxOn })),

  initPrizes: (count) => {
    const prizes: PrizeInstance[] = [];
    const brandedTemplates = PRIZE_TEMPLATES.filter((template) => template.id === "billzzy" || template.id === "gowhats");
    const brandedCount = Math.min(8, count);

    // Keep the two supplied brand boxes visible on every fresh machine load.
    for (let i = 0; i < brandedCount; i++) {
      prizes.push(makePrize(prizes, brandedTemplates[i % brandedTemplates.length]));
    }

    for (let i = brandedCount; i < count; i++) {
      prizes.push(makePrize(prizes));
    }
    set({ prizes });
  },

  startRound: () => {
    if (get().gameOver) return;
    set({ gameStarted: true, clawPhase: "aiming" });
  },

  tickTimer: () => {
    set((state) => {
      if (!state.gameStarted || state.gameOver || state.timeLeft <= 0) return state;
      const timeLeft = Math.max(0, state.timeLeft - 1);
      return {
        timeLeft,
        gameOver: timeLeft === 0,
        ...(timeLeft === 0 ? { showReward: false, isJackpotWin: false } : {}),
      };
    });
  },

  resetRound: () => {
    set({
      coins: 25,
      timeLeft: ROUND_DURATION_SECONDS,
      gameStarted: true,
      gameOver: false,
      attempts: 0,
      streak: 0,
      showReward: false,
      isJackpotWin: false,
      lastReward: null,
      clawX: 51,
      clawY: 11,
      clawExtension: 0,
      clawPhase: "aiming",
      heldPrizeUid: null,
      cameraMode: "front",
    });
  },
}));

export function rarityRank(r: Rarity): number {
  return { common: 0, rare: 1, epic: 2, legendary: 3 }[r];
}

