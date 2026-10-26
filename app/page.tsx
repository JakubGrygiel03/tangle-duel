import { GameApp } from "@/components/game/GameApp";

// Gra żyje w przeglądarce (localStorage + canvas), więc HTML jest identyczny dla
// każdego — prerender raz przy buildzie i serwuj z CDN bez funkcji na Vercelu.
export const dynamic = "force-static";
export const revalidate = false;

export default function HomePage() {
  return <GameApp />;
}
