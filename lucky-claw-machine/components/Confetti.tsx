"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

interface ConfettiProps {
  active: boolean;
  big?: boolean;
}

const COLORS = ["#ff2e9a", "#2ee6ff", "#a855ff", "#ffe62e", "#39ff8a", "#ff8c2e"];

interface Piece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  rotate: number;
  drift: number;
  shape: "square" | "circle" | "triangle";
}

export default function Confetti({ active, big }: ConfettiProps) {
  const pieces: Piece[] = useMemo(() => {
    const count = big ? 90 : 45;
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2.2 + Math.random() * 1.6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotate: Math.random() * 360,
      drift: (Math.random() - 0.5) * 200,
      shape: (["square", "circle", "triangle"] as const)[Math.floor(Math.random() * 3)],
    }));
  }, [active, big]);

  return (
    <AnimatePresence>
      {active && (
        <div className="fixed inset-0 z-[80] pointer-events-none overflow-hidden">
          {pieces.map((p) => (
            <motion.div
              key={p.id}
              initial={{ top: "-5%", left: `${p.x}%`, opacity: 1, rotate: 0 }}
              animate={{
                top: "105%",
                left: `${p.x + (p.drift / 10)}%`,
                rotate: p.rotate,
                opacity: [1, 1, 0.9, 0],
              }}
              transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
              className="absolute"
              style={{
                width: p.shape === "triangle" ? 0 : 9,
                height: p.shape === "triangle" ? 0 : 9,
                background: p.shape === "triangle" ? "transparent" : p.color,
                borderRadius: p.shape === "circle" ? "50%" : p.shape === "square" ? 2 : 0,
                borderLeft: p.shape === "triangle" ? "5px solid transparent" : undefined,
                borderRight: p.shape === "triangle" ? "5px solid transparent" : undefined,
                borderBottom: p.shape === "triangle" ? `9px solid ${p.color}` : undefined,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
