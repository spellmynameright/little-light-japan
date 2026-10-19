// Pacing simulation: a plausible player, not an optimal one.
// Plays in sessions (active minutes, then time away), buys sensibly, does lessons,
// reads stories, mentors elders, and runs projects. Prints minutes per city.
// Usage: node tests/pacing.cjs [activeMinutes=20] [awayMinutes=120]
const E = require('../dist/engine.js');

function simulate({ active = 20, away = 120, taps = 1, log = false, trace = 0, stopCity = 99 } = {}) {
  const s = E.fresh();
  s.started = true;
  E.start(s, 0);
  let activeSeconds = 0, wall = 0, sessionLeft = active * 60;
  const cities = [];
  let unlocks = [];
  let cityStartActive = 0, cityStartWall = 0;
  const say = (...a) => log && console.log(...a);

  function decide() {
    if (E.claimGoal(s)) say('goal', s.quest);
    if (E.projectReady(s)) E.claimProject(s);
    E.startProject(s);
    // Lessons and situations, roughly one a minute.
    if (activeSeconds % 60 === 0) {
      const open = E.CONTENT.LESSONS.findIndex((l, i) => E.lessonOpen(s, i) && !s.lessons[l.id]);
      if (open >= 0) E.finishLesson(s, open, 1);
      const sit = E.JOURNEY.situations.findIndex((q, i) => E.situationOpen(s, i) && !s.situations.includes(i));
      if (sit >= 0) E.solveSituation(s, sit, E.JOURNEY.situations[sit].answer);
    }
    // Visit whoever has a story; otherwise the occasional ordinary visit.
    for (const p of E.CONTENT.PEOPLE) {
      if (s.city === 0 && E.storyReady(s, p.id)) E.chooseStory(s, p.id, 0);
      else if (s.city === 0 && activeSeconds % 30 === 0 && E.canVisit(s, p.id)) E.visit(s, p.id);
    }
    for (let i = 0; i < 3; i++) {
      E.meetLocal(s, i);
      E.readElder(s, i);
      E.train(s, i);
      E.appoint(s, i);
    }
    // Unlock new places as soon as possible and move there.
    for (let i = 0; i < 8; i++) if (!s.stations[i].level && E.buy(s, i)) { E.start(s, i); unlocks.push(Math.round((activeSeconds - cityStartActive) / 60)); }
    const reserve = 0;
    for (let i = 0; i < 8; i++) if (s.stations[i].level && !s.stations[i].auto && s.xp - reserve > E.autoCost(i) * 1.5) E.automate(s, i);
    for (const b of E.BOOSTS) if (s.xp - reserve > b.cost * 2) E.upgrade(s, b.id);
    // Improve the best value place, a few times a second at most.
    for (let k = 0; k < 3; k++) {
      const options = s.stations.map((x, i) => ({ i, value: x.level ? E.payout(s, i) / x.level / E.duration(s, i) / E.price(s, i) : 0 }))
        .filter(o => o.value && s.xp - reserve > E.price(s, o.i)).sort((a, b) => b.value - a.value);
      if (!options[0] || !E.buy(s, options[0].i)) break;
    }
    // Focus where the project needs work, else the newest place.
    const need = E.projectProgress(s).find(t => t.done < t.target && !s.stations[t.i].auto);
    const newest = s.stations.map((x, i) => x.level ? i : -1).filter(i => i >= 0).pop();
    E.start(s, need ? need.i : newest);
    if (E.ready(s)) {
      const dest = E.destinations(s)[0];
      cities.push({ city: E.CITIES[s.city].name, activeMin: Math.round((activeSeconds - cityStartActive) / 60), wallMin: Math.round((wall - cityStartWall) / 60), roots: E.legacyGain(s), unlocks: unlocks.join(','), jp: Math.round(s.jp), lessons: Object.keys(s.lessons).length, xp: s.run.toExponential(1) });
      unlocks = [];
      E.prestige(s, dest);
      E.start(s, 0);
      cityStartActive = activeSeconds;
      cityStartWall = wall;
    }
  }

  while (!E.complete(s) && wall < 3600 * 24 * 30 && s.chapters < stopCity) {
    if (trace && activeSeconds % trace === 0 && sessionLeft > 0) console.log(Math.round((activeSeconds - cityStartActive) / 60), 'rate', E.rate(s).toExponential(1), 'run', s.run.toExponential(1), 'jp', Math.round(s.jp), 'c', Math.round(s.culture), 'b', Math.round(s.bonds), 'lv', s.stations.map(x => x.level + (x.auto ? 'a' : '')).join(','), 'proj', s.projects.length, 'eld', s.elders.map(e => e.training + (e.running ? '*' : '')).join(''), JSON.stringify(E.handover(s)).replace(/"|true|false/g, m => m === 'true' ? '1' : m === 'false' ? '0' : ''));
    if (log && wall % 3600 === 0) say(wall / 3600, JSON.stringify(E.handover(s)), s.stations.map(x => x.level + (x.auto ? "a" : "")).join(","), s.projects, s.elders.map(e => e.training).join(","));
    if (sessionLeft > 0) {
      for (let t = 0; t < taps; t++) E.assist(s);
      E.step(s, 1);
      activeSeconds++;
      wall++;
      sessionLeft--;
      decide();
    } else {
      E.step(s, away * 60);
      wall += away * 60;
      sessionLeft = active * 60;
      decide();
    }
  }
  return { cities, totalActiveMin: Math.round(activeSeconds / 60), totalWallHours: +(wall / 3600).toFixed(1), complete: E.complete(s), jp: Math.round(s.jp), learned: s.learned.length, stories: s.stories };
}

if (require.main === module) {
  const [active = 20, away = 120] = process.argv.slice(2).map(Number);
  const r = simulate({ active, away });
  for (const c of r.cities) console.log(JSON.stringify(c));
  delete r.cities;
  console.log(JSON.stringify(r));
}
module.exports = { simulate };
