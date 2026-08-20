"use client";

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
  const depth = prize.depth ?? ((seed % 100) / 100);
  const size = 28 + (seed % 18) + Math.round(depth * 7);
  const depthScale = .82 + depth * .22;
  const tilt = -12 + (seed % 25);
  if (prize.fallen || isHeld) return null;

  return (
    <div className="toy-prize" style={{ left: `${prize.x}%`, top: `${prize.y}%`, zIndex: 10 + Math.round(depth * 28), ["--toy-size" as string]: `${size}px`, ["--toy-depth" as string]: depth, ["--toy-scale" as string]: depthScale, ["--toy-tilt" as string]: `${tilt}deg`, ["--toy-color" as string]: color }}>
        <span className="toy-glow" style={{ background: cfg.glow }} />
        {prize.template.imageUrl ? (
          <div className="toy-box-3d">
            <div className="cube" style={{ transform: `rotateX(-35deg) rotateY(${15 + (seed % 30)}deg)` }}>
              <div className="cube-face cube-front">
                <span className="cube-brand-panel">
                  <img src={prize.template.imageUrl} alt={prize.template.name} className="toy-image" />
                </span>
              </div>
              <div className="cube-face cube-back">
                <span className="cube-brand-panel">
                  <img src={prize.template.imageUrl} alt="" className="toy-image" aria-hidden="true" />
                </span>
              </div>
              <div className="cube-face cube-right"></div>
              <div className="cube-face cube-left"></div>
              <div className="cube-face cube-top">
                <span className="cube-brand-panel cube-brand-panel-top">
                  <img src={prize.template.imageUrl} alt="" className="toy-image" aria-hidden="true" />
                </span>
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
    </div>
  );
}
