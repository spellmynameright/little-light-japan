// Full five-city campaign: a plausible player reaches the ending, at a sensible pace,
// without double rewards. Uses the same player model as tests/pacing.cjs.
const assert = require('node:assert/strict');
const E = require('../dist/engine.js');
const { simulate } = require('./pacing.cjs');

// A focused player with no time away.
const focused = simulate({ active: 600, away: 0 });
assert.equal(focused.complete, true, 'all five churches entrusted');
assert.equal(focused.cities.length, 5);
for (const c of focused.cities) {
  assert.ok(c.activeMin >= 20 && c.activeMin <= 90, c.city + ' takes ' + c.activeMin + ' minutes of focused play');
}
const total = focused.cities.reduce((n, c) => n + c.activeMin, 0);
assert.ok(total >= 150 && total <= 330, 'whole journey: ' + total + ' focused minutes');

// Someone who plays twenty minutes, then leaves for two hours.
const casual = simulate({ active: 20, away: 120 });
assert.equal(casual.complete, true);
assert.ok(casual.totalWallHours >= 6 && casual.totalWallHours <= 48, 'casual journey: ' + casual.totalWallHours + ' hours');
assert.equal(casual.learned, 68, 'every word learned along the way');
for (const v of Object.values(casual.stories)) assert.equal(v, 4, 'every neighbor story shared');

// Projects survive a reload mid-way, cannot be claimed early or twice.
let p = E.fresh();
p.started = true; p.jp = 20; p.xp = 1000;
E.buy(p, 1);
assert.ok(E.startProject(p));
assert.equal(E.startProject(p), false);
E.start(p, 1);
E.step(p, 20);
const restored = E.hydrate(JSON.parse(JSON.stringify(p)));
assert.deepEqual(E.projectProgress(restored), E.projectProgress(p));
assert.equal(E.claimProject(restored), false, 'incomplete work cannot be claimed');
restored.stations[0].auto = true;
E.step(restored, 600);
assert.ok(E.projectReady(restored));
const done = E.claimProject(restored);
assert.ok(done && done.xp >= 100);
const after = restored.xp;
assert.equal(E.claimProject(restored), false);
assert.equal(after, restored.xp);
const malformed = structuredClone(restored);
malformed.projectActive = { index: 1, baseline: [-1, Infinity] };
assert.equal(E.hydrate(malformed).projectActive, null);

// The ending cannot repeat its rewards, and the last neighborhood stays playable.
const end = E.fresh();
end.started = true; end.city = 4; end.plants = [0, 1, 2, 3].map(city => ({ city, elders: ['A', 'B'], support: 10 }));
end.projects = [0, 1, 2]; end.run = 1e16;
end.stations[4] = { level: 10, auto: true, running: true, progress: 0, cycles: 0 };
end.elders = end.elders.map((e, i) => i < 2 ? { ...e, met: true, training: 3, read: 3, appointed: true } : e);
assert.deepEqual(E.destinations(end), [-1]);
assert.ok(E.prestige(end, -1));
assert.equal(E.complete(end), true);
assert.equal(E.ready(end), false);
assert.equal(E.prestige(end, -1), false, 'no repeated ending rewards');
assert.ok(end.stations[4].level > 0, 'final neighborhood preserved');
assert.ok(E.complete(E.hydrate(JSON.parse(JSON.stringify(end)))));

console.log('PASS campaign: all five cities reached by a focused and a casual player; projects, reloads, and the ending verified.');
console.log(JSON.stringify({ focusedMinutesPerCity: focused.cities.map(c => c.city + ' ' + c.activeMin), casualHours: casual.totalWallHours }));
