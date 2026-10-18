# A Little Light: Claude handoff

You are continuing an existing idle game for Jacob Trimm. Read README.md and inspect the implementation before editing. Preserve the current game rather than recreating it from the screenshots or the live URL.

## Product intent
A traditional incremental / idle life game about a missionary in Japan. References supplied by the user: Idle Success, Idle Life Sim, Egg Inc, Adventure Capitalist, and Clicker Heroes. The user wants a character, an engaging visible world, purposeful actions, and meaningful growth. He dislikes generic cards, arbitrary “small step” clicks, and timers that appear broken.

Japanese combines idle study with playable lessons. As the player learns, Japanese labels and dialogue acquire translations. Culture, friendships, hospitality, Christian faith, and local leadership matter. Tone: George MacDonald / C. S. Lewis, wonder, humility, hope, service, mutuality; avoid a contemporary evangelical sales pitch. People are not conversion targets or a currency. Prestige means developing and appointing local elders, entrusting a church, and beginning in a new city.

## Current implementation
Buildless HTML/CSS/JavaScript with vendored Three.js 0.180.0; no framework or runtime package installation needed to serve dist/. No backend. Browser localStorage stores the game; exports/imports move progress between browsers. Eight activities, upgrade milestones, automation, five cities, fifteen community projects, ten practical Japanese scenarios, twenty relationship stories, twenty-eight vocabulary entries, permanent city gifts, and a final campaign ending. The final neighborhood remains playable.

Main source:
- dist/engine.js: event-based economy, saves/migration, projects, gifts, elders, ending.
- dist/app.js: DOM UI, controls, conversations, lessons, timekeeping, settings.
- dist/world.js: interactive procedural 3D town, characters, seasons, camera, fallback.
- dist/journey.js: campaign stories and practical Japanese scenarios.
- dist/content.js: relationship stories and vocabulary.
- dist/style.css and dist/index.html: presentation and layout.
- dist/assets/: generated art. ASSETS.md documents portrait provenance.
- tests/: engine regression, full-campaign simulation, DOM integration.

## Run locally
Serve dist/ over HTTP, not file:// (world.js is an ES module). For example, if Python is installed:

    python3 -m http.server 5173 --directory dist

Open http://localhost:5173 in a real browser. Choose another available local server if needed.

Engine checks require Node.js:

    node tests/engine.test.cjs
    node tests/campaign.test.cjs

DOM checks also need jsdom 26.1.0:

    npm ci
    node tests/ui.test.cjs

Alternatively set JSDOM_PATH to an existing jsdom installation. Do not commit node_modules.

## What has actually been verified
All three test suites passed at export. The campaign simulation completes in about 49 simulated minutes using efficient purchases and ordinary idle production, without tapping or lesson bonuses. That is a reachability check, not measured human playtime. Tests cover continuous and offline time, duplicate-credit protection, project claims, progression, interrupted dialogue, quick actions, expanded view, settings persistence, saves, and ending. Scene construction and city transitions were exercised without WebGL.

Crucial limitation: real browser/WebGL and actual phone playtesting have NOT been performed. Do not claim those passed. This is the highest-value next work. The previous environment lacked its required browser-testing integration; that environment limitation does not constrain your own available tools.

## Recommended next task
1. Run and visually inspect the game in a real browser at phone and desktop sizes.
2. Play from a fresh save through the first fifteen minutes. Use a separate test browser/save; preserve the user's current save.
3. Find overlap, unreadable text, camera/interaction issues, frame-rate problems, confusing goals, weak upgrade feedback, and boring waits.
4. Fix observed problems. Then improve activity animations and the consequences of relationship choices as justified by playtesting.
5. Re-run relevant tests and report concrete changes plus remaining limitations.

## Preserve these contracts
- localStorage key: little-light-japan-v2. The save's version is 2 and revision is 5. Preserve old-save compatibility; new fields need defaults in hydrate().
- Advance gameplay from one wall-clock cursor. Saving advances that cursor first. Offline credit is capped at eight hours. Avoid double credit on visibility changes/reload.
- The focused activity repeats without purchasing automation. Automation keeps other activities running while the character is elsewhere.
- Tapping advances the focused task by 0.65 seconds; rewards occur at completion, not as unrelated free currency.
- Completed projects and language scenarios cannot award twice.
- Conversation progress is committed only after the player chooses a response. Closing a dialogue must not discard it.
- Keep generated portraits and vendored Three.js license. Never include account tokens or local credential files.

## Publication and round trip
Live Site: https://little-light-japan.trimmja.chatgpt.site
The .openai/hosting.json file identifies the existing Site. This ZIP contains source, not a deployment credential. Local edits do not automatically change the hosted game. Preserve the Site identity for the existing backup deployment. The user has authorized migrating primary hosting to GitHub Pages; use the GitHub Pages workflow below for publication after repository setup.

Export base commit: b83b3b728d390d41db43fb8e8390aedb9b1e1606


## GitHub Pages workflow
This checkout is prepared for GitHub Pages. Install development dependencies with `npm ci`; run all checks with `npm test`. GitHub Actions tests pull requests and deploys `dist/` after a successful push to `main`. Enable Settings → Pages → Source: GitHub Actions once. Keep all asset URLs relative for the `/little-light-japan/` project path. The original ChatGPT Site is a separate deployment; GitHub pushes do not update it. Do not use or request ChatGPT Site credentials for Pages.
