"use client";

import { motion } from "framer-motion";
import { PrizeTemplate } from "@/lib/prizes";

interface PrizeBox3DProps {
  template: PrizeTemplate;
  size?: "small" | "large";
  className?: string;
}

function BoxFace({ template, side = false }: { template: PrizeTemplate; side?: boolean }) {
  return (
    <div className={`reward-box-panel ${side ? "is-side" : ""}`}>
      {template.imageUrl ? (
        <img src={template.imageUrl} alt="" aria-hidden="true" />
      ) : (
        <b>{template.emoji}</b>
      )}
    </div>
  );
}

export default function PrizeBox3D({ template, size = "large", className = "" }: PrizeBox3DProps) {
  return (
    <div className={`reward-box-stage reward-box-stage-${size} ${className}`} aria-label={`${template.name} prize box`}>
      <div className="reward-box-floor" />
      <motion.div
        className="reward-box-cube"
        animate={{ rotateY: [18, -18, 18], rotateX: [-9, -3, -9], y: [0, -8, 0] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="reward-box-face reward-box-front"><BoxFace template={template} /></div>
        <div className="reward-box-face reward-box-back"><BoxFace template={template} side /></div>
        <div className="reward-box-face reward-box-right"><BoxFace template={template} side /></div>
        <div className="reward-box-face reward-box-left"><BoxFace template={template} side /></div>
        <div className="reward-box-face reward-box-top"><BoxFace template={template} side /></div>
        <div className="reward-box-face reward-box-bottom"><BoxFace template={template} side /></div>
      </motion.div>
    </div>
  );
}
