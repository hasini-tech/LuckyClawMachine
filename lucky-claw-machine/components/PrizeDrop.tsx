"use client";

import { motion } from "framer-motion";
import { PrizeTemplate } from "@/lib/prizes";

interface PrizeDropProps {
  template: PrizeTemplate;
}

export default function PrizeDrop({ template }: PrizeDropProps) {
  return (
    <motion.div
      className="prize-drop"
      initial={{ opacity: 0, y: -28, scale: .72, rotate: -8 }}
      animate={{ opacity: [0, 1, 1, 0], y: [-28, -8, 8, 22], scale: [.72, 1, .96, .72], rotate: [-8, 3, -2, 5] }}
      transition={{ duration: .72, times: [0, .2, .7, 1], ease: "easeIn" }}
      aria-hidden="true"
    >
      <span className="prize-drop-glow" />
      {template.imageUrl ? <img src={template.imageUrl} alt="" /> : <b>{template.emoji}</b>}
    </motion.div>
  );
}
