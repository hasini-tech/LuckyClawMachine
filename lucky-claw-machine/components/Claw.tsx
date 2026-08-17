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
  heldImage?: string | null;
  dropDistance?: number;
}

const OPEN_PHASES: ClawPhase[] = ["ready", "aiming", "dropping", "releasing", "success", "failure", "settling"];

export default function Claw({ x, y, extension, phase, heldEmoji, heldColor, heldImage = null, dropDistance = 190 }: ClawProps) {
  const isOpen = OPEN_PHASES.includes(phase);
  const dropPx = extension * dropDistance;
  const fingerAngle = isOpen ? 45 : 0;
  const isGrabbing = phase === "grabbing";

  return (
    <div className="claw-rig" style={{ left: `${x}%`, top: `${y}%` }} aria-hidden="true">
      <motion.div className="claw-carriage" animate={phase === "moving_to_drop" ? { rotateZ: [0, -2, 2, 0] } : { rotateZ: 0 }} transition={{ duration: .7, ease: "easeInOut" }}>
        <div className="carriage-top-block" />
        <div className="carriage-mid-cylinder" />
        <div className="carriage-bottom-block" />
      </motion.div>
      <motion.div
        className="claw-drop-motion"
        animate={isGrabbing ? { x: [0, -2, 2, -1, 1, 0] } : { x: 0 }}
        transition={isGrabbing ? { duration: 0.42, ease: "easeInOut" } : { duration: 0.12 }}
      >
        <motion.div
          className="claw-cable"
          animate={{ height: 10 + dropPx }}
          transition={{ type: "tween", ease: extension > 0 ? "easeIn" : "easeOut", duration: 0.6 }}
        />
        <div className="claw-housing">
          <div className="housing-cap" />
          <div className="housing-base" />
          <div className="housing-cylinder" />
          <div className="housing-ring" />
        </div>
        <div className="claw-fingers">
          {[0, 1, 2, 3].map((index) => (
            <motion.div
              key={index}
              className={`claw-finger`}
              animate={{ rotateY: index * 90, rotateZ: fingerAngle }}
              transition={{ type: "spring", stiffness: 280, damping: 20 }}
            >
              <div className="finger-upper"><div className="finger-lower" /></div>
            </motion.div>
          ))}
        </div>
        {(heldEmoji || heldImage) && <motion.div className="claw-held-prize" animate={{ rotate: [0, -5, 0, 5, 0], y: [0, 2, 0] }} transition={{ rotate: { duration: 1.6, repeat: Infinity, ease: "easeInOut" }, y: { duration: 1, repeat: Infinity, ease: "easeInOut" } }}>
          {heldImage ? <span className="claw-held-box"><img src={heldImage} alt="" aria-hidden="true" /></span> : <span style={{ color: heldColor ?? "#fff" }}>{heldEmoji}</span>}
        </motion.div>}
      </motion.div>
    </div>
  );
}
