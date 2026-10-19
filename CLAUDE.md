# A Little Light: Claude handoff

You are continuing a finished idle game for Jacob Trimm. Read README.md, then the code. Preserve the current game rather than rebuilding it. Jacob is a beginner: explain changes in plain language, and ask before pushing to GitHub unless he says to publish/push.

## Product intent
A traditional incremental / idle life game about a missionary in Japan. References: Idle Success, Idle Life Sim, Egg Inc, Adventure Capitalist, Clicker Heroes. He wants a character, an engaging visible world, purposeful actions and meaningful growth; he dislikes generic cards, arbitrary "small step" clicks and timers that look broken.

Japanese combines idle study with playable lessons; as the player learns, labels, signs and dialogue become readable. Culture, friendship, hospitality, Christian faith and local leadership matter. Tone: George MacDonald / C. S. Lewis — wonder, humility, hope, service, mutuality; never a contemporary evangelical sales pitch. People are not conversion targets or a currency. Prestige means developing and appointing local elders, entrusting a church, and beginning again in a new city. Sister project for inspiration: `spellmynameright/japan-evangelistic-band` (JEB) — the readable-signs and word-by-word dialogue ideas came from its walking prototype.

## Structure (v1.0, "the overhaul")
Buildless HTML/CSS/JS; vendored Three.js 0.180.0; no backend. Classic scripts share globals in this order: `journey.js` (window.Journey) → `content.js` (window.Content) → `engine.js` (window.Idle) → `audio.js` (window.Sound) → `app.js` (window.App, window.GameBridge) → `panels.js` (fills App.panels). `world.js` is an ES module importing `world/kit.js`, `world/town.js`, `world/people.js`; it reads state through `window.GameBridge` every frame and exposes `window.WorldView`. It never mutates game state.

- Economy knobs live in `engine.js`: `ACTIVITIES` (cost ladder ~12×, payout ~7×, cycle seconds 3→80), `TUNE` (price growth 1.15, milestone levels, ×2 per milestone), `BOOSTS`, `GOALS` (reward = seconds of production), `TRAINING_TIME` (mentoring 5/8/12 minutes), city `goal` in `journey.js`. Learning (Japanese/culture/connection) is paced per second by `levelFactor` and does not speed up with cycle speed.
- After any balance change run `node tests/pacing.cjs 600 0` and `node tests/campaign.test.cjs`. Current targets: ~30–50 focused minutes per city, ~3½ hours total.
- Content is data: add words only by appending to `WORDS` (saves store indices); situations likewise append only; stories have `gains` per choice and optional `echo` lines that recall an earlier choice.
- Buildings: each place builder in `world/town.js` fills `core` (always visible), `shell` (fades in close view), `glow` and `sglow` (night-lit parts; `sglow` fades with the shell). Level details appear at 10/25/50/100. Signs are canvas textures (`signMesh`) — text is always drawn by the game, never baked into art.

## Contracts to preserve
- localStorage key `little-light-japan-v2`; save `version` 2, `revision` 6. Older revisions must keep loading: give new fields defaults in `fresh()` and validate them in `hydrate()`.
- One wall-clock cursor advances the game; saving advances it first. Offline credit is capped at 8 hours. No double credit on visibility changes or reload.
- The focused activity repeats without automation; routines keep other places going.
- Help/tap advances the focused task by 0.65 s; rewards come at completion, never as unrelated currency.
- Projects, lessons (first completion), situations, stories and the ending cannot pay twice.
- Story progress commits only when a response is chosen; closing a popup must not consume it. Elder conversations commit when opened.
- Keep the generated portraits (`dist/assets/neighbors.webp`, originals in `art-source/`) and the Three.js license. Never include account tokens or credential files.

## Testing
`npm ci && npm test` runs the engine, campaign and jsdom interface tests (CI runs them on every PR and before each deploy). For visuals, use Playwright with the pre-installed Chromium (`--use-gl=angle --use-angle=swiftshader`) at iPhone 13 size; serve `dist/` with `python3 -m http.server`. The town follows the device clock — set `GameBridge.state().clock = 'day'` for daytime screenshots. Real iPhone testing by Jacob is the final word.

## Publication
GitHub Pages via GitHub Actions: pushes to `main` that pass tests deploy `dist/` to https://spellmynameright.github.io/little-light-japan/. The original ChatGPT Site (`.openai/hosting.json`) is a separate backup deployment that GitHub pushes don't update. Bump the `?v=` query strings in `index.html` and `VERSION` in `dist/sw.js` when shipping changes, so phones pick them up.
