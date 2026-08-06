"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/store/useGameStore";
import { RARITY_CONFIG } from "@/lib/prizes";
import { animateValue2D, computeGrabChance, distance, rollSuccess } from "@/lib/physics";
import { soundManager } from "@/lib/sounds";
import Claw from "./Claw";
import Prize from "./Prize";
import Joystick from "./Joystick";
import CoinSlot from "./CoinSlot";
import Confetti from "./Confetti";

const CHUTE_POS = { x: 8, y: 78 };
const REST_POS = { x: 51, y: 11 };
const FIELD_MAX_DIST = 95;
const PRIZE_COUNT = 42;

const stars = [
  { left: "8%", top: "22%", size: 15, delay: 0 },
  { left: "13%", top: "41%", size: 21, delay: 0.6 },
  { left: "75%", top: "31%", size: 12, delay: 1.2 },
  { left: "88%", top: "54%", size: 16, delay: 1.8 },
  { left: "4%", top: "67%", size: 9, delay: 0.2 },
];

export default function ClawMachine() {
  const { coins, clawX, clawY, clawExtension, clawPhase, heldPrizeUid, prizes, insertCoin, moveClaw, setClawPos, setClawExtension, setClawPhase, setHeldPrize, markPrizeGrabbed, markPrizeFallen, removePrize, respawnPrize, awardPrize, registerMiss, initPrizes } = useGameStore();
  const [confettiActive, setConfettiActive] = useState(false);
  const [confettiBig, setConfettiBig] = useState(false);
  const [shake, setShake] = useState(false);
  const missStreakRef = useRef(0);
  const cancelAnimRef = useRef<null | (() => void)>(null);
  const pressedKeys = useRef<Set<string>>(new Set());
  const keyRafRef = useRef<number | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      initPrizes(PRIZE_COUNT);
    }
  }, [initPrizes]);

  const isIdle = clawPhase === "idle";

  const triggerGrab = useCallback(() => {
    const state = useGameStore.getState();
    if (state.clawPhase !== "idle") return;
    if (state.coins < 1) {
      soundManager.outOfCoins();
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }

    soundManager.unlock();
    insertCoin(-1);
    soundManager.buttonPress();
    const startX = state.clawX;
    const startY = state.clawY;
    setClawPhase("dropping");
    soundManager.clawDrop();
    setClawExtension(1);

    setTimeout(() => {
      setClawPhase("grabbing");
      soundManager.clawClose();
      const current = useGameStore.getState();
      let target: (typeof current.prizes)[number] | null = null;
      let bestDist = Infinity;
      for (const p of current.prizes) {
        if (p.fallen) continue;
        const d = distance(startX, startY, p.x, p.y);
        if (d < bestDist) {
          bestDist = d;
          target = p;
        }
      }

      let success = false;
      if (target && bestDist <= FIELD_MAX_DIST) {
        const cfg = RARITY_CONFIG[target.template.rarity];
        success = rollSuccess(computeGrabChance({ baseWeight: cfg.grabWeight, distancePx: bestDist, maxDistance: FIELD_MAX_DIST, missStreak: missStreakRef.current }));
      }

      setTimeout(() => {
        if (success && target) {
          markPrizeGrabbed(target.uid, true);
          setHeldPrize(target.uid);
          missStreakRef.current = 0;
        } else {
          missStreakRef.current += 1;
        }
        setClawPhase("lifting");
        soundManager.clawRise();
        setClawExtension(0);

        setTimeout(() => {
          setClawPhase("returning");
          cancelAnimRef.current?.();
          cancelAnimRef.current = animateValue2D({ x: startX, y: startY }, CHUTE_POS, 650, (v) => setClawPos(v.x, v.y), () => {
            setClawPhase("releasing");
            soundManager.clawOpen();
            setTimeout(() => {
              if (success && target) {
                markPrizeFallen(target.uid);
                setHeldPrize(null);
                awardPrize(target.template);
                const jackpot = useGameStore.getState().isJackpotWin;
                soundManager[jackpot ? "jackpot" : "win"]();
                setConfettiBig(jackpot);
                setConfettiActive(true);
                setTimeout(() => setConfettiActive(false), jackpot ? 3200 : 1800);
                setTimeout(() => {
                  removePrize(target.uid);
                  respawnPrize();
                }, 500);
              } else {
                soundManager.lose();
                registerMiss();
              }

              setClawPhase("settling");
              setTimeout(() => {
                cancelAnimRef.current?.();
                cancelAnimRef.current = animateValue2D({ x: CHUTE_POS.x, y: CHUTE_POS.y }, REST_POS, 500, (v) => setClawPos(v.x, v.y), () => setClawPhase("idle"));
              }, 350);
            }, 350);
          });
        }, 550);
      }, 450);
    }, 650);
  }, [insertCoin, setClawPhase, setClawExtension, setClawPos, markPrizeGrabbed, setHeldPrize, markPrizeFallen, removePrize, respawnPrize, awardPrize, registerMiss]);

  const simulateKey = (key: string, isDown: boolean) => {
    if (isDown) pressedKeys.current.add(key);
    else pressedKeys.current.delete(key);
  };

  const keyLoop = useCallback(() => {
    const keys = pressedKeys.current;
    if (keys.size > 0 && useGameStore.getState().clawPhase === "idle") {
      let dx = 0;
      let dy = 0;
      if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) dx -= 1.25;
      if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) dx += 1.25;
      if (keys.has("ArrowUp") || keys.has("w") || keys.has("W")) dy -= 1.25;
      if (keys.has("ArrowDown") || keys.has("s") || keys.has("S")) dy += 1.25;
      if (dx !== 0 || dy !== 0) moveClaw(dx, dy);
    }
    keyRafRef.current = requestAnimationFrame(keyLoop);
  }, [moveClaw]);

  useEffect(() => {
    keyRafRef.current = requestAnimationFrame(keyLoop);
    const onDown = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) e.preventDefault();
      pressedKeys.current.add(e.key);
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        triggerGrab();
      }
    };
    const onUp = (e: KeyboardEvent) => pressedKeys.current.delete(e.key);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      if (keyRafRef.current) cancelAnimationFrame(keyRafRef.current);
      cancelAnimRef.current?.();
    };
  }, [keyLoop, triggerGrab]);

  const heldPrize = prizes.find((p) => p.uid === heldPrizeUid) ?? null;

  return (
    <div className="arcade-scene">
      <div className="arcade-backdrop" aria-hidden="true">
        <div className="backdrop-left-panel" />
        <div className="backdrop-floor" />
        <div className="backdrop-right-wall" />
        <div className="backdrop-right-shelf">
          <div className="shelf-card shelf-card-one"><span>★</span><b>NEW</b></div>
          <div className="shelf-card shelf-card-two"><span>◆</span><b>NEW</b></div>
          <div className="shelf-card shelf-card-three"><span>●</span><b>NEW</b></div>
        </div>
        {stars.map((star, index) => <span key={index} className="scene-star" style={{ left: star.left, top: star.top, fontSize: star.size, animationDelay: `${star.delay}s` }}>✦</span>)}
      </div>

      <motion.div className="claw-machine-shell" animate={shake ? { x: [0, -7, 7, -5, 5, 0] } : { x: 0 }} transition={{ duration: 0.4 }}>
        <div className="machine-glass">
          <div className="prism-wall" aria-hidden="true">
            <i className="prism prism-a" /><i className="prism prism-b" /><i className="prism prism-c" /><i className="prism prism-d" /><i className="prism prism-e" /><i className="prism prism-f" /><i className="prism prism-g" /><i className="prism prism-h" /><i className="prism prism-i" /><i className="prism prism-j" />
          </div>
          <div className="machine-back-glow" />
          <div className="glass-star glass-star-one">✦</div><div className="glass-star glass-star-two">✦</div><div className="glass-star glass-star-three">✧</div>
          <div className="prize-tray"><div className="tray-back" /><div className="tray-shadow" /></div>
          {prizes.map((prize) => <Prize key={prize.uid} prize={prize} isHeld={prize.uid === heldPrizeUid} isDropping={false} />)}
          <Claw x={clawX} y={clawY} extension={clawExtension} phase={clawPhase} heldEmoji={heldPrize?.template.emoji ?? null} heldColor={heldPrize ? RARITY_CONFIG[heldPrize.template.rarity].color : null} />
          <div className="glass-shine" aria-hidden="true" /><div className="glass-edge-bottom" aria-hidden="true" />
        </div>

        <div className="machine-beam machine-beam-left" aria-hidden="true" /><div className="machine-beam machine-beam-right" aria-hidden="true" />
        <div className="machine-top-rail" aria-hidden="true"><div className="rail-lamp" /><div className="rail-lamp rail-lamp-two" /><div className="rail-track" /></div>

        <div className="machine-deck">
          <div className="deck-screw screw-tl" /><div className="deck-screw screw-tr" />
          <div className="deck-screw screw-bl" /><div className="deck-screw screw-br" />
          <div className="deck-shadow" />
          <div className="deck-arrow deck-arrow-left" onPointerDown={() => simulateKey("ArrowLeft", true)} onPointerUp={() => simulateKey("ArrowLeft", false)} onPointerLeave={() => simulateKey("ArrowLeft", false)}>◀</div>
          <div className="deck-arrow deck-arrow-up" onPointerDown={() => simulateKey("ArrowUp", true)} onPointerUp={() => simulateKey("ArrowUp", false)} onPointerLeave={() => simulateKey("ArrowUp", false)}>▲</div>
          <div className="deck-arrow deck-arrow-down" onPointerDown={() => simulateKey("ArrowDown", true)} onPointerUp={() => simulateKey("ArrowDown", false)} onPointerLeave={() => simulateKey("ArrowDown", false)}>▼</div>
          <div className="deck-arrow deck-arrow-right" onPointerDown={() => simulateKey("ArrowRight", true)} onPointerUp={() => simulateKey("ArrowRight", false)} onPointerLeave={() => simulateKey("ArrowRight", false)}>▶</div>
          <CoinSlot onInsert={() => insertCoin(1)} disabled={false} />
          <Joystick onMove={moveClaw} disabled={!isIdle} />
          <motion.button onClick={triggerGrab} disabled={!isIdle || coins < 1} whileTap={{ scale: 0.93 }} className={`grab-button ${!isIdle || coins < 1 ? "is-disabled" : ""}`} aria-label="Press to grab"><span /></motion.button>
          <div className="deck-coin-count">{String(coins).padStart(2, "0")}</div>
        </div>
      </motion.div>

      <div className="machine-ground-shadow" aria-hidden="true" />
      <Confetti active={confettiActive} big={confettiBig} />
    </div>
  );
}
