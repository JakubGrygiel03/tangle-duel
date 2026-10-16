# Tangle Duel

Minimalistyczna łamigłówka dotykowa. Rozplątujesz świetliste struny, przeciągając kryształowe węzły, aż żaden odcinek się nie przecina. Każde czyste ułożenie podnosi poziom i dokłada węzły.

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

## Sterowanie

- Przeciągnij kryształ palcem. Cel ma co najmniej 44 px, niezależnie od wielkości punktu.
- Bursztynowa struna i iskra oznaczają przecięcie.
- Biała, lodowa struna jest wolna.
- Gdy przecięć nie zostanie, plansza rozbłyska i po 1,5 s wchodzi kolejny poziom.
