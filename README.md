# Tangle Duel

Minimalistyczna łamigłówka dotykowa. Rozplątujesz świetliste struny, przeciągając kryształowe węzły, aż żaden odcinek się nie przecina. Czyste ułożenie rozbłyska i po 1,5 s wciąga kolejny układ.

Poziomy 1–3 to prosta konstelacja (5–6 węzłów). Poziomy 4–7 zagęszczają sieć (7–9). Poziomy 8–12 składają złożone figury (10–12). Od poziomu 13 plansza ma 13–15 węzłów i więcej przecięć na starcie. Górny pasek pokazuje numer poziomu, bieżące przecięcia i dolne ograniczenie liczby ruchów.

Gra jest pionowa (wysokość `100dvh`), rysowana na HTML5 Canvas i nie używa silnika gier ani próbek audio. Dźwięk harfy powstaje w Web Audio API po pierwszym dotknięciu.

## Uruchomienie

```bash
npm install
npm run dev
```

Serwer nasłuchuje na `0.0.0.0:43123`. Z telefonu w tej samej sieci otwórz `http://<adres-komputera>:43123`.

```bash
npm run build
npm start
```

## Vercel

Projekt jest zwykłą aplikacją Next.js i nie wymaga zmiennych środowiskowych.

1. W [Vercel](https://vercel.com/new) wybierz import repozytorium `tangle-duel`.
2. Framework Preset: Next.js. Build command: `npm run build`. Output zostaje domyślny.
3. Deploy. Podgląd pojawi się pod adresem nadanym przez Vercel.

## Sterowanie

- Przeciągnij kryształ palcem. Cel ma co najmniej 44 px, niezależnie od wielkości punktu.
- Bursztynowa struna i iskra oznaczają przecięcie.
- Biała, lodowa struna jest wolna.
- Gdy przecięć nie zostanie, plansza rozbłyska i po 1,5 s węzły następnego poziomu wpływają na swoje miejsca.
