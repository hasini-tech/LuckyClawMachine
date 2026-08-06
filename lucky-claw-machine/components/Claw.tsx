"use client";

import { motion } from "framer-motion";
import { ClawPhase } from "@/store/useGameStore";

interface ClawProps {
  x: number;
  y: number;
  extension: number;
  phase: ClawPhase;
  heldEmoji: string | null;
  heldColor: string | null;
}

const OPEN_PHASES: ClawPhase[] = ["idle", "dropping", "releasing", "settling"];

export default function Claw({ x, y, extension, phase, heldEmoji, heldColor }: ClawProps) {
  const isOpen = OPEN_PHASES.includes(phase);
  const dropPx = extension * 190;
  const fingerAngle = isOpen ? 32 : 7;

  return (
    <div className="claw-rig" style={{ left: `${x}%`, top: `${y}%` }} aria-hidden="true">
      <motion.div className="claw-drop-motion" animate={{ y: dropPx }} transition={{ type: "tween", ease: extension > 0 ? "easeIn" : "easeOut", duration: 0.6 }}>
        <div className="claw-cable" />
        <div className="claw-housing"><div className="housing-highlight" /><div className="housing-bolt housing-bolt-left" /><div className="housing-bolt housing-bolt-right" /></div>
        {heldEmoji && <motion.div className="claw-held-prize" animate={{ rotate: [0, -5, 0, 5, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}><span style={{ color: heldColor ?? "#fff" }}>●</span></motion.div>}
        <div className="claw-fingers">
          {[-1, 0, 1].map((direction, index) => <motion.i key={index} className={`claw-finger claw-finger-${index}`} animate={{ rotate: direction === 0 ? 0 : direction * fingerAngle }} transition={{ type: "spring", stiffness: 260, damping: 18 }} />)}
        </div>
      </motion.div>
    </div>
  );
}
