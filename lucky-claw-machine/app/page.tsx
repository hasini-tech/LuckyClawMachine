import ClawMachine from "@/components/ClawMachine";
import HUD from "@/components/HUD";
import RewardPopup from "@/components/RewardPopup";
import SoundManager from "@/components/SoundManager";

export default function Home() {
  return (
    <main className="arcade-page">
      <SoundManager />
      <HUD />
      <ClawMachine />
      <RewardPopup />
    </main>
  );
}
