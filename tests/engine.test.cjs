// Engine regression checks: time, production, buying, helping, learning, people, elders, saves.
const assert = require('node:assert/strict');
const E = require('../dist/engine.js');
const C = require('../dist/content.js');

function started() { const s = E.fresh(); s.started = true; E.start(s, 0); return s; }
const close = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps * Math.max(1, Math.abs(a), Math.abs(b));

// The focused activity repeats on its own, without buying automation.
let s = started();
E.step(s, 30);
assert.equal(s.stations[0].cycles, 10);
assert.equal(s.xp, 15 + 10 * E.payout(s, 0));
assert.equal(s.stations[0].running, true);
assert.equal(s.studied, 10, 'study cycles fill the notebook');

// Automation keeps other places going while the character is elsewhere.
s.xp = 1e6;
assert.ok(E.automate(s, 0));
assert.equal(E.automate(s, 0), false, 'automation cannot be bought twice');
s.stations[1].level = 1;
E.start(s, 1);
const c0 = s.stations[0].cycles;
E.step(s, 30);
assert.equal(s.stations[0].cycles, c0 + 10);
assert.equal(s.stations[1].cycles, 6);
assert.ok(s.jp > 0 && s.culture > 0);

// A non-automated place finishes its current cycle and then stops when you leave.
let left = started();
left.stations[1].level = 1;
E.step(left, 1);
E.start(left, 1);
E.step(left, 10);
assert.equal(left.stations[0].progress, 1, 'study waits where you left it');
assert.equal(left.stations[0].cycles, 0);

// Live play and offline catch-up give the same results, whatever the step size.
let a = started();
a.jp = 300; a.culture = 80; a.bonds = 80; a.xp = 1e9;
for (let i = 0; i < 5; i++) a.stations[i] = { level: 20 + i * 7, auto: true, running: true, progress: 0.17, cycles: 0 };
a.elders[0] = { met: true, training: 0, progress: 0, running: true, appointed: false, read: 0 };
const b = structuredClone(a), c = structuredClone(a);
E.step(a, 400);
for (let i = 0; i < 4000; i++) E.step(b, 0.1);
for (let i = 0; i < 400; i++) E.step(c, 1);
for (const key of ['xp', 'jp', 'culture', 'bonds', 'time', 'studied']) {
  assert.ok(close(a[key], b[key], 1e-6), key + ' live/offline');
  assert.ok(close(a[key], c[key], 1e-6), key + ' step invariant');
}
assert.deepEqual(a.elders[0], b.elders[0], 'mentoring advances identically');
assert.equal(a.elders[0].training, 1, 'first mentoring stage finished');

// Offline time is capped at eight hours.
let cap = started();
E.step(cap, 99999);
assert.equal(cap.time, E.OFFLINE_CAP);

// Buying: ×1, ×10 and Max, with the price formula and level milestones.
let buy = started();
buy.xp = 1e6;
const cost = E.price(buy, 0, 10);
assert.equal(E.buy(buy, 0, '10'), 10);
assert.equal(buy.xp, 1e6 - cost);
assert.equal(buy.stations[0].level, 11);
assert.equal(E.marks(24), 0);
assert.equal(E.marks(25), 1);
assert.equal(E.nextMark(25), 50);
buy.stations[0].level = 25;
assert.equal(E.duration(buy, 0), 1.5);
buy.stations[0].level = 100;
assert.equal(E.duration(buy, 0), 0.75);
let max = started();
max.xp = 123456;
const n = E.quantity(max, 0, 'max');
assert.ok(E.price(max, 0, n) <= max.xp && E.price(max, 0, n + 1) > max.xp);
assert.equal(E.buy(max, 0, 'max'), n);
assert.equal(E.buy(max, 7, '1'), 0, 'locked places cannot be bought');

// Helping advances the real task; it never creates free currency.
let help = started();
const xp0 = help.xp;
E.assist(help);
assert.equal(help.xp, xp0);
assert.equal(help.stations[0].progress, E.HELP_SECONDS);
for (let i = 0; i < 4; i++) E.assist(help);
assert.equal(help.stations[0].cycles, 1);
assert.equal(help.xp, xp0 + E.payout(help, 0));

// Learning gains are paced by milestones, not raw cycle speed.
let pace = started();
pace.stations[0].level = 24;
const slow = E.sideGain(pace, 0) / E.duration(pace, 0);
pace.stations[0].level = 25;
const fast = E.sideGain(pace, 0) / E.duration(pace, 0);
assert.ok(close(fast / slow, 1.5), 'per-second learning rises 1.5× at the first milestone');

// Goals pay a share of production and advance one at a time.
let goal = started();
assert.equal(E.claimGoal(goal), 0, 'unfinished goals pay nothing');
E.step(goal, 3);
assert.ok(E.claimGoal(goal) >= 50);
assert.equal(goal.quest, 1);

// Lessons: first completion pays once; better stars add a little; words are remembered.
let lesson = started();
assert.equal(E.lessonOpen(lesson, 1), false, 'lesson two needs 20 insight');
const r1 = E.finishLesson(lesson, 0, 2);
assert.equal(r1.stars, 2);
assert.equal(r1.newWords.length, 8);
assert.ok(r1.xp >= 50);
assert.equal(lesson.learned.length, 8);
const r2 = E.finishLesson(lesson, 0, 0);
assert.equal(r2.xp, 0, 'no repeated first-completion reward');
assert.equal(r2.jp, 1, 'one more star, one more insight');
assert.equal(E.finishLesson(lesson, 0, 0).jp, 0, 'perfect again earns nothing new');
assert.equal(E.finishLesson(lesson, 9, 0), null, 'locked lesson');
// The notebook fills with study, and a full page boosts Japanese learning.
lesson.studied = 46 * 3;
assert.equal(E.notebook(lesson)[0].complete, true);
assert.ok(close(E.notebookBonus(lesson), 1.1));

// Situations: once each, and dialects only in their own city.
let sit = started();
assert.equal(E.solveSituation(sit, 0, 2), false, 'wrong answer');
assert.equal(E.solveSituation(sit, 9, 0), false, 'locked situation');
assert.equal(E.solveSituation(sit, 0, 0), true);
assert.equal(E.solveSituation(sit, 0, 0), false, 'no repeated reward');
assert.equal(E.situationOpen(sit, 11), false, 'Kanazawa dialect waits for Kanazawa');
sit.city = 1;
assert.equal(E.situationOpen(sit, 11), true);

// Neighbors: stories commit only when a response is chosen; choices are remembered.
let people = started();
assert.equal(E.storyReady(people, 'sato'), true);
assert.equal(E.visit(people, 'sato'), null, 'a ready story is not consumed by an ordinary visit');
assert.equal(people.stories.sato || 0, 0);
const story = E.chooseStory(people, 'sato', 1);
assert.equal(people.stories.sato, 1);
assert.equal(people.choices.sato0, 1);
assert.ok(story.gains.culture >= 3);
assert.equal(E.storyReady(people, 'sato'), false, 'next story waits for connection');
people.bonds = 20;
assert.equal(E.storyReady(people, 'sato'), true);
assert.match(E.storyEcho(people, 'sato', 1), /pickles/, 'the next story remembers the earlier choice');
let moment = started();
moment.stories.sato = 4;
const m = E.visit(moment, 'sato');
assert.ok(m && m.text.length > 10);
assert.equal(E.visit(moment, 'sato'), null, 'ordinary visits rest between');
E.step(moment, E.VISIT_COOLDOWN);
assert.ok(E.visit(moment, 'sato'));
// A partnership after four stories.
const partner = E.fresh();
partner.stations[1].level = 1;
const before = E.sideGain(partner, 1);
partner.stories.sato = 4;
assert.ok(close(E.sideGain(partner, 1), before * 1.2));

// Local leaders: met, mentored over time, conversations read, then appointed.
let church = started();
church.xp = 1e15; church.run = 1e15; church.jp = 700; church.culture = 100; church.bonds = 100;
assert.equal(E.meetLocal(church, 0), false, 'not met before their place opens');
church.stations[3].level = 1; church.stations[2].level = 1; church.stations[4] = { level: 10, auto: true, running: true, progress: 0, cycles: 0 };
assert.equal(E.train(church, 0), false, 'must meet first');
for (let i = 0; i < 2; i++) {
  assert.ok(E.meetLocal(church, i));
  for (let stage = 0; stage < 3; stage++) {
    assert.ok(E.train(church, i), 'stage ' + stage);
    assert.equal(E.train(church, i), false, 'one stage at a time');
    E.step(church, E.TRAINING_TIME[stage]);
    assert.equal(church.elders[i].training, stage + 1);
    if (stage < 2) assert.equal(E.train(church, i), false, 'read the conversation first');
    assert.ok(E.readElder(church, i));
  }
  assert.ok(E.appoint(church, i));
  assert.equal(E.appoint(church, i), false);
}
assert.equal(E.ready(church), false, 'projects still needed');
church.projects = [0, 1, 2];
assert.ok(E.ready(church));
assert.deepEqual(E.destinations(church), [1, 2, 3, 4]);
const prior = { jp: church.jp, culture: church.culture, bonds: church.bonds };
assert.equal(E.prestige(church, 0), false, 'cannot move to the same city');
const roots = E.prestige(church, 2);
assert.ok(roots >= 1);
assert.equal(church.city, 2);
assert.deepEqual(church.plants[0].elders, ['Yui', 'Daisuke']);
for (const k of Object.keys(prior)) assert.equal(church[k], prior[k], k + ' carried forward');
assert.equal(church.stations[4].level, 0);
assert.equal(church.elders.filter(e => e.appointed || e.met).length, 0);
assert.equal(church.upgrades.length, 0);
assert.ok(E.support(church) > 0);
const beforeSupport = church.xp;
E.step(church, 10);
assert.ok(church.xp > beforeSupport, 'the entrusted church keeps supporting you');

// Saves round-trip; bad saves are rejected; old saves migrate.
const round = E.hydrate(JSON.parse(JSON.stringify(church)));
assert.deepEqual(round.plants, church.plants);
assert.equal(round.city, 2);
assert.equal(round.legacy, church.legacy);
assert.throws(() => E.hydrate({}));
assert.throws(() => E.hydrate({ ...JSON.parse(JSON.stringify(church)), xp: -5 }));
const rev5 = JSON.parse(JSON.stringify(E.fresh()));
rev5.revision = 5; rev5.started = true;
delete rev5.lessons; delete rev5.tutorial; delete rev5.resting; delete rev5.choices; delete rev5.moments; delete rev5.studied; delete rev5.clock;
rev5.stations[0].cycles = 77;
rev5.elders[0] = { training: 2, progress: 10, running: true, appointed: false };
rev5.learned = [0, 1, 27, 99];
const up = E.hydrate(rev5);
assert.equal(up.elders[0].met, true, 'mentored leaders count as met');
assert.equal(up.elders[0].read, 2, 'earlier mentoring needs no re-reading');
assert.equal(up.studied, 77, 'the notebook starts from past study');
assert.deepEqual(up.learned, [0, 1, 27], 'unknown words dropped');
assert.deepEqual(up.lessons, {});
assert.equal(up.clock, 'local');
const v1 = E.migrate({ version: 1, started: true, name: 'Jacob', study: 66, culture: 44, yen: 600, friends: { emi: { points: 30, chapter: 2 } }, learned: [0, 1], journal: [] });
assert.equal(v1.jp, 66);
assert.equal(v1.culture, 44);
assert.equal(v1.bonds, 30);
assert.equal(v1.xp, 1200);
assert.equal(v1.stations[0].auto, true);
assert.equal(v1.stories.emi, 2);
assert.equal(E.hydrate(JSON.parse(JSON.stringify(v1))).jp, 66);

// A quiet start: while resting nothing runs and help does nothing; beginning work clears it.
let quiet = E.fresh();
quiet.started = true; quiet.resting = true;
E.step(quiet, 30);
assert.equal(quiet.stations[0].cycles, 0);
assert.equal(E.assist(quiet).seconds, 0);
assert.equal(E.hydrate(JSON.parse(JSON.stringify(quiet))).resting, true, 'a reload mid-welcome stays resting');
E.start(quiet, 0);
E.step(quiet, 3);
assert.equal(quiet.stations[0].cycles, 1);
assert.equal(up.tutorial, E.TUTORIAL_DONE, 'older saves skip the welcome');
assert.equal(v1.tutorial, E.TUTORIAL_DONE);

// Content sanity: every story has two choices, responses and gains; every lesson has eight known words.
for (const [id, list] of Object.entries(C.stories)) {
  assert.equal(list.length, 4, id);
  for (const st of list) {
    assert.equal(st.choices.length, 2);
    assert.equal(st.responses.length, 2);
    assert.equal(st.gains.length, 2);
    if (st.echo) assert.equal(st.echo.lines.length, 2);
  }
  assert.ok(C.moments[id].length >= 5);
}
for (const l of C.LESSONS) {
  assert.equal(new Set(l.words).size, 8);
  for (const w of l.words) assert.ok(C.WORDS[w], l.id);
}
for (const city of E.CITIES) {
  assert.equal(city.locals.length, 3);
  for (const l of city.locals) assert.equal(l.stages.length, 3);
  assert.equal(city.projects.length, 3);
}

console.log('PASS engine: focused and parallel cycles, live/offline equivalence, offline cap, buying, milestones, helping, paced learning, goals, lessons, notebook, situations, dialects, stories and echoes, visits, partnerships, meeting/mentoring/appointing elders, entrusting, church support, saves, and migrations.');
