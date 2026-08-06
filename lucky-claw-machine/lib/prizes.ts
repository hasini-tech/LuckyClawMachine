export type Rarity = "common" | "rare" | "epic" | "legendary";

export interface PrizeTemplate {
  id: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  points: number;
  imageUrl?: string;
}

export interface RarityConfig {
  label: string;
  color: string;
  glow: string;
  /** base probability weight of successfully securing a grab once claw closes on it */
  grabWeight: number;
  /** relative frequency of this rarity appearing in the machine */
  spawnWeight: number;
}

export const RARITY_CONFIG: Record<Rarity, RarityConfig> = {
  common: {
    label: "Common",
    color: "#9ca3af",
    glow: "rgba(156,163,175,0.65)",
    grabWeight: 0.62,
    spawnWeight: 52,
  },
  rare: {
    label: "Rare",
    color: "#2ee6ff",
    glow: "rgba(46,230,255,0.65)",
    grabWeight: 0.4,
    spawnWeight: 28,
  },
  epic: {
    label: "Epic",
    color: "#a855ff",
    glow: "rgba(168,85,255,0.65)",
    grabWeight: 0.22,
    spawnWeight: 14,
  },
  legendary: {
    label: "Legendary",
    color: "#ffcb2e",
    glow: "rgba(255,203,46,0.75)",
    grabWeight: 0.1,
    spawnWeight: 6,
  },
};

export const PRIZE_TEMPLATES: PrizeTemplate[] = [
  { id: "billzzy", name: "Billzzy", emoji: "🅱", rarity: "common", points: 10, imageUrl: "/images/billzzy-logo.png" },
  { id: "ciphergate", name: "Ciphergate", emoji: "🅲", rarity: "rare", points: 30, imageUrl: "/images/ciphergate.jpeg" },
  { id: "f3", name: "F3", emoji: "🅵", rarity: "common", points: 15, imageUrl: "/images/f3-icon.png" },
  { id: "fynlog", name: "Fynlog", emoji: "🅵", rarity: "rare", points: 25, imageUrl: "/images/Fynlog.png" },
  { id: "insta", name: "Insta X Bot", emoji: "🅸", rarity: "epic", points: 50, imageUrl: "/images/insta-x-bot.png" },
  { id: "lite", name: "Lite", emoji: "🅻", rarity: "legendary", points: 100, imageUrl: "/images/lite-logo.png" },
];

export function weightedRarityPick(): Rarity {
  const entries = Object.entries(RARITY_CONFIG) as [Rarity, RarityConfig][];
  const total = entries.reduce((sum, [, cfg]) => sum + cfg.spawnWeight, 0);
  let roll = Math.random() * total;
  for (const [rarity, cfg] of entries) {
    if (roll < cfg.spawnWeight) return rarity;
    roll -= cfg.spawnWeight;
  }
  return "common";
}

export function randomPrizeTemplate(): PrizeTemplate {
  const rarity = weightedRarityPick();
  const pool = PRIZE_TEMPLATES.filter((p) => p.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}
