# 🎪 Lucky Claw Machine

A modern, arcade-style claw machine game built with **Next.js 15**, **React 18**,
**TypeScript**, **Tailwind CSS**, **Framer Motion**, and **Zustand**.

Insert coins, steer the claw with a joystick (or arrow keys / WASD on
desktop), and try to grab cute plushies, gems, robots, and mystery prizes —
each with its own rarity and payout. Win streaks build toward a jackpot,
confetti flies on every win, and a fully procedural sound engine provides
music and SFX with zero external audio files.

## ✨ Features

- **3D-looking neon cabinet** — chrome bezel, glowing marquee, animated glass
  reflections, scanlines, and ambient light blooms.
- **Smooth claw control** — draggable on-screen joystick for touch, and
  arrow-key / WASD support for desktop, both driving the same physics-style
  movement loop at 60 FPS via `requestAnimationFrame`.
- **Realistic-feeling claw sequence** — open → drop → close (with jitter) →
  lift → travel to chute → release, all as a small state machine
  (`ClawPhase`) with camera zoom and cabinet shake for excitement.
- **Fair-but-exciting grab odds** — success chance blends the prize's rarity
  weight, how precisely the claw is centered on it, and a small "pity" boost
  after a losing streak (`lib/physics.ts`).
- **Rarity system** — Common / Rare / Epic / Legendary, each with its own
  color, glow, spawn frequency, and grab difficulty (`lib/prizes.ts`).
- **Coins, score, streak & jackpot HUD** — persistent top bar with an
  inventory drawer of everything you've won.
- **Reward popup + confetti** — item name, rarity badge, and points earned,
  with a bigger confetti burst and bonus points on jackpot wins.
- **Procedural audio** — background arcade loop, coin insert, button press,
  claw open/close/drop/rise, win/jackpot/lose stingers — all synthesized at
  runtime with the Web Audio API (`lib/sounds.ts`), so there are no binary
  audio assets to ship or license.
- **Fully responsive** — touch joystick and large tap targets on mobile,
  keyboard controls on desktop, fluid layout at every breakpoint.

## 🗂 Project structure

```
app/
  layout.tsx        Root layout, fonts, metadata
  page.tsx           Composes HUD + ClawMachine + RewardPopup + SoundManager
  globals.css         Cabinet textures, scanlines, reduced-motion handling
components/
  ClawMachine.tsx     Orchestrator: cabinet visuals, grab state machine, controls
  Claw.tsx            The crane head, cable, and animated jaws
  Prize.tsx           A single collectible toy with idle float + rarity badge
  Joystick.tsx        Draggable touch/mouse joystick
  HUD.tsx             Coins / score / streak / jackpot / inventory drawer
  RewardPopup.tsx      Post-win modal with item, rarity, and points
  Confetti.tsx         Lightweight particle burst
  CoinSlot.tsx         Coin insert button + drop animation
  SoundManager.tsx      Unlocks audio + drives background music lifecycle
lib/
  prizes.ts            Prize catalog + rarity config + weighted random picks
  physics.ts            Distance/probability helpers + 2D tween animator
  sounds.ts              Web Audio synth engine (music + SFX)
store/
  useGameStore.ts        Zustand store: coins, score, streak, jackpot, claw & prize state
```

## 🚀 Getting started

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

### Build for production

```bash
npm run build
npm run start
```

## 🎮 Controls

| Action        | Desktop                | Mobile          |
|---------------|-------------------------|-----------------|
| Move claw     | Arrow keys / WASD        | Drag the joystick |
| Grab          | Space / Enter / Grab button | Tap the GRAB button |
| Insert coin   | Click the coin slot      | Tap the coin slot |

## 🔧 Notes & customization

- Fonts (`Baloo 2`, `Nunito`) are loaded via a standard `<link>` tag in
  `app/layout.tsx` rather than `next/font/google`, so the project builds
  cleanly in network-restricted environments. Swap in `next/font/google` if
  you want build-time font optimization and have network access.
- All sounds are generated procedurally — no `/public` audio files needed.
  Swap `lib/sounds.ts` for real audio files/Howler.js if you'd like richer
  sound design.
- Prize art uses emoji for crisp, dependency-free visuals at any resolution.
  Swap `emoji` in `lib/prizes.ts` for image/sprite paths if you'd like custom
  illustrated toys.
- Grab odds, prize catalog, spawn counts, and jackpot pacing are all
  centralized in `lib/prizes.ts` / `lib/physics.ts` / `store/useGameStore.ts`
  for easy tuning.
