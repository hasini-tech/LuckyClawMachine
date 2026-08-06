"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/useGameStore";
import { RARITY_CONFIG } from "@/lib/prizes";

export default function RewardPopup() {
  const showReward = useGameStore((s) => s.showReward);
  const lastReward = useGameStore((s) => s.lastReward);
  const isJackpotWin = useGameStore((s) => s.isJackpotWin);
  const clearReward = useGameStore((s) => s.clearReward);

  if (!lastReward) return null;
  const cfg = RARITY_CONFIG[lastReward.template.rarity];

  return (
    <AnimatePresence>
      {showReward && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={clearReward}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.4, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="relative w-full max-w-xs sm:max-w-sm rounded-3xl chrome-bezel border-2 p-6 text-center overflow-hidden"
            style={{ borderColor: cfg.color, boxShadow: `0 0 40px ${cfg.glow}` }}
          >
            <div className="absolute inset-0 opacity-20 bulb-strip" />

            {isJackpotWin && (
              <motion.p
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="relative font-display text-lg sm:text-xl font-extrabold text-neon-yellow mb-1 animate-flicker"
              >
                🎉 JACKPOT BONUS! 🎉
              </motion.p>
            )}

            <p className="relative text-xs uppercase tracking-widest text-white/50 font-bold mb-2">
              You Won!
            </p>

            <motion.div
              animate={{ y: [0, -8, 0], rotate: [0, -5, 5, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              className="relative text-7xl mb-3 drop-shadow-[0_6px_12px_rgba(0,0,0,0.5)]"
            >
              {lastReward.template.emoji}
            </motion.div>

            <h2 className="relative font-display text-2xl font-extrabold text-white mb-1">
              {lastReward.template.name}
            </h2>

            <span
              className="relative inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3"
              style={{ background: cfg.color, color: "#0a0518", boxShadow: `0 0 12px ${cfg.glow}` }}
            >
              {cfg.label}
            </span>

            <p className="relative text-neon-cyan font-display font-bold text-xl mb-5">
              +{lastReward.template.points + (isJackpotWin ? 500 : 0)} pts
              {isJackpotWin && <span className="block text-[11px] text-neon-yellow">(includes +500 jackpot)</span>}
            </p>

            <button
              onClick={clearReward}
              className="relative w-full py-2.5 rounded-xl font-display font-bold text-sm bg-gradient-to-b from-neon-pink to-purple-700 text-white shadow-neon-pink active:scale-95 transition-transform"
            >
              Awesome!
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
