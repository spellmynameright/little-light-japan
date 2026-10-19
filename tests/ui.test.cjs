// Interface checks in a simulated browser (jsdom): the real page, real buttons, a fake clock.
const assert = require('node:assert/strict'), fs = require('node:fs');
const { JSDOM } = require(process.env.JSDOM_PATH || 'jsdom');
const root = __dirname + '/../dist/';
const html = fs.readFileSync(root + 'index.html', 'utf8').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<link[^>]*>/g, '');
const FILES = ['journey.js', 'content.js', 'engine.js', 'audio.js', 'app.js', 'panels.js', 'tutorial.js'];

function make(saved, extra = {}) {
  const dom = new JSDOM(html, { url: 'https://test.local/', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  let now = 1760000000000;
  const errors = [], intervals = [], timeouts = [];
  const NativeDate = w.Date;
  w.Date = class extends NativeDate { constructor(...a) { super(...(a.length ? a : [now])); } static now() { return now; } };
  w.setInterval = (fn, ms) => { intervals.push({ fn, ms }); return intervals.length; };
  w.setTimeout = fn => { timeouts.push(fn); return timeouts.length; };
  w.clearTimeout = () => {};
  w.scrollTo = () => {};
  w.addEventListener('error', e => errors.push(e.message));
  if (saved) w.localStorage.setItem('little-light-japan-v2', JSON.stringify(saved));
  for (const [k, v] of Object.entries(extra)) w.localStorage.setItem(k, v);
  for (const file of FILES) w.eval(fs.readFileSync(root + file, 'utf8'));
  const $ = q => w.document.querySelector(q);
  return {
    w, dom, errors, $,
    click(q) { const el = $(q); assert.ok(el, 'missing ' + q); el.click(); },
    tick(seconds) { now += seconds * 1000; intervals.find(x => x.ms === 100).fn(); },
    save() { intervals.find(x => x.ms === 4000).fn(); },
    flush() { while (timeouts.length) timeouts.shift()(); },
    state: () => w.GameBridge.state()
  };
}

// ——— A fresh game ———
let t = make();
assert.equal(t.errors.length, 0);
assert.ok(t.$('#begin'), 'the welcome appears for a new player');
t.$('#your-name').value = 'Jacob';
t.click('#begin');
let s = t.state();
assert.equal(s.started, true);
assert.equal(t.$('.modal'), null);
// A quiet start: nothing runs until you sit down at the desk, and Mrs. Sato is at the door.
assert.equal(s.resting, true);
t.tick(5);
assert.equal(s.stations[0].cycles, 0, 'nothing runs before you begin');
assert.match(t.$('#coach').textContent, /Sato/);
assert.equal(t.$('#pc-help span').textContent, 'Begin studying');
t.click('#coach-skip');
t.click('#skip-yes');
assert.equal(s.tutorial, t.w.Idle.TUTORIAL_DONE);
assert.equal(s.resting, false, 'skipping the welcome starts the work');
assert.equal(t.$('#coach'), null);
t.tick(12);
assert.equal(s.stations[0].cycles, 4, 'the focused activity repeats on its own');
assert.match(t.$('#pc-verb').textContent, /s ·/);

// The goal chip claims rewards; Help speeds up the task; Improve buys a level.
assert.ok(t.$('#goal-chip').classList.contains('ready'));
t.click('#goal-chip');
assert.equal(s.quest, 1);
const lvl = s.stations[0].level;
t.click('#pc-improve');
assert.equal(s.stations[0].level, lvl + 1);
t.tick(0.2);
const progress = s.stations[0].progress;
t.click('#pc-help');
assert.notEqual(s.stations[0].progress, progress);
assert.equal(t.errors.length, 0, 'town controls');

// A story popup closed early is not consumed; choosing commits it and remembers the choice.
t.w.GameBridge.visit('sato');
assert.ok(t.$('[data-choice]'));
t.click('.modal-close');
assert.equal(s.stories.sato || 0, 0);
t.w.GameBridge.visit('sato');
t.click('[data-choice="0"]');
assert.equal(s.stories.sato, 1);
assert.equal(s.choices.sato0, 0);
assert.ok(t.$('.response'));
t.click('[data-close]');
assert.equal(t.$('.modal'), null);

// Learn: a full lesson with one mistake, then a situation.
t.click('.tabs [data-tab="learn"]');
assert.equal(t.$('#panel').hidden, false);
t.click('[data-lesson="0"]');
let mistakes = 0;
for (let q = 0; q < 6; q++) {
  const W = t.w.Content.WORDS;
  const prompt = t.$('.prompt')?.textContent;
  const options = [...t.w.document.querySelectorAll('[data-option]')];
  const right = options.find(o => { const w = W[Number(o.dataset.option)]; return w[0] === prompt || w[2] === prompt; });
  if (q === 2) { options.find(o => o !== right).click(); mistakes++; }
  right.click();
  t.flush();
}
assert.match(t.$('.modal').textContent, /Lesson complete/);
assert.equal(s.lessons.hello, 2, 'one slip = two stars');
assert.equal(s.learned.length, 8);
t.click('[data-close]');
const sit = t.$('[data-sit]');
assert.ok(sit, 'a situation is waiting');
const qi = Number(sit.dataset.sit);
t.click(`[data-sit="${qi}"][data-answer="${t.w.Journey.situations[qi].answer}"]`);
assert.ok(s.situations.includes(qi));
assert.equal(t.errors.length, 0, 'lessons and situations');

// People and Journey render; a project begins and completes through ordinary work.
t.click('.tabs [data-tab="people"]');
assert.ok(t.w.document.querySelectorAll('.neighbor').length === 5);
assert.ok(t.w.document.querySelectorAll('.local').length === 3);
t.click('.tabs [data-tab="journey"]');
s.jp = 30; s.xp = 1e6;
t.w.App.selectPlace(1);
t.click('#pc-unlock');
assert.equal(s.stations[1].level, 1, 'the corner shop opens from the place card');
assert.equal(s.focus, 1);
t.click('#pc-auto');
assert.equal(s.stations[1].auto, true);
t.w.App.selectPlace(0);
t.click('#pc-auto');
t.click('.tabs [data-tab="journey"]');
t.click('#project-action');
assert.ok(s.projectActive, 'project begun');
t.tick(300);
assert.ok(t.w.Idle.projectReady(s));
t.click('#project-action');
assert.equal(s.projects.length, 1);
t.click('[data-close]');
assert.equal(t.errors.length, 0, 'project flow');

// Long absence: credited once, never twice.
const before = s.time;
t.tick(3600);
assert.ok(s.time >= before + 3600);
const xp = s.xp;
t.tick(0);
assert.equal(s.xp, xp, 'no double catch-up');

// Settings persist across a reload.
t.click('.tabs [data-tab="town"]');
t.click('#settings-btn');
t.$('#profile-name').value = 'Jacob';
t.$('#profile-name').dispatchEvent(new t.w.Event('change'));
t.click('#opt-low');
t.click('#opt-motion');
t.click('[data-coat="#648ca8"]');
assert.equal(s.quality, 'low');
assert.equal(s.reducedMotion, true);
assert.ok(t.w.document.body.classList.contains('reduce-motion'));
t.click('.modal-close');
t.save();
const saved = JSON.parse(t.w.localStorage.getItem('little-light-japan-v2'));
assert.equal(saved.revision, 6);
assert.equal(t.errors.length, 0, 'settings');
t.dom.window.close();

let r = make(saved);
const rs = r.state();
assert.equal(rs.coat, '#648ca8');
assert.equal(rs.quality, 'low');
assert.equal(rs.reducedMotion, true);
assert.equal(rs.projects.length, 1);
assert.equal(rs.lessons.hello, 2);
r.tick(9);
assert.ok(rs.stations[rs.focus].running);
assert.equal(r.errors.length, 0, 'reload');
r.dom.window.close();

// An older save sees what's new and keeps its progress.
const old = JSON.parse(JSON.stringify(saved));
old.revision = 5;
let o = make(old);
assert.match(o.w.document.body.textContent, /The neighborhood has grown/);
assert.equal(o.state().projects.length, 1);
o.dom.window.close();

// Mrs. Sato's welcome, step by step, with the real buttons.
let g = make();
g.click('#begin');
const gs = g.state();
g.tick(0.1);
assert.equal(gs.tutorial, 0);
g.click('#coach-next');
g.tick(0.1);
assert.equal(gs.tutorial, 1);
assert.ok(g.$('#pc-help').classList.contains('coach-target'), 'she points at the desk');
g.click('#pc-help');
g.tick(0.1);
assert.equal(gs.resting, false);
assert.equal(gs.tutorial, 2);
g.tick(9.1);
assert.equal(gs.tutorial, 3, 'three sessions done');
assert.ok(g.$('#pc-improve').classList.contains('coach-target'));
g.click('#pc-improve');
g.tick(0.1);
assert.equal(gs.tutorial, 4);
g.click('#goal-chip');
g.tick(0.1);
assert.equal(gs.tutorial, 5);
g.w.GameBridge.visit('sato');
g.click('[data-choice="0"]');
g.click('[data-close]');
g.tick(0.1);
assert.equal(gs.tutorial, 6);
assert.ok(g.$('.tabs [data-tab="learn"]').classList.contains('coach-target'));
g.w.Idle.finishLesson(gs, 0, 0);
g.tick(0.1);
assert.equal(gs.tutorial, 7);
gs.jp = 5; gs.xp = 1000;
g.tick(0.1);
assert.ok(g.$('.strip-place[data-place="1"]').classList.contains('coach-target'), 'she points at the shop');
g.click('.strip-place[data-place="1"]');
g.tick(0.1);
g.click('#pc-unlock');
g.tick(0.1);
assert.equal(gs.tutorial, 8);
g.click('.strip-place[data-place="0"]');
g.tick(0.1);
g.click('#pc-auto');
g.tick(0.1);
assert.equal(gs.tutorial, 9);
g.click('#coach-next');
assert.equal(gs.tutorial, g.w.Idle.TUTORIAL_DONE);
assert.equal(g.$('#coach'), null);
g.click('#settings-btn');
g.click('#opt-tour');
g.tick(0.1);
assert.ok(g.$('#coach-next'), 'the welcome can be replayed as a tour');
for (let i = 0; i < 10; i++) g.click('#coach-next');
assert.equal(gs.tutorial, g.w.Idle.TUTORIAL_DONE);
assert.equal(g.errors.length, 0, 'tutorial');
g.dom.window.close();

// The final handover leads to the ending, which can be finished and replayed.
const fin = JSON.parse(JSON.stringify(saved));
Object.assign(fin, { city: 4, projects: [0, 1, 2], projectActive: null, run: 1e16, finaleSeen: false });
fin.plants = [0, 1, 2, 3].map(city => ({ city, elders: ['A', 'B'], support: 10 }));
fin.stations[4] = { level: 10, auto: true, running: true, progress: 0, cycles: 20 };
fin.elders = [0, 1, 2].map(i => ({ met: true, training: 3, progress: 0, running: false, appointed: i < 2, read: 3 }));
let f = make(fin);
f.click('.tabs [data-tab="journey"]');
f.click('#entrust');
f.click('[data-dest="-1"]');
assert.equal(f.w.Idle.complete(f.state()), true);
for (let i = 0; i < 4; i++) f.click('[data-next]');
assert.match(f.$('.modal').textContent, /Will you stay for tea/);
f.click('[data-close]');
assert.equal(f.state().finaleSeen, true);
f.click('.tabs [data-tab="journey"]');
f.click('#read-ending');
assert.ok(f.$('[data-next]'));
assert.equal(f.errors.length, 0, 'ending');
f.dom.window.close();

console.log('PASS ui: welcome, quiet start, Mrs. Sato\'s step-by-step tutorial, skip and replay, timers, goals, help, improve, interrupted and chosen stories, a full lesson, situations, tabs, unlocks, routines, a community project, long absences, settings, reloads, older saves, and the ending.');
