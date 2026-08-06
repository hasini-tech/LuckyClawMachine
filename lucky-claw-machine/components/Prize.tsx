"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { PrizeInstance } from "@/store/useGameStore";
import { RARITY_CONFIG } from "@/lib/prizes";

interface PrizeProps { prize: PrizeInstance; isHeld: boolean; isDropping: boolean; }

const GLYPHS: Record<string, string> = { duck: "●", bear: "●", bunny: "●", cat: "◆", star: "★", heart: "♥", robot: "▣", unicorn: "✦", panda: "●", rocket: "▲", "gem-blue": "◆", dragon: "✹", crown: "♛", "gem-purple": "◆", trophy: "♜", diamond: "◇", mystery: "?", genie: "✦" };
const TOY_COLORS: Record<string, string> = { duck: "#f8d939", bear: "#d67c3e", bunny: "#f4b2c4", cat: "#ff8d2d", star: "#ffd839", heart: "#ff486e", robot: "#49c9dc", unicorn: "#bd7bff", panda: "#eef4ef", rocket: "#f05c4d", "gem-blue": "#42c9ff", dragon: "#62d45e", crown: "#f9c72d", "gem-purple": "#a77cff", trophy: "#efac2a", diamond: "#7bedf2", mystery: "#ef65a7", genie: "#54dcbe" };

function hash(value: string) { return value.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0); }

export default function Prize({ prize, isHeld }: PrizeProps) {
  const cfg = RARITY_CONFIG[prize.template.rarity];
  const [seed] = useState(() => hash(prize.uid));
  const color = TOY_COLORS[prize.template.id] ?? cfg.color;
  const glyph = GLYPHS[prize.template.id] ?? "★";
  const size = 32 + (seed % 18);
  const tilt = -12 + (seed % 25);
  if (prize.fallen) return null;

  return (
    <AnimatePresence>
      {!isHeld && <motion.div key={prize.uid} className="toy-prize" style={{ left: `${prize.x}%`, top: `${prize.y}%`, ["--toy-size" as string]: `${size}px`, ["--toy-tilt" as string]: `${tilt}deg`, ["--toy-color" as string]: color }} initial={{ opacity: 0, scale: 0.35 }} animate={{ opacity: 1, scale: 1, y: [0, -2, 0], rotate: [tilt, tilt + 2, tilt] }} exit={{ opacity: 0, scale: 0.2 }} transition={{ opacity: { duration: 0.25 }, scale: { duration: 0.25 }, y: { duration: 3 + (seed % 2), repeat: Infinity, ease: "easeInOut", delay: prize.bob }, rotate: { duration: 4 + (seed % 2), repeat: Infinity, ease: "easeInOut", delay: prize.bob } }}>
        <span className="toy-glow" style={{ background: cfg.glow }} />
        {prize.template.imageUrl ? (
          <div className="toy-box-3d">
            <div className="cube" style={{ transform: `rotateX(-35deg) rotateY(${15 + (seed % 30)}deg)` }}>
              <div className="cube-face cube-front">
                <img src={prize.template.imageUrl} alt={prize.template.name} className="toy-image" />
              </div>
              <div className="cube-face cube-back">
                <img src={prize.template.imageUrl} alt={prize.template.name} className="toy-image" />
              </div>
              <div className="cube-face cube-right"></div>
              <div className="cube-face cube-left"></div>
              <div className="cube-face cube-top">
                <img src={prize.template.imageUrl} alt={prize.template.name} className="toy-image" style={{ opacity: 0.6 }} />
              </div>
              <div className="cube-face cube-bottom"></div>
            </div>
          </div>
        ) : (
          <>
            <span className="toy-ear toy-ear-left" /><span className="toy-ear toy-ear-right" />
            <span className="toy-body"><b>{glyph}</b><i className="toy-eye toy-eye-left" /><i className="toy-eye toy-eye-right" /><i className="toy-mouth" /></span>
          </>
        )}
      </motion.div>}
    </AnimatePresence>
  );
}
