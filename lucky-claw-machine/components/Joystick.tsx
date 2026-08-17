"use client";

import { useRef, useState, useCallback, useEffect, useLayoutEffect } from "react";
import { motion } from "framer-motion";
import { soundManager } from "@/lib/sounds";

interface JoystickProps {
  onMove: (dx: number, dy: number) => void;
  disabled?: boolean;
  targetLocked?: boolean;
  targetAvailable?: boolean;
}

const DESKTOP_SPEED = 0.72;
const MOBILE_SPEED = 1.15;
const MOBILE_BREAKPOINT = 760;
const DEAD_ZONE = 0.1;
const MIN_TRAVEL_RADIUS = 1;

interface JoystickMetrics {
  centerX: number;
  centerY: number;
  travelRadius: number;
}

export default function Joystick({ onMove, disabled, targetLocked = false, targetAvailable = false }: JoystickProps) {
  const baseRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const vectorRef = useRef({ x: 0, y: 0 });
  const knobRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef<JoystickMetrics>({ centerX: 0, centerY: 0, travelRadius: 26 });
  const onMoveRef = useRef(onMove);
  const rafRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);
  const lastMoveSoundRef = useRef(0);

  onMoveRef.current = onMove;

  const measure = useCallback(() => {
    const base = baseRef.current;
    if (!base) return metricsRef.current;

    const rect = base.getBoundingClientRect();
    const knobRect = knobRef.current?.getBoundingClientRect();
    const baseStyle = window.getComputedStyle(base);
    const borderX = parseFloat(baseStyle.borderLeftWidth) || 0;
    const borderY = parseFloat(baseStyle.borderTopWidth) || 0;
    const knobWidth = knobRect?.width ?? rect.width * 0.5;
    const knobHeight = knobRect?.height ?? rect.height * 0.5;

    // The knob must stay inside the base, including its own width/height.
    // Using the real rendered sizes keeps this correct at every breakpoint.
    const maxOffsetX = Math.max(MIN_TRAVEL_RADIUS, (rect.width - knobWidth) / 2 - borderX);
    const maxOffsetY = Math.max(MIN_TRAVEL_RADIUS, (rect.height - knobHeight) / 2 - borderY);
    metricsRef.current = {
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
      travelRadius: Math.min(maxOffsetX, maxOffsetY),
    };
    return metricsRef.current;
  }, []);

  useLayoutEffect(() => {
    measure();
    const base = baseRef.current;
    if (!base) return;

    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(base);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const tick = useCallback((now: number) => {
    if (!draggingRef.current) {
      rafRef.current = null;
      return;
    }

    const lastTick = lastTickRef.current ?? now - 16.67;
    const frameScale = Math.min(32, now - lastTick) / 16.67;
    lastTickRef.current = now;
    const { x, y } = vectorRef.current;
    if (x !== 0 || y !== 0) {
      const speed = typeof window !== "undefined" && window.innerWidth <= MOBILE_BREAKPOINT
        ? MOBILE_SPEED
        : DESKTOP_SPEED;
      onMoveRef.current(x * speed * frameScale, y * speed * frameScale);
      if (now - lastMoveSoundRef.current > 150) {
        soundManager.joystickMove();
        lastMoveSoundRef.current = now;
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const updateFromPointer = useCallback((clientX: number, clientY: number) => {
    const base = baseRef.current;
    if (!base) return;
    const { centerX, centerY, travelRadius } = metricsRef.current;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);
    if (dist > travelRadius && dist > 0) {
      dx = (dx / dist) * travelRadius;
      dy = (dy / dist) * travelRadius;
    }
    setKnob({ x: dx, y: dy });
    const normalizedDistance = Math.min(1, Math.hypot(dx, dy) / travelRadius);
    if (normalizedDistance <= DEAD_ZONE || normalizedDistance === 0) {
      vectorRef.current = { x: 0, y: 0 };
    } else {
      const outputDistance = (normalizedDistance - DEAD_ZONE) / (1 - DEAD_ZONE);
      const directionLength = Math.hypot(dx, dy);
      vectorRef.current = {
        x: (dx / directionLength) * outputDistance,
        y: (dy / directionLength) * outputDistance,
      };
    }
  }, [measure]);

  const stop = useCallback(() => {
    draggingRef.current = false;
    pointerIdRef.current = null;
    lastTickRef.current = null;
    vectorRef.current = { x: 0, y: 0 };
    setKnob({ x: 0, y: 0 });
    setDragging(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  useEffect(() => {
    const onUp = (event: PointerEvent) => {
      if (pointerIdRef.current === event.pointerId) stop();
    };
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("blur", stop);
    return () => {
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("blur", stop);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [stop]);

  useEffect(() => {
    if (disabled) stop();
  }, [disabled, stop]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled || !e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.preventDefault();
    soundManager.unlock();
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerIdRef.current = e.pointerId;
    draggingRef.current = true;
    setDragging(true);
    lastTickRef.current = performance.now();
    measure();
    updateFromPointer(e.clientX, e.clientY);
    if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingRef.current && pointerIdRef.current === e.pointerId && !disabled) updateFromPointer(e.clientX, e.clientY);
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    if (pointerIdRef.current === e.pointerId) stop();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    const step = e.shiftKey ? 6 : 3;
    const directions: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0], ArrowRight: [step, 0],
      ArrowUp: [0, -step], ArrowDown: [0, step],
      a: [-step, 0], d: [step, 0], w: [0, -step], s: [0, step],
    };
    const direction = directions[e.key] ?? directions[e.key.toLowerCase()];
    if (!direction) return;
    e.preventDefault();
    e.stopPropagation();
    soundManager.unlock();
    soundManager.joystickMove();
    onMove(direction[0], direction[1]);
  };

  const travelRadius = Math.max(MIN_TRAVEL_RADIUS, metricsRef.current.travelRadius);
  const knobDistance = Math.min(1, Math.hypot(knob.x, knob.y) / travelRadius);
  // The shaft is anchored at the socket (the centre of the base). Its local
  // direction points down, so convert the knob's screen vector into the
  // rotation needed to keep the shaft visually connected in real time.
  const stickRotation = knobDistance < 0.01
    ? 180
    : 180 + Math.atan2(knob.x, -knob.y) * (180 / Math.PI);
  const stickLength = 0.58 + knobDistance * 0.42;
  const outputPercent = Math.round(knobDistance * 100);
  const status = disabled ? "BUSY" : targetLocked ? "LOCKED" : dragging ? "MOVE" : targetAvailable ? "AIM" : "READY";

  return (
    <div
      ref={baseRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onLostPointerCapture={stop}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={handleKeyDown}
      className={`joystick-control ${disabled ? "is-disabled" : ""} ${targetLocked ? "is-target-locked" : ""}`}
      data-active={dragging}
      role="slider"
      aria-label="Claw joystick"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={outputPercent}
      aria-valuetext={targetLocked ? "Prize box aligned" : `${status}, move the claw`}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      data-joystick="true"
    >
      <div className="joystick-halo" />
      <div className="joystick-direction joystick-direction-up">▲</div>
      <div className="joystick-direction joystick-direction-right">▶</div>
      <div className="joystick-direction joystick-direction-down">▼</div>
      <div className="joystick-direction joystick-direction-left">◀</div>
      <div className="joystick-shadow" />
      <div className="joystick-platform" />
      <div className="joystick-socket" />
      <motion.div
        className="joystick-stick"
        animate={{ rotate: stickRotation, scaleY: stickLength }}
        transition={{ type: dragging ? "tween" : "spring", duration: 0.06, stiffness: 300, damping: 20 }}
        aria-hidden="true"
      />
      <motion.div
        animate={{ x: knob.x, y: knob.y }}
        transition={{ type: dragging ? "tween" : "spring", duration: 0.06, stiffness: 300, damping: 20 }}
        ref={knobRef}
        className="joystick-knob"
      />
      <div className="joystick-status" aria-hidden="true"><span>{status}</span></div>
    </div>
  );
}
