# RANDOMIZER — Cyber Arcade

A visually stunning **single-page web application** that bundles four
classic randomizers into one neon-drenched cyberpunk + retro arcade
experience:

- **Playing Cards** — 52-card deck with shuffle + flip animation
- **Dice** — d6, d8, d16 with 3D roll animation
- **Coin Flip** — physics-style spinning coin
- **UNO** — full 108-card deck (numbers, action cards, wilds)
- **Surprise Me** — randomly picks one of the above and runs it

## Highlights

- 100% **vanilla HTML/CSS/JS** — no build step, no dependencies
- Cyberpunk + retro aesthetic: neon blue / purple / green / pink palette,
  Orbitron / Share Tech Mono fonts, CRT scanline overlay, animated
  matrix-rain background, glowing borders, glitch text effect
- Smooth CSS animations: card flip, deck shuffle, dice tumble, coin
  spin, neon button hover sweep
- Optional **sound effects** (Web Audio API, no external assets)
- **History log** of every randomized result
- **Reset** button clears state + history
- Mobile responsive

## Run

It's a static page. Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8080
# then visit http://localhost:8080
```

## Files

- `index.html` — markup, tab nav, sections
- `styles.css` — neon theme, scanlines, animations, responsive layout
- `app.js` — randomizer logic, history, sound, matrix background

## Tech

- HTML / CSS / JavaScript (vanilla)
- CSS keyframe animations + 3D transforms
- Web Audio API for procedural sound effects
- Canvas 2D for the matrix-rain backdrop
