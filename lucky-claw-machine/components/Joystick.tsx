"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";

interface JoystickProps { onMove: (dx: number, dy: number) => void; disabled?: boolean; }
const RADIUS = 26;
const SPEED = 1.6;

export default function Joystick({ onMove, disabled }: JoystickProps) {
  const baseRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const vectorRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const draggingRef = useRef(false);

  const tick = useCallback(() => {
    if (!draggingRef.current) return;
    const { x, y } = vectorRef.current;
    if (x !== 0 || y !== 0) onMove((x / RADIUS) * SPEED, (y / RADIUS) * SPEED);
    rafRef.current = requestAnimationFrame(tick);
  }, [onMove]);

  const updateFromPointer = useCallback((clientX: number, clientY: number) => {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > RADIUS) { dx = (dx / dist) * RADIUS; dy = (dy / dist) * RADIUS; }
    setKnob({ x: dx, y: dy });
    vectorRef.current = { x: dx, y: dy };
  }, []);

  const stop = useCallback(() => {
    draggingRef.current = false;
    vectorRef.current = { x: 0, y: 0 };
    setKnob({ x: 0, y: 0 });
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    const onUp = () => stop();
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => { window.removeEventListener("pointerup", onUp); window.removeEventListener("pointercancel", onUp); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [stop]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    draggingRef.current = true;
    updateFromPointer(e.clientX, e.clientY);
    rafRef.current = requestAnimationFrame(tick);
  };
  const handlePointerMove = (e: React.PointerEvent) => { if (draggingRef.current && !disabled) updateFromPointer(e.clientX, e.clientY); };

  return (
    <div ref={baseRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} className={`joystick-control ${disabled ? "is-disabled" : ""}`} role="slider" aria-label="Claw joystick" aria-disabled={disabled}>
      <div className="joystick-shadow" />
      <div className="joystick-stick" />
      <motion.div animate={{ x: knob.x, y: knob.y }} transition={{ type: draggingRef.current ? "tween" : "spring", duration: 0.05, stiffness: 300, damping: 20 }} className="joystick-knob" />
    </div>
  );
}
