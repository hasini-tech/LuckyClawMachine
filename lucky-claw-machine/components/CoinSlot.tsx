"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { soundManager } from "@/lib/sounds";

interface CoinSlotProps { onInsert: () => void; disabled?: boolean; }

export default function CoinSlot({ onInsert, disabled }: CoinSlotProps) {
  const [dropping, setDropping] = useState(0);
  const handleInsert = () => {
    if (disabled) return;
    soundManager.unlock();
    soundManager.coinInsert();
    setDropping((n) => n + 1);
    onInsert();
  };
  return (
    <button onClick={handleInsert} disabled={disabled} className={`coin-slot-control ${disabled ? "is-disabled" : ""}`} aria-label="Insert coin">
      <div className="coin-slot-hole"><AnimatePresence>{Array.from({ length: dropping }).map((_, i) => <motion.i key={i} initial={{ y: -4, opacity: 1 }} animate={{ y: 38, opacity: 0 }} transition={{ duration: 0.45 }} onAnimationComplete={() => setDropping((n) => Math.max(0, n - 1))} />)}</AnimatePresence></div>
      <span>COIN</span>
    </button>
  );
}
