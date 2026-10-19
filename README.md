# A Little Light — a life in Japan

A gentle idle life game. You arrive in a small Tokyo neighborhood with a suitcase and a handful of words. Your character studies, runs errands, shares tea, cooks for neighbors and opens a house where people belong. Learn the language, make friends, mentor local leaders — and entrust a church to them before beginning again in the next city. Five cities make the journey; there is an ending, and the neighborhood stays yours afterwards.

Play: https://spellmynameright.github.io/little-light-japan/ (after deployment — see DEPLOY.md). Works on iPhone; use Share → Add to Home Screen for a full-screen app.

## How it plays
- **One character, eight places.** Choose a place; your character walks there and repeats its work on their own. Tap **Help** (or the character) to speed up the task in front of them — never free currency. Each finished task earns experience (XP) plus Japanese, culture or connection.
- **Improve and automate.** Spend XP to improve places (new furniture and decorations appear at levels 10, 25, 50 and 100; production doubles at 25, 50, 100…). A **routine** keeps a place going while you are elsewhere and for up to 8 hours away. Each place has one piece of equipment.
- **Learn Japanese.** Ten short lessons (68 words), fifteen everyday situations (including four city dialects), and a study notebook that fills with hiragana, katakana and first kanji as your character studies. Japanese opens new places, translates signs and labels, and makes story dialogue readable word by word.
- **People.** Five Tokyo neighbors have four stories each. Your choices are remembered: later stories recall them, and each choice grows something different. Ordinary visits have small everyday moments. In every city you meet three local people; mentor them (it takes real time), read the conversations that follow, and appoint two as elders.
- **The journey.** Each city has three community projects that change the neighborhood. To entrust the church: three projects, the shared table at level 10 with a routine, two elders, and enough growth. Each entrusted church keeps supporting you, doubles production, and gives a permanent gift. After Fukuoka comes the ending.

Pacing (checked by `tests/campaign.test.cjs`): about 30–50 minutes of focused play per city, around 3½ hours for the whole journey; someone who plays 20 minutes every couple of hours finishes in about 14 hours of real time.

## The town
A real-time 3D neighborhood built from code (Three.js, no model files): two streets with alleys, utility poles and wires, a vending machine, a rubbish station, cherry trees, a train line and station. Every building has a cut-away interior; when you look into a place its roof and front fade away. Signs are painted in Japanese and become readable as you learn. The light follows your clock — lamps, windows and shop fronts glow in the evening (Settings can keep it daytime). Neighbors walk between places, passers-by increase as your circle grows, a cat moves around, and each city has its own season, landmarks and weather: Tokyo petals, Kanazawa's canal and maples, Sendai's zelkovas and Tanabata streamers, Sapporo snow, Fukuoka's harbor food stalls.

## Files
- `dist/index.html` — page structure (HUD, town, place card, panels, tabs).
- `dist/style.css` — all styling; phone first, desktop from 900px.
- `dist/journey.js` — the five cities: projects, local leaders and their scenes, situations, finale.
- `dist/content.js` — words, lessons, kana notebook, Tokyo neighbors, stories (choices, gains, echoes), everyday moments.
- `dist/engine.js` — the rules: economy, time stepping, learning, people, elders, projects, entrusting, saves. Pure; runs in Node.
- `dist/app.js` — the interface: save/clock, HUD, place card, popups (stories, lessons, elders, entrusting, finale), settings.
- `dist/panels.js` — the Learn, People and Journey tabs.
- `dist/audio.js` — procedural sounds (Web Audio).
- `dist/world.js` — the 3D town: camera, lighting/time of day, people, train, weather, labels, touch controls.
- `dist/world/kit.js` — merges simple shapes into vertex-coloured meshes; sign textures.
- `dist/world/town.js` — street layout, the eight buildings (with level-based details), city scenery, project landmarks.
- `dist/world/people.js` — characters, poses and animation, the cat, the train.
- `dist/sw.js`, `dist/manifest.webmanifest`, `dist/icons/` — Add to Home Screen and offline play.
- `dist/assets/` — portrait atlas and fallback town painting (WebP). Originals in `art-source/`.
- `tests/` — engine, campaign and interface tests; `tests/pacing.cjs` prints pacing for a simulated player.

## Run and test
Serve `dist/` over HTTP (ES modules don't load from `file://`):

    python3 -m http.server 5173 --directory dist

Tests need Node (and jsdom for the interface test):

    npm ci
    npm test
    node tests/pacing.cjs 20 120   # pacing for 20-minute sessions with 2-hour breaks

## Saves
Browser localStorage, key `little-light-japan-v2` (save version 2, revision 6), saved every few seconds. Older saves (revisions 1–5, and the original version-1 prototype save) load and upgrade automatically. Settings can export and import a backup file to move between devices.
