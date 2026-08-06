"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useGameStore } from "@/store/useGameStore";
import { RARITY_CONFIG } from "@/lib/prizes";
import { soundManager } from "@/lib/sounds";

export default function HUD() {
  const coins = useGameStore((s) => s.coins);
  const score = useGameStore((s) => s.score);
  const inventory = useGameStore((s) => s.inventory);
  const musicOn = useGameStore((s) => s.musicOn);
  const sfxOn = useGameStore((s) => s.sfxOn);
  const toggleMusic = useGameStore((s) => s.toggleMusic);
  const toggleSfx = useGameStore((s) => s.toggleSfx);
  const [showInventory, setShowInventory] = useState(false);

  return (
    <div className="arcade-hud">
      <button className="hud-toy-card" onClick={() => setShowInventory((v) => !v)} aria-label="Show collected prizes"><span>✹</span><b>{inventory.length}</b></button>
      <button className="hud-action" onClick={() => setShowInventory((v) => !v)} aria-label="Show controls"><strong>[C]</strong><span>◈</span></button>
      <button className="hud-action" onClick={() => setShowInventory((v) => !v)} aria-label="Camera control"><strong>[R]</strong><span className="camera-glyph">◉</span></button>
      <button className="hud-action" onClick={() => { soundManager.toggleSfx(); toggleSfx(); }} aria-label="Toggle sound"><strong>[M]</strong><span>{sfxOn ? "◖" : "◌"}</span></button>
      <button className="hud-alert" onClick={() => { toggleMusic(); const on = useGameStore.getState().musicOn; if (on) soundManager.startMusic(); else soundManager.stopMusic(); }} aria-label="Toggle music"><span>!</span></button>
      <div className="hud-coins"><span>●</span>{coins}</div>
      <AnimatePresence>
        {showInventory && <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 14 }} className="hud-inventory">
          <div className="hud-inventory-title">SCORE {score.toLocaleString()}</div>
          {inventory.length === 0 ? <span>Try your luck!</span> : <div className="hud-inventory-grid">{inventory.slice(0, 8).map((item) => <span key={item.uid} title={item.template.name} style={{ color: RARITY_CONFIG[item.template.rarity].color }}>✹</span>)}</div>}
        </motion.div>}
      </AnimatePresence>
    </div>
  );
}
