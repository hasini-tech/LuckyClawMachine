"use client";

import { create } from "zustand";
import { PrizeTemplate, Rarity, randomPrizeTemplate } from "@/lib/prizes";

export type ClawPhase =
  | "idle" // player has control of the joystick
  | "dropping" // claw descending toward the prize field
  | "grabbing" // claw jaws closing
  | "lifting" // claw rising back up, holding (or not) a prize
  | "returning" // claw sliding to the chute
  | "releasing" // jaws open, prize (maybe) falls into the chute
  | "settling"; // brief pause before control returns

export interface PrizeInstance {
  uid: string;
  template: PrizeTemplate;
  x: number; // percentage across the play field (0-100)
  y: number; // percentage down the play field (0-100), i.e. depth
  bob: number; // phase offset for idle floating animation
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
  score: number;
  streak: number;
  bestStreak: number;
  jackpotProgress: number; // 0-100
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
  musicOn: boolean;
  sfxOn: boolean;

  // actions
  insertCoin: (amount?: number) => boolean;
  moveClaw: (dx: number, dy: number) => void;
  setClawPos: (x: number, y: number) => void;
  setClawExtension: (v: number) => void;
  setClawPhase: (phase: ClawPhase) => void;
  setHeldPrize: (uid: string | null) => void;
  markPrizeGrabbed: (uid: string, grabbed: boolean) => void;
  markPrizeFallen: (uid: string) => void;
  removePrize: (uid: string) => void;
  respawnPrize: () => void;
  awardPrize: (template: PrizeTemplate) => void;
  clearReward: () => void;
  registerMiss: () => void;
  bumpJackpot: () => void;
  toggleMusic: () => void;
  toggleSfx: () => void;
  initPrizes: (count: number) => void;
}

function makePrize(existing: PrizeInstance[]): PrizeInstance {
  const template = randomPrizeTemplate();
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
    grabbed: false,
    fallen: false,
  };
}

export const useGameStore = create<GameState>((set, get) => ({
  coins: 25,
  score: 0,
  streak: 0,
  bestStreak: 0,
  jackpotProgress: 0,
  totalPlays: 0,
  inventory: [],
  prizes: [],
  clawX: 50,
  clawY: 12,
  clawExtension: 0,
  clawPhase: "idle",
  heldPrizeUid: null,
  lastReward: null,
  showReward: false,
  isJackpotWin: false,
  musicOn: true,
  sfxOn: true,

  insertCoin: (amount = 1) => {
    const { coins } = get();
    if (coins <= 0 && amount > 0) {
      // adding coins (e.g., from settings/testing) always allowed
    }
    set({ coins: coins + amount });
    return true;
  },

  moveClaw: (dx, dy) => {
    const { clawX, clawY, clawPhase } = get();
    if (clawPhase !== "idle") return;
    set({
      clawX: Math.min(94, Math.max(6, clawX + dx)),
      clawY: Math.min(90, Math.max(6, clawY + dy)),
    });
  },

  setClawPos: (x, y) => set({ clawX: x, clawY: y }),
  setClawExtension: (v) => set({ clawExtension: v }),
  setClawPhase: (phase) => set({ clawPhase: phase }),
  setHeldPrize: (uid) => set({ heldPrizeUid: uid }),

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
    set((s) => ({
      streak: 0,
      jackpotProgress: Math.min(100, s.jackpotProgress + 5),
      totalPlays: s.totalPlays + 1,
    })),

  bumpJackpot: () =>
    set((s) => ({ jackpotProgress: Math.min(100, s.jackpotProgress + 5) })),

  toggleMusic: () => set((s) => ({ musicOn: !s.musicOn })),
  toggleSfx: () => set((s) => ({ sfxOn: !s.sfxOn })),

  initPrizes: (count) => {
    const prizes: PrizeInstance[] = [];
    for (let i = 0; i < count; i++) {
      prizes.push(makePrize(prizes));
    }
    set({ prizes });
  },
}));

export function rarityRank(r: Rarity): number {
  return { common: 0, rare: 1, epic: 2, legendary: 3 }[r];
}

