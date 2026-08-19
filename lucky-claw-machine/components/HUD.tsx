"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useGameStore } from "@/store/useGameStore";
import { RARITY_CONFIG } from "@/lib/prizes";
import { soundManager } from "@/lib/sounds";

export default function HUD() {
  const coins = useGameStore((s) => s.coins);
  const clawPhase = useGameStore((s) => s.clawPhase);
  const score = useGameStore((s) => s.score);
  const streak = useGameStore((s) => s.streak);
  const attempts = useGameStore((s) => s.attempts);
  const inventory = useGameStore((s) => s.inventory);
  const musicOn = useGameStore((s) => s.musicOn);
  const sfxOn = useGameStore((s) => s.sfxOn);
  const cameraMode = useGameStore((s) => s.cameraMode);
  const toggleMusic = useGameStore((s) => s.toggleMusic);
  const toggleSfx = useGameStore((s) => s.toggleSfx);
  const toggleCamera = useGameStore((s) => s.toggleCamera);
  const [showInventory, setShowInventory] = useState(false);

  return (
    <div className="arcade-hud">
      <button className="hud-toy-card" onClick={() => setShowInventory((v) => !v)} aria-label="Show collected prizes"><span>✹</span><b>{inventory.length}</b></button>
      <button className="hud-action" onClick={() => setShowInventory((v) => !v)} aria-label="Show controls"><strong>[C]</strong><span>◈</span></button>
      <button className={`hud-action ${cameraMode === "cinematic" ? "is-active" : ""}`} onClick={toggleCamera} aria-label="Toggle camera view"><strong>[R]</strong><span className="camera-glyph">◉</span></button>
      <button className="hud-action" onClick={() => { soundManager.toggleSfx(); toggleSfx(); }} aria-label="Toggle sound"><strong>[M]</strong><span>{sfxOn ? "◖" : "◌"}</span></button>
      <button className="hud-alert" onClick={() => { toggleMusic(); const on = useGameStore.getState().musicOn; if (on) soundManager.startMusic(); else soundManager.stopMusic(); }} aria-label="Toggle music"><span>!</span></button>
      <div className="hud-phase" aria-live="polite">{clawPhase === "aiming" ? "AIM" : clawPhase === "moving_to_drop" ? "RETURNING" : clawPhase.replace("_", " ").toUpperCase()}</div>
      <div className="hud-score"><span>SCORE · TRIES {attempts}{streak > 1 ? ` · STREAK ×${streak}` : ""}</span>{score.toLocaleString()}</div>
      <div className="hud-coins"><span>●</span>{coins}</div>
      <AnimatePresence>
        {showInventory && <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 14 }} className="hud-inventory">
          <div className="hud-inventory-title">SCORE {score.toLocaleString()}</div>
          {inventory.length === 0 ? <span>Try your luck!</span> : <div className="hud-inventory-grid">{inventory.slice(0, 8).map((item) => <div key={item.uid} className="hud-inventory-item" title={item.template.name} style={{ borderColor: RARITY_CONFIG[item.template.rarity].color, boxShadow: `0 0 8px ${RARITY_CONFIG[item.template.rarity].glow}` }}>{item.template.imageUrl ? <img src={item.template.imageUrl} alt="" aria-hidden="true" /> : <span>{item.template.emoji}</span>}</div>)}</div>}
        </motion.div>}
      </AnimatePresence>
    </div>
  );
}
