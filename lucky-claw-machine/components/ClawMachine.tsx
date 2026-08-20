"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
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
import PrizeDrop from "./PrizeDrop";

const CHUTE_POS = { x: 8, y: 78 };
const REST_POS = { x: 51, y: 11 };
const GRAB_RADIUS_PX = 38;
const PRIZE_COUNT = 85;
const KEYBOARD_SPEED = 2.1;

function responsivePrizeCount() {
  if (typeof window === "undefined") return PRIZE_COUNT;
  if (window.innerWidth <= 380) return 45;
  if (window.innerWidth <= 760) return 60;
  return PRIZE_COUNT;
}

const stars = [
  { left: "8%", top: "22%", size: 15, delay: 0 },
  { left: "13%", top: "41%", size: 21, delay: 0.6 },
  { left: "75%", top: "31%", size: 12, delay: 1.2 },
  { left: "88%", top: "54%", size: 16, delay: 1.8 },
  { left: "4%", top: "67%", size: 9, delay: 0.2 },
];

export default function ClawMachine() {
  const { coins, clawX, clawY, clawExtension, clawPhase, heldPrizeUid, prizes, cameraMode, streak, jackpotProgress, insertCoin, moveClaw, setClawPos, setClawExtension, setClawPhase, setHeldPrize, releaseHeldPrize, recordAttempt, markPrizeGrabbed, markPrizeFallen, removePrize, respawnPrize, awardPrize, registerMiss, initPrizes } = useGameStore();
  const [confettiActive, setConfettiActive] = useState(false);
  const [confettiBig, setConfettiBig] = useState(false);
  const [shake, setShake] = useState(false);
  const [feedback, setFeedback] = useState<"success" | "miss" | null>(null);
  const [releaseDrop, setReleaseDrop] = useState<{ uid: string; template: (typeof prizes)[number]["template"] } | null>(null);
  const [fieldSize, setFieldSize] = useState({ width: 320, height: 520 });
  const glassRef = useRef<HTMLDivElement>(null);
  const missStreakRef = useRef(0);
  const cancelAnimRef = useRef<null | (() => void)>(null);
  const pressedKeys = useRef<Set<string>>(new Set());
  const keyRafRef = useRef<number | null>(null);
  const keyLoopLastTimeRef = useRef<number | null>(null);
  const sequenceTimersRef = useRef<number[]>([]);
  const sequenceIdRef = useRef(0);
  const initialized = useRef(false);

  const scheduleSequenceStep = useCallback((callback: () => void, delay: number) => {
    // Every delayed claw action is registered so a new grab, restart, or
    // timeout can cancel the whole sequence without stale callbacks firing.
    const safeDelay = Math.max(0, delay);
    let timerId = 0;
    timerId = window.setTimeout(() => {
      sequenceTimersRef.current = sequenceTimersRef.current.filter((id) => id !== timerId);
      callback();
    }, safeDelay);
    sequenceTimersRef.current.push(timerId);
  }, []);

  const cancelClawSequence = useCallback((resetPosition = false) => {
    sequenceIdRef.current += 1;
    sequenceTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    sequenceTimersRef.current = [];
    cancelAnimRef.current?.();
    cancelAnimRef.current = null;
    if (resetPosition) {
      const heldUid = useGameStore.getState().heldPrizeUid;
      if (heldUid) releaseHeldPrize(heldUid);
      setClawPhase("ready");
      setClawExtension(0);
      setHeldPrize(null);
      setReleaseDrop(null);
      setClawPos(REST_POS.x, REST_POS.y);
    }
  }, [releaseHeldPrize, setClawExtension, setClawPhase, setClawPos, setHeldPrize]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      initPrizes(responsivePrizeCount());
    }
  }, [initPrizes]);

  useEffect(() => {
    const glass = glassRef.current;
    if (!glass) return;

    const measureField = () => {
      const rect = glass.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setFieldSize((current) => current.width === rect.width && current.height === rect.height
          ? current
          : { width: rect.width, height: rect.height });
      }
    };

    measureField();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measureField);
    observer?.observe(glass);
    window.addEventListener("resize", measureField);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measureField);
    };
  }, []);

  useEffect(() => () => {
    sequenceIdRef.current += 1;
    sequenceTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    cancelAnimRef.current?.();
  }, []);

  const isAiming = clawPhase === "aiming";
  const carriageY = 10 + clawY * 0.12;
  const dropTargetPx = Math.max(0, ((clawY - carriageY) / 100) * fieldSize.height - 64);

  const pulseMachine = useCallback((duration = 260) => {
    setShake(true);
    window.setTimeout(() => setShake(false), duration);
  }, []);

  const haptic = useCallback((pattern: number | number[]) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
  }, []);

  const triggerGrab = useCallback(() => {
    const state = useGameStore.getState();
    if (state.clawPhase !== "aiming") return;
    if (state.coins < 1) {
      soundManager.outOfCoins();
      pulseMachine(400);
      haptic(35);
      return;
    }

    soundManager.unlock();
    insertCoin(-1);
    recordAttempt();
    soundManager.buttonPress();
    pulseMachine(220);
    haptic(18);
    setFeedback(null);
    const startX = state.clawX;
    const startY = state.clawY;
    const sequenceId = sequenceIdRef.current + 1;
    sequenceIdRef.current = sequenceId;
    setClawPhase("dropping");
    soundManager.clawDrop();
    setClawExtension(1);

    scheduleSequenceStep(() => {
      if (sequenceIdRef.current !== sequenceId) return;
      setClawPhase("grabbing");
      soundManager.clawClose();
      const current = useGameStore.getState();
      let target: (typeof current.prizes)[number] | null = null;
      let bestDist = Infinity;
      for (const p of current.prizes) {
        if (p.fallen || p.grabbed) continue;
        const d = distance(
          (startX / 100) * fieldSize.width,
          (startY / 100) * fieldSize.height,
          (p.x / 100) * fieldSize.width,
          (p.y / 100) * fieldSize.height,
        );
        if (d < bestDist) {
          bestDist = d;
          target = p;
        }
      }

      let success = false;
      if (target && bestDist <= GRAB_RADIUS_PX) {
        const cfg = RARITY_CONFIG[target.template.rarity];
        success = rollSuccess(computeGrabChance({ baseWeight: cfg.grabWeight, distancePx: bestDist, maxDistance: GRAB_RADIUS_PX, missStreak: missStreakRef.current }));
      }

      scheduleSequenceStep(() => {
        if (sequenceIdRef.current !== sequenceId) return;
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

        scheduleSequenceStep(() => {
          if (sequenceIdRef.current !== sequenceId) return;
          setClawPhase("moving_to_drop");
          cancelAnimRef.current?.();
          cancelAnimRef.current = animateValue2D({ x: startX, y: startY }, CHUTE_POS, 650, (v) => setClawPos(v.x, v.y), () => {
            if (sequenceIdRef.current !== sequenceId) return;
            setClawPhase("releasing");
            soundManager.clawOpen();
            scheduleSequenceStep(() => {
              if (sequenceIdRef.current !== sequenceId) return;
              if (success && target) {
                markPrizeFallen(target.uid);
                setHeldPrize(null);
                setReleaseDrop({ uid: target.uid, template: target.template });
                scheduleSequenceStep(() => {
                  if (sequenceIdRef.current !== sequenceId) return;
                  setClawPhase("success");
                  awardPrize(target.template);
                  const jackpot = useGameStore.getState().isJackpotWin;
                  soundManager[jackpot ? "jackpot" : "win"]();
                  setFeedback("success");
                  pulseMachine(480);
                  haptic([20, 35, 20]);
                  setConfettiBig(jackpot);
                  setConfettiActive(true);
                  scheduleSequenceStep(() => {
                    if (sequenceIdRef.current === sequenceId) setConfettiActive(false);
                  }, jackpot ? 3200 : 1800);
                }, 520);
                scheduleSequenceStep(() => {
                  if (sequenceIdRef.current !== sequenceId) return;
                  setReleaseDrop(null);
                  removePrize(target.uid);
                  respawnPrize();
                }, 820);
              } else {
                soundManager.lose();
                setFeedback("miss");
                haptic(45);
                setClawPhase("failure");
                registerMiss();
              }

              scheduleSequenceStep(() => setFeedback(null), success ? 2300 : 1600);

              scheduleSequenceStep(() => {
                if (sequenceIdRef.current !== sequenceId) return;
                setClawPhase("settling");
                cancelAnimRef.current?.();
                cancelAnimRef.current = animateValue2D({ x: CHUTE_POS.x, y: CHUTE_POS.y }, REST_POS, 500, (v) => setClawPos(v.x, v.y), () => setClawPhase("aiming"));
              }, success ? 1050 : 500);
            }, 350);
          });
        }, 550);
      }, 450);
    }, 650);
  }, [fieldSize, haptic, insertCoin, pulseMachine, recordAttempt, scheduleSequenceStep, setClawPhase, setClawExtension, setClawPos, markPrizeGrabbed, setHeldPrize, markPrizeFallen, removePrize, respawnPrize, awardPrize, registerMiss]);

  const simulateKey = (key: string, isDown: boolean) => {
    if (isDown) pressedKeys.current.add(key);
    else pressedKeys.current.delete(key);
  };

  const pressDirection = (event: ReactPointerEvent<HTMLButtonElement>, key: string) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    simulateKey(key, true);
  };

  const releaseDirection = (event: ReactPointerEvent<HTMLButtonElement>, key: string) => {
    event.preventDefault();
    simulateKey(key, false);
  };

  const keyLoop = useCallback((now: number) => {
    const lastTime = keyLoopLastTimeRef.current ?? now - 16.67;
    const frameScale = Math.min(32, now - lastTime) / 16.67;
    keyLoopLastTimeRef.current = now;
    const keys = pressedKeys.current;
    if (keys.size > 0 && useGameStore.getState().clawPhase === "aiming") {
      let dx = 0;
      let dy = 0;
      if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) dx -= KEYBOARD_SPEED;
      if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) dx += KEYBOARD_SPEED;
      if (keys.has("ArrowUp") || keys.has("w") || keys.has("W")) dy -= KEYBOARD_SPEED;
      if (keys.has("ArrowDown") || keys.has("s") || keys.has("S")) dy += KEYBOARD_SPEED;
      dx *= frameScale;
      dy *= frameScale;
      if (dx !== 0 || dy !== 0) moveClaw(dx, dy);
    }
    keyRafRef.current = requestAnimationFrame(keyLoop);
  }, [moveClaw]);

  useEffect(() => {
    if (!isAiming) pressedKeys.current.clear();
  }, [isAiming]);

  useEffect(() => {
    keyLoopLastTimeRef.current = null;
    keyRafRef.current = requestAnimationFrame(keyLoop);
    const onDown = (e: KeyboardEvent) => {
      const directionalKey = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key);
      const isJoystickTarget = e.target instanceof HTMLElement && Boolean(e.target.closest("[data-joystick='true']"));
      if (directionalKey) {
        e.preventDefault();
        // Joystick.tsx handles one accessible step for focused arrow keys.
        // Do not also add the key to the machine-wide held-key loop.
        if (isJoystickTarget) return;
      }
      pressedKeys.current.add(e.key);
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        triggerGrab();
      }
    };
    const onUp = (e: KeyboardEvent) => pressedKeys.current.delete(e.key);
    const onBlur = () => {
      pressedKeys.current.clear();
      keyLoopLastTimeRef.current = null;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
      if (keyRafRef.current) cancelAnimationFrame(keyRafRef.current);
      keyLoopLastTimeRef.current = null;
      cancelAnimRef.current?.();
    };
  }, [keyLoop, triggerGrab]);

  const heldPrize = prizes.find((p) => p.uid === heldPrizeUid) ?? null;

  return (
    <div className="arcade-scene" data-phase={clawPhase} data-camera={cameraMode}>
      <div className="arcade-backdrop" aria-hidden="true">
        <div className="backdrop-left-panel">
          <div className="logo-container">
            <div className="logo-box logo-lite"><img src="/images/lite-logo.png" alt="Lite Logo" /></div>
            <div className="logo-box logo-gowhat"><img src="/images/gowhat.png" alt="GoWhat Logo" /></div>
          </div>
        </div>
        <div className="backdrop-floor-grid" />
        <div className="backdrop-floor" />
        <div className="backdrop-right-wall" />
        <div className="backdrop-right-shelf">
          <div className="shelf-card shelf-card-one"><span>★</span><b>NEW</b></div>
          <div className="shelf-card shelf-card-two"><span>◆</span><b>NEW</b></div>
          <div className="shelf-card shelf-card-three"><span>●</span><b>NEW</b></div>
        </div>
        {stars.map((star, index) => <span key={index} className="scene-star" style={{ left: star.left, top: star.top, fontSize: star.size, animationDelay: `${star.delay}s` }}>✦</span>)}
        <div className="scene-vignette" />
      </div>

      <motion.div className="claw-machine-shell" animate={shake ? { x: [0, -7, 7, -5, 5, 0] } : { x: 0 }} transition={{ duration: 0.4 }}>
        <div className="machine-side-depth machine-side-depth-left" aria-hidden="true" />
        <div className="machine-side-depth machine-side-depth-right" aria-hidden="true" />
        <div className="machine-crown" aria-hidden="true"><span>LUCKY</span><b>CLAW</b></div>
        <div className="machine-glass" ref={glassRef}>
          <div className="prism-wall" aria-hidden="true" />
          <div className="machine-back-glow" />
          <div className="machine-light-beam machine-light-beam-one" aria-hidden="true" />
          <div className="machine-light-beam machine-light-beam-two" aria-hidden="true" />
          <div className="glass-star glass-star-one">✦</div><div className="glass-star glass-star-two">✦</div><div className="glass-star glass-star-three">✧</div>
          <div className="prize-tray"><div className="tray-back" /><div className="tray-shadow" /></div>
          <div className="prize-chute" aria-label="Prize collection chute"><span>DROP</span></div>
          {prizes.map((prize) => <Prize key={prize.uid} prize={prize} isHeld={prize.uid === heldPrizeUid} isDropping={false} />)}
          {releaseDrop && <PrizeDrop key={releaseDrop.uid} template={releaseDrop.template} />}
          <Claw x={clawX} y={carriageY} extension={clawExtension} phase={clawPhase} dropDistance={dropTargetPx} heldEmoji={heldPrize?.template.emoji ?? null} heldColor={heldPrize ? RARITY_CONFIG[heldPrize.template.rarity].color : null} heldImage={heldPrize?.template.imageUrl ?? null} />
          <div className="glass-shine" aria-hidden="true" /><div className="glass-edge-bottom" aria-hidden="true" />
        </div>

        <div className="machine-beam machine-beam-left" aria-hidden="true" /><div className="machine-beam machine-beam-right" aria-hidden="true" />
        <div className="machine-top-rail" aria-hidden="true">
          <div className="rail-bracket rail-bracket-left" />
          <div className="rail-bracket rail-bracket-right" />
          <div className="rail-track" />
        </div>

        <div className="machine-deck">
          <div className="deck-screw screw-tl" /><div className="deck-screw screw-tr" />
          <div className="deck-screw screw-bl" /><div className="deck-screw screw-br" />
          <div className="deck-shadow" />
          <button type="button" className="deck-arrow deck-arrow-left" aria-label="Move claw left" disabled={!isAiming} onPointerDown={(event) => pressDirection(event, "ArrowLeft")} onPointerUp={(event) => releaseDirection(event, "ArrowLeft")} onPointerCancel={(event) => releaseDirection(event, "ArrowLeft")} onLostPointerCapture={(event) => releaseDirection(event, "ArrowLeft")}>◀</button>
          <button type="button" className="deck-arrow deck-arrow-up" aria-label="Move claw up" disabled={!isAiming} onPointerDown={(event) => pressDirection(event, "ArrowUp")} onPointerUp={(event) => releaseDirection(event, "ArrowUp")} onPointerCancel={(event) => releaseDirection(event, "ArrowUp")} onLostPointerCapture={(event) => releaseDirection(event, "ArrowUp")}>▲</button>
          <button type="button" className="deck-arrow deck-arrow-down" aria-label="Move claw down" disabled={!isAiming} onPointerDown={(event) => pressDirection(event, "ArrowDown")} onPointerUp={(event) => releaseDirection(event, "ArrowDown")} onPointerCancel={(event) => releaseDirection(event, "ArrowDown")} onLostPointerCapture={(event) => releaseDirection(event, "ArrowDown")}>▼</button>
          <button type="button" className="deck-arrow deck-arrow-right" aria-label="Move claw right" disabled={!isAiming} onPointerDown={(event) => pressDirection(event, "ArrowRight")} onPointerUp={(event) => releaseDirection(event, "ArrowRight")} onPointerCancel={(event) => releaseDirection(event, "ArrowRight")} onLostPointerCapture={(event) => releaseDirection(event, "ArrowRight")}>▶</button>
          <CoinSlot onInsert={() => insertCoin(1)} />
          <Joystick onMove={moveClaw} disabled={!isAiming} />
          <div className="deck-jackpot" aria-live="polite">
            <div><span>LUCK METER</span><b>{jackpotProgress}%</b></div>
            <i><b style={{ width: `${jackpotProgress}%` }} /></i>
            <small>{streak > 0 ? `STREAK ×${streak}` : "WIN TO CHARGE"}</small>
          </div>
          <motion.button onClick={triggerGrab} disabled={!isAiming || coins < 1} whileTap={{ scale: 0.93, y: 4 }} className={`grab-button ${!isAiming || coins < 1 ? "is-disabled" : ""}`} aria-label="Press to grab"><span /><b>GRAB</b></motion.button>
          <div className="deck-control-label deck-control-label-left">AIM</div>
          <div className="deck-control-label deck-control-label-right">GRAB</div>
          <div className="deck-coin-count">{String(coins).padStart(2, "0")}</div>
          <div className="machine-feedback" aria-live="polite">
            {feedback && <motion.span key={feedback} initial={{ opacity: 0, y: 8, scale: .7 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} className={feedback === "success" ? "is-success" : "is-miss"}>{feedback === "success" ? "TOY SECURED" : "TRY AGAIN"}</motion.span>}
          </div>
        </div>
      </motion.div>

      <div className="machine-ground-shadow" aria-hidden="true" />
      <Confetti active={confettiActive} big={confettiBig} />
    </div>
  );
}
