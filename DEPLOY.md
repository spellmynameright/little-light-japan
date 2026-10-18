# GitHub Pages setup

1. Create a public repository named `little-light-japan` in the `spellmynameright` account. Public source is supported by GitHub Free. Do not add a license unless you intend to license the original code and artwork.
2. Push this repository to its `main` branch. Include `.github/workflows/pages.yml`, `package.json`, `package-lock.json`, `dist/`, tests, and the handoff documentation.
3. In the GitHub repository, open **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. Open **Actions → Test and deploy game → Run workflow** on `main` if the first run happened before Pages was enabled.
5. Confirm the deployment job succeeds. The expected address is https://spellmynameright.github.io/little-light-japan/ (not live until deployment succeeds).

Every pull request targeting `main` runs all tests. Every push to `main` runs tests and publishes only `dist/` when they pass. No custom deployment secret or paid service is required. The workflow does not enforce branch protection; configure required reviews/checks separately if desired.

## Move your saved progress

Before moving, open the current game at https://little-light-japan.trimmja.chatgpt.site and use Settings → Export save. Open the deployed GitHub Pages game and import that JSON backup in Settings. Browser saves are local to each website origin and do not transfer automatically. Keep the original site available until the new deployment and save import are verified.

## Development

Run `npm ci` followed by `npm test`. To play locally, serve `dist/` with a static HTTP server (for example, `python3 -m http.server 5173 --directory dist`). The game requires no production build or server. Original source and art provenance are in ASSETS.md; Three.js retains its MIT license in dist/vendor/THREE-LICENSE.txt.

Automated engine/campaign/DOM checks are available. Actual browser/WebGL and phone playtesting are still required. Check the project URL path, artwork, 3D rendering, idle timers, save export/import, and background/resume behavior on the final deployment.
