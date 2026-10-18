# A Little Light — Japan Idle

A traditional incremental life and church-planting game. The player arrives in a fictional Tokyo neighborhood, learns Japanese, builds parallel activities, develops local leadership, and entrusts established churches before starting again in another Japanese city.

## Core loop
Choose a place → your animated character walks there and continuously repeats its activity → help with its actual task → improve facilities → establish routines that keep going when you focus elsewhere. Tapping advances the selected activity by 0.65 seconds; it does not create unrelated currency or generic tap bonuses. Completed cycles grant XP and the relevant language, culture, or connection resource.

Eight furnished 3D spaces unlock as you progress. Improvements at levels 10, 25, and 50 change the environment. Automated activities have visible helpers. The camera switches between a close view and the whole neighborhood. Bulk purchasing supports ×1, ×10, and MAX; milestone levels multiply production and levels 25 and 100 increase speed.

Japanese insight unlocks translations, 28 practice words/phrases, and activities. Culture and connection provide additional unlocks and global multipliers. Five neighbors have 20 optional original story scenes.

## Five-city campaign
Each city has three original community projects. Begin a project, complete its listed activity cycles, and claim its outcome. Automated routines contribute while elsewhere and offline. Each completed project grants +15% local production and a concrete resource/XP reward. Projects have distinct narratives and task mixes in Tokyo, Kanazawa, Sendai, Sapporo, and Fukuoka.

Entrusting a city unlocks its permanent gift: Japanese learning, cultural understanding, connection growth, production, or all personal growth. Three completed projects are required for each church handover. Entrust all five cities to see the ending; the final neighborhood remains playable. Earlier saves preserve progress and gain the new project system.

Ten practical Japanese situations supplement the 28 vocabulary lessons. Each situation has a one-time reward and no wrong-answer penalty. Completing a neighbor’s four stories unlocks a relevant partnership bonus. The Journey view records project outcomes, relationship scenes, city gifts, and letters.

## Church plants and prestige
Develop the open table to level 10 and automate it. Complete three 45-second mentoring stages for at least two local leaders, then appoint them as elders. After earning 1M XP in the plant, entrust the church and choose Tokyo, Kanazawa, Sendai, Sapporo, or Fukuoka (excluding the current city). Neighborhoods, characters, and bonuses are fictional gameplay settings.

New cities reset activities, automation, XP balance, local elder development, shop upgrades, community projects, and milestone quests. Japanese, culture, connection, learned words, stories, and prior church plants persist. Experience roots grant +50% permanent earnings each. Established churches contribute ongoing support at 2% of their automated base rate, multiplied by current global bonuses.

## Files
- `dist/journey.js`: five city arcs, fifteen community projects, permanent gifts, and ten practical Japanese situations
- `dist/engine.js`: deterministic event-based economic simulation, progression, city transitions, validated saves, and version-one migration
- `dist/app.js`: character-focused interface, purpose-driven tasks, elapsed-time cursor, goals, training, lessons, visits, backup import/export
- `dist/world.js`: interactive Three.js neighborhood, furnished rooms, character animation, helpers, visible upgrades, camera, and illustrated fallback
- `dist/vendor/`: pinned Three.js 0.180.0 with its MIT license
- `dist/content.js`: original stories and Japanese vocabulary
- `dist/style.css`: mobile and desktop layouts with progress bars and click feedback
- `dist/assets/neighborhood.png`: original generated neighborhood artwork
- `dist/assets/neighbors-v5.png`: original six-portrait atlas; prompt and provenance in `ASSETS.md`
- `tests/engine.test.cjs`: economic and save regression checks
- `tests/campaign.test.cjs`: full five-city progression simulation, project claims, bonuses, migration, and ending
- `tests/ui.test.cjs`: DOM integration flows (requires jsdom)

## Playing on a phone
The town now includes direct Help, Improve, goal-claim, and neighbor-visit controls. The bottom navigation stays available on narrow screens. Expand the town with the square icon; camera arrows and zoom buttons adjust the view. Click a visible neighbor or their portrait to talk. Interrupted story scenes remain unread until a response is chosen.

Settings support player name, jacket color, battery saver, reduced motion, save export/import, and reset. Sound and display preferences survive reload. Narrow 3D views use lower rendering resolution and disable expensive shadows automatically. A lost WebGL context switches to the illustrated fallback while the economy continues.

## Persistence
Browser localStorage with automatic save every four seconds. Offline production is capped at eight hours and does not require a running server. Backup exports support moving between devices. Original version-one saves migrate language, culture, relationships, stories, and a bounded starting XP allowance. They also receive an automated study activity. New versions use a separate localStorage key and do not delete the original save.

## Verification
Syntax checks and engine tests cover continuous focused and automated cycles, parallel production, live/offline equivalence, bulk/MAX costs, milestones, task assistance, training, appointments, city transition prerequisites, retained progress, church support, validated save roundtrips, and original save migration. The DOM integration test exercises initial boot, timers, long elapsed time without duplicate credit, unlocks, switching activities, automation, tabs, lessons, dialogue, saving, and reload. Run with `JSDOM_PATH=<installed jsdom path> node tests/ui.test.cjs`. A fresh-save campaign simulation reaches all five handovers in about 49 simulated minutes with efficient purchases, idle cycles, no tap bonuses, and no lesson bonuses. This is a reachability/pacing check, not observed human playtime. Static scene inspection checks 3D assets and city transitions; browser/WebGL visual QA was unavailable in this environment.

## Asset provenance
Original built-in image-generation artwork: hand-painted Japanese residential neighborhood in spring, gently elevated storybook view; warm ivory sunlight, sage trees, cherry blossoms, blue-grey roofs, narrow lane, café, apartment, garden, modest community room, bookshop, bicycles, and a cream cat. Blank signboards; no labels or watermark. Stored at `dist/assets/neighborhood.png`. The image is retained as a fallback for devices without WebGL. The primary 3D environment and animated characters are original procedural geometry, with spring Tokyo, an autumn canal in Kanazawa, summer greenery in Sendai, winter snow in Sapporo, and a harbor in Fukuoka; no paid Tripo generation has been used. Character portraits are original built-in image-generation artwork documented in `ASSETS.md`.

## GitHub Pages
See [DEPLOY.md](DEPLOY.md) for deployment and save migration. Run `npm ci && npm test` for all regression checks. Pull requests run checks; successful pushes to `main` publish `dist/` through GitHub Actions.
