# Tangle Duel

Minimalistyczna łamigłówka dotykowa. Rozplątujesz świetliste struny, przeciągając kryształowe węzły, aż żaden odcinek się nie przecina. Czyste ułożenie odlicza 3–2–1 i po zaliczeniu wciąga kolejny układ.

## Kampania i nieskończoność

Poziomy **1–60** to kampania w sześciu rozdziałach — trudność rośnie od prostych konstelacji do gęstych sieci przy limicie węzłów. Po zaliczeniu poziomu 60 odblokowuje się tryb **Nieskończone** (poziomy 61+), generowany proceduralnie bez końca.

## Sklep i kryształy

Za zaliczenie poziomu dostajesz **kryształy** (3–8). W sklepie możesz:

- obejrzeć (na razie symulowaną) reklamę za dodatkową paczkę kryształów,
- wcześniej odblokować motyw za kryształy,
- zobaczyć placeholdery IAP: usuń reklamy, paczki, wsparcie twórcy.

Prawdziwe AdMob / płatności wejdą później — ekonomia i UI są już pod to przygotowane.

## Motywy

Tła, kolory strun i kryształów odblokowujesz postępem albo w sklepie. Wybór: menu → Sklep.

## Pojedynek

Dwóch graczy na dwóch telefonach: host tworzy kod, gość dołącza. Obaj dostają ten sam układ — kto pierwszy utrzyma czyste struny przez 3 s, wygrywa. Połączenie przez PeerJS (bez własnego serwera gry). Wejście: Ustawienia → Pojedynek.

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
2. Framework Preset: Next.js. Build command: `npm run build`.
3. Deploy.

## Sterowanie

- Przeciągnij kryształ palcem. Cel ma co najmniej 44 px.
- Bursztynowa (lub motywowa) struna i iskra oznaczają przecięcie.
- Jasna struna jest wolna.
- Na tablecie tło wypełnia cały ekran; plansza siedzi w szerszej kolumnie portretowej.
- W menu: lewo wycisza dźwięk, prawo otwiera ustawienia.
