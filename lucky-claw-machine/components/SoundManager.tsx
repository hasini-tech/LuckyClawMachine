"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/useGameStore";
import { soundManager } from "@/lib/sounds";

/**
 * Invisible component that wires up the procedural audio engine:
 * unlocks the AudioContext on first user gesture (required by browser
 * autoplay policies) and starts/stops the looping background music in
 * sync with the musicOn toggle in the store.
 */
export default function SoundManager() {
  const musicOn = useGameStore((s) => s.musicOn);
  const unlockedRef = useRef(false);

  useEffect(() => {
    const unlock = () => {
      if (unlockedRef.current) return;
      unlockedRef.current = true;
      soundManager.unlock();
      if (musicOn) soundManager.startMusic();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => soundManager.stopMusic();
  }, []);

  return null;
}
