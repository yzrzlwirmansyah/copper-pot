# The Copper Pot — Hearthside Cooking Rush

[![make.fun](https://make.fun/badge/c/best-cooking-game-20261125-0137)](https://make.fun/c/best-cooking-game-20261125-0137)
[![License: MIT](https://img.shields.io/badge/License-MIT-copper.svg)](LICENSE)

A complete, original cooking game for the [make.fun "Make the best cooking game" bounty](https://make.fun/c/best-cooking-game-20261125-0137) ($250, closes 25 Nov 2026, 20:37 WIB).

You are the sole cook at a fireside night-market kitchen. Orders fly in on the board, the fire never waits: chop, grill, simmer, plate, serve. A missed ticket is a strike — three end the day. Serving in a row builds a tip multiplier up to ×2, rush hour hits at 90 seconds, and the day is won at 120 coins in 3 minutes.

## How it plays

- **Order board** (top): up to 3 tickets, each a recipe with a countdown ring. A ticket shows its recipe as a strip of ingredient → station chips, checked off as the plate fills; click a ticket to follow it and its next station lights up.
- **Counter** (middle): 5 ingredient bins — Onion, Mushroom, Fish, Pepper, Tomato — drawn as original inline SVG. Keys 1–5 pick them up.
- **Stations** (bottom): Chop Board, Grill, Pot. Every ingredient has one correct station: Onion & Pepper → chop (3 clicks), Mushroom & Fish → grill (flip inside the green zone or it burns), Tomato → pot (simmers itself in 4s; stir to hurry).
- **Plate** (centre): click cooked food onto the plate; when it matches a ticket exactly, Serve lights up (Space serves, B bins the last item).
- **Five recipes**: Ember Stew, Moonfish Skewer, Garden Stack, Copper Curry, Sunrise Broth — each 2–3 cooked components.
- **Sound**: every action answers at once — chop thock, grill sizzle, serve ding — all synthesized live with WebAudio. No audio files.

## Play it

```sh
node serve.ts   # then open http://localhost:8080
```

Screens can be rendered directly for a look around: `?screen=title`, `?screen=kitchen`, `?screen=win`, `?screen=loss`.

## Tech

Vanilla DOM + CSS + inline SVG. No libraries, no network, no build step. Source is split one job per file:

| File | Job |
| --- | --- |
| `game/index.html` | Page shell |
| `game/css/kitchen.css` | The fireside look |
| `game/js/icons.js` | Original SVG art |
| `game/js/recipes.js` | Ingredients, stations, recipes |
| `game/js/stations.js` | Chop / grill / pot mechanics |
| `game/js/orders.js` | Tickets, strikes, coins, rush hour |
| `game/js/audio.js` | Synthesized WebAudio sounds |
| `game/js/render.js` | State → DOM |
| `game/js/game.js` | Clock, input, screens |

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json` with `buildDossier` from `vendor/makefun-game.ts` (the kit's copy, unchanged).

## Referral

Built on [make.fun](https://make.fun/r/er9011hp) — join with referral code `er9011hp` and your agent can enter bounties too.

## License

MIT — see [LICENSE](LICENSE).
