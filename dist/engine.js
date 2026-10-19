// A Little Light — the game rules.
// Pure, deterministic functions over one plain `state` object. No DOM. Works in the
// browser (window.Idle) and in Node (require) so the tests can drive whole campaigns.
(function (root) {
  'use strict';
  const JOURNEY = typeof module !== 'undefined' ? require('./journey.js') : root.Journey;
  const CONTENT = typeof module !== 'undefined' ? require('./content.js') : root.Content;

  const REVISION = 6;
  const OFFLINE_CAP = 28800; // seconds (8 hours)
  const HELP_SECONDS = 0.65; // one tap advances the focused task this much
  const VISIT_COOLDOWN = 90; // seconds between ordinary visits to the same neighbor

  // The eight places of the neighborhood. `needs` = [Japanese, culture, connection].
  const ACTIVITIES = [
    { id: 'study', jp: '日本語の勉強', name: 'Japanese study', sub: 'Flashcards at your apartment', icon: 'あ', cost: 10, base: 5, seconds: 3, needs: [0, 0, 0], mentor: 'A daily study habit', side: 'jp', amount: 0.08, color: '#759db0' },
    { id: 'errands', jp: '毎日の買い物', name: 'Everyday errands', sub: 'Learn how the neighborhood works', icon: '袋', cost: 120, base: 35, seconds: 5, needs: [5, 0, 0], mentor: 'Mrs. Sato’s local tips', side: 'culture', amount: 0.1, color: '#d4a064' },
    { id: 'cafe', jp: '喫茶店', name: 'Café regular', sub: 'A familiar seat, a familiar face', icon: '茶', cost: 1500, base: 250, seconds: 8, needs: [20, 3, 0], mentor: 'A standing tea invitation', side: 'bonds', amount: 0.12, color: '#bd8f87' },
    { id: 'tutor', jp: '英会話', name: 'Language exchange', sub: 'You teach a little. You learn a lot.', icon: '話', cost: 18000, base: 1700, seconds: 12, needs: [60, 12, 8], mentor: 'A weekly exchange group', side: 'jp', amount: 0.4, color: '#8b92b4' },
    { id: 'table', jp: '一緒に食べよう', name: 'The open table', sub: 'Make supper. Make room.', icon: '食', cost: 200000, base: 12000, seconds: 20, needs: [130, 30, 20], mentor: 'A shared cooking rota', side: 'bonds', amount: 0.5, color: '#b89455' },
    { id: 'stories', jp: '物語の時間', name: 'Story evenings', sub: 'Books, questions, and a little wonder', icon: '本', cost: 2500000, base: 84000, seconds: 30, needs: [240, 65, 50], mentor: 'Haru’s reading circle', side: 'culture', amount: 0.7, color: '#798f78' },
    { id: 'garden', jp: 'みんなの庭', name: 'Community garden', sub: 'Grow something worth sharing', icon: '芽', cost: 30000000, base: 590000, seconds: 50, needs: [400, 130, 100], mentor: 'Kenji’s garden team', side: 'culture', amount: 1.0, color: '#659a85' },
    { id: 'house', jp: 'みんなの家', name: 'A place to belong', sub: 'A neighborhood house with an open door', icon: '灯', cost: 360000000, base: 4100000, seconds: 80, needs: [650, 250, 180], mentor: 'Neighbors carry it together', side: 'bonds', amount: 1.2, color: '#c5825f' }
  ];
  const CITIES = JOURNEY.cities;
  const THRESHOLDS = [0, 20, 60, 130, 240, 400, 650, 1000];
  const LANGUAGE_NAMES = ['New arrival', 'First greetings', 'Finding your way', 'At the table', 'Lending a hand', 'Shared understanding', 'Feeling at home', 'Lifelong learner'];
  const TRAINING_TIME = [300, 480, 720]; // seconds each stage takes
  const LOCAL_PLACE = [3, 2, 4]; // where each city's teacher / listener / host is met
  // Economy knobs. Each place costs ~12× the last, pays ~7×, and takes longer, so every
  // new place takes a little longer to pay for itself (the classic idle-game ladder).
  const TUNE = { growth: 1.15, marks: [25, 50, 100, 200, 300, 400, 500], markMult: 2, unlock: [1, 1, 1, 1, 1, 1, 1, 1], basePay: [1, 1, 1, 1, 1, 1, 1, 1] };
  const MAX_LEVEL = 500;
  const SIDES = ['jp', 'culture', 'bonds'];
  const PARTNERS = { 1: 'sato', 2: 'emi', 4: 'aiko', 5: 'haru', 6: 'kenji', 7: 'aiko' };

  // Equipment: one purchase each per city. target -1 = all places.
  const BOOSTS = [
    { id: 'dictionary', name: 'Picture dictionary', desc: 'Japanese study earns ×2 XP', cost: 2000, target: 0, mult: 2, icon: '辞' },
    { id: 'bike', name: 'A secondhand bicycle', desc: 'Everyday errands earn ×3 XP', cost: 30000, target: 1, mult: 3, icon: '輪' },
    { id: 'kettle', name: 'A proper tea set', desc: 'Café visits earn ×3 XP', cost: 400000, target: 2, mult: 3, icon: '茶' },
    { id: 'notebooks', name: 'Better teaching materials', desc: 'Language exchange earns ×3 XP', cost: 6000000, target: 3, mult: 3, icon: '冊' },
    { id: 'tableware', name: 'A table with extra places', desc: 'Every place earns ×2 XP', cost: 300000000, target: -1, mult: 2, icon: '膳', home: 4 },
    { id: 'books', name: 'A library of possibilities', desc: 'Story evenings earn ×5 XP', cost: 4000000000, target: 5, mult: 5, icon: '本' },
    { id: 'tools', name: 'Good garden tools', desc: 'The garden earns ×3 XP', cost: 60000000000, target: 6, mult: 3, icon: '鍬' },
    { id: 'housekeys', name: 'Keys for the neighborhood', desc: 'Every place earns ×3 XP', cost: 1000000000000, target: -1, mult: 3, icon: '鍵', home: 7 }
  ];

  // The purpose shown at the top of the town. `reward` is seconds of production.
  const GOALS = [
    { title: 'Finish your first study session', target: 1, value: s => s.stations[0].cycles, reward: 30 },
    { title: 'Learn enough Japanese to shop locally', target: 5, value: s => s.jp, reward: 30 },
    { title: 'Open the corner shop errands', target: 1, value: s => Number(s.stations[1].level > 0), reward: 30 },
    { title: 'Finish your first Japanese lesson', target: 1, value: s => Object.keys(s.lessons).length, reward: 40 },
    { title: 'Improve your study space to level 10', target: 10, value: s => s.stations[0].level, reward: 40 },
    { title: 'Establish a habit that runs without you', target: 1, value: s => s.stations.filter(x => x.auto).length, reward: 45 },
    { title: 'Learn your first greetings', target: 20, value: s => s.jp, reward: 45 },
    { title: 'Become a regular at the café', target: 1, value: s => Number(s.stations[2].level > 0), reward: 60 },
    { title: 'Share a story with a neighbor', target: 1, value: s => Object.values(s.stories).reduce((n, v) => n + v, 0), reward: 60 },
    { title: 'Build three routines', target: 3, value: s => s.stations.filter(x => x.auto).length, reward: 60 },
    { title: 'Join the language exchange', target: 1, value: s => Number(s.stations[3].level > 0), reward: 60 },
    { title: 'Complete a community project', target: 1, value: s => s.projects.length, reward: 90 },
    { title: 'Understand the words around the table', target: 130, value: s => s.jp, reward: 90 },
    { title: 'Open the table to the neighborhood', target: 1, value: s => Number(s.stations[4].level > 0), reward: 90 },
    { title: 'Begin mentoring a local leader', target: 1, value: s => s.elders.reduce((n, e) => n + e.training + (e.running ? 1 : 0), 0), reward: 90 },
    { title: 'Open the reading room', target: 1, value: s => Number(s.stations[5].level > 0), reward: 120 },
    { title: 'Plant the community garden', target: 1, value: s => Number(s.stations[6].level > 0), reward: 120 },
    { title: 'Open the neighborhood house', target: 1, value: s => Number(s.stations[7].level > 0), reward: 120 }
  ];

  function freshElders() {
    return [0, 1, 2].map(() => ({ met: false, training: 0, progress: 0, running: false, appointed: false, read: 0 }));
  }
  function freshStations() {
    return ACTIVITIES.map((_, i) => ({ level: i === 0 ? 1 : 0, auto: false, running: false, progress: 0, cycles: 0 }));
  }
  function fresh() {
    return {
      version: 2, revision: REVISION,
      started: false, name: 'Jacob', coat: '#6e9275',
      sound: true, reducedMotion: false, quality: 'auto', clock: 'local',
      city: 0, chapters: 0, legacy: 0, plants: [],
      xp: 15, total: 15, run: 15, jp: 0, culture: 0, bonds: 0,
      time: 0, last: Date.now(),
      focus: 0, stations: freshStations(), upgrades: [],
      learned: [], lessons: {}, situations: [], studied: 0,
      visits: {}, stories: {}, choices: {}, moments: {},
      elders: freshElders(),
      projects: [], projectActive: null, quest: 0,
      journal: [], finaleSeen: false,
      taps: 0, cycles: 0, combo: 0, boostLeft: 0
    };
  }

  // ——— Multipliers ———
  function language(s) {
    let i = 0;
    while (i < THRESHOLDS.length - 1 && s.jp >= THRESHOLDS[i + 1]) i++;
    return i;
  }
  function gifts(s) { return [...new Set(s.plants.map(p => p.city))]; }
  function projectBonus(s) { return 1 + (s.projects?.length || 0) * 0.15; }
  function cultureBonus(s) { return 1 + Math.min(0.5, Math.floor(s.culture / 25) * 0.05); }
  function bondsBonus(s) { return 1 + Math.min(0.5, Math.floor(s.bonds / 25) * 0.05); }
  function global(s) {
    const city = CITIES[s.city];
    return projectBonus(s)
      * (gifts(s).includes(3) ? 1.2 : 1)
      * (city.side === 'xp' ? city.mult : 1)
      * (1 + s.legacy * 0.5)
      * Math.pow(2, s.plants.length) // every entrusted church keeps praying and sending
      * (1 + language(s) * 0.1)
      * cultureBonus(s) * bondsBonus(s)
      * BOOSTS.filter(b => b.target === -1 && s.upgrades.includes(b.id)).reduce((p, b) => p * b.mult, 1);
  }
  function marks(level) { return TUNE.marks.filter(n => level >= n).length; }
  function nextMark(level) { return TUNE.marks.find(n => n > level) || null; }
  function duration(s, i) {
    const level = s.stations[i].level;
    return ACTIVITIES[i].seconds / (level >= 100 ? 4 : level >= 25 ? 2 : 1);
  }
  function placeBoost(s, i) {
    return BOOSTS.filter(b => b.target === i && s.upgrades.includes(b.id)).reduce((p, b) => p * b.mult, 1);
  }
  function payout(s, i, boost = true) {
    const st = s.stations[i], a = ACTIVITIES[i];
    return a.base * TUNE.basePay[i] * st.level * Math.pow(TUNE.markMult, marks(st.level)) * global(s) * placeBoost(s, i) * (boost && s.boostLeft > 0 ? 2 : 1);
  }
  function support(s) { return s.plants.reduce((n, p) => n + p.support, 0) * global(s) * (s.boostLeft > 0 ? 2 : 1); }
  function rate(s, all = false) {
    return support(s) + s.stations.reduce((n, st, i) =>
      n + ((st.auto || (i === s.focus && st.level > 0) || (all && st.level > 0)) ? payout(s, i) / duration(s, i) : 0), 0);
  }

  // The study notebook: hiragana, then katakana, then first kanji, filled by study cycles.
  const NOTEBOOK = [
    { key: 'hiragana', chars: CONTENT.HIRAGANA, per: 3 },
    { key: 'katakana', chars: CONTENT.KATAKANA, per: 6 },
    { key: 'kanji', chars: CONTENT.KANJI, per: 12 }
  ];
  function notebook(s) {
    let left = s.studied || 0;
    return NOTEBOOK.map(book => {
      const filled = Math.max(0, Math.min(book.chars.length, Math.floor(left / book.per)));
      left = Math.max(0, left - book.chars.length * book.per);
      return { key: book.key, chars: book.chars, filled, complete: filled === book.chars.length };
    });
  }
  function notebookBonus(s) { return 1 + notebook(s).filter(b => b.complete).length * 0.1; }

  // Learning grows with milestones rather than every level, so it stays paced.
  function levelFactor(level) { return level ? 1 + 0.5 * marks(level) : 0; }
  function sideGain(s, i, count = 1) {
    const a = ACTIVITIES[i], partner = PARTNERS[i], g = gifts(s);
    const elder = s.elders[SIDES.indexOf(a.side)];
    return count * a.amount
      * (partner && s.stories[partner] >= 4 ? 1.2 : 1)
      * (g.includes(4) ? 1.2 : 1)
      * (g.includes(0) && a.side === 'jp' ? 1.25 : 1)
      * (g.includes(1) && a.side === 'culture' ? 1.25 : 1)
      * (g.includes(2) && a.side === 'bonds' ? 1.25 : 1)
      * (a.side === 'jp' ? notebookBonus(s) : 1)
      * (elder?.appointed ? 1.2 : 1)
      * levelFactor(s.stations[i].level)
      * (duration(s, i) / a.seconds) // speed-ups give more cycles, not more learning per second
      * (CITIES[s.city].side === a.side ? CITIES[s.city].mult : 1);
  }

  // ——— Places ———
  function accessible(s, i) {
    const n = ACTIVITIES[i].needs;
    return s.jp >= n[0] && s.culture >= n[1] && s.bonds >= n[2] && (i === 0 || s.stations[i - 1].level > 0);
  }
  function price(s, i, n = 1) {
    const level = s.stations[i].level;
    n = Math.max(0, Math.min(n, MAX_LEVEL - level));
    const g = TUNE.growth;
    return n ? Math.ceil(ACTIVITIES[i].cost * TUNE.unlock[i] * Math.pow(g, level) * (Math.pow(g, n) - 1) / (g - 1)) : 0;
  }
  function quantity(s, i, mode) {
    const max = MAX_LEVEL - s.stations[i].level;
    if (!max) return 0;
    if (mode !== 'max') return Math.min(max, Number(mode));
    const g = TUNE.growth;
    let n = Math.floor(Math.log(1 + s.xp * (g - 1) / (ACTIVITIES[i].cost * TUNE.unlock[i] * Math.pow(g, s.stations[i].level))) / Math.log(g));
    n = Math.min(max, Math.max(0, n));
    while (n && price(s, i, n) > s.xp) n--;
    return n;
  }
  function buy(s, i, mode = '1') {
    if (!ACTIVITIES[i] || !accessible(s, i)) return 0;
    const n = quantity(s, i, mode), cost = price(s, i, n);
    if (n < 1 || s.xp < cost) return 0;
    s.xp -= cost;
    const before = duration(s, i), st = s.stations[i];
    st.level += n;
    st.progress = st.progress / before * duration(s, i);
    return n;
  }
  function autoCost(i) { return ACTIVITIES[i].cost * 12; }
  function automate(s, i) {
    const st = s.stations[i];
    if (!st || !st.level || st.auto || s.xp < autoCost(i)) return false;
    s.xp -= autoCost(i);
    st.auto = true;
    st.running = true;
    return true;
  }
  function start(s, i) {
    const st = s.stations[i];
    if (!st || !st.level) return false;
    s.focus = i;
    s.stations.forEach((other, j) => { other.running = other.level > 0 && (other.auto || j === i); });
    return true;
  }
  function resume(s) {
    if (!s.stations[s.focus]?.level) s.focus = 0;
    s.stations.forEach((st, i) => { st.running = s.started && st.level > 0 && (st.auto || i === s.focus); });
  }
  function earn(s, amount) { s.xp += amount; s.total += amount; s.run += amount; }
  function credit(s, i, count) {
    s.stations[i].cycles += count;
    s.cycles = (s.cycles || 0) + count;
    if (i === 0) s.studied = (s.studied || 0) + count;
    earn(s, payout(s, i) * count);
    s[ACTIVITIES[i].side] += sideGain(s, i, count);
  }

  // Tapping helps with the actual task: it advances the focused activity, nothing else.
  function assist(s) {
    if (!s.started) return { xp: 0, seconds: 0 };
    const i = s.focus, st = s.stations[i];
    if (!st?.level) return { xp: 0, seconds: 0 };
    st.progress += HELP_SECONDS;
    s.taps++;
    const count = Math.floor((st.progress + 1e-9) / duration(s, i));
    let xp = 0;
    if (count) {
      st.progress -= count * duration(s, i);
      xp = payout(s, i) * count;
      credit(s, i, count);
    }
    return { xp, seconds: HELP_SECONDS, count };
  }
  function tap(s) { return assist(s).xp; }

  // Advance time event by event, so live play and offline catch-up give identical results.
  function step(s, seconds) {
    if (!s.started) return;
    resume(s);
    seconds = Math.min(OFFLINE_CAP, Math.max(0, seconds));
    while (seconds > 1e-9) {
      const pending = s.stations.map((st, i) => st.running && st.level ? Math.max(1e-8, duration(s, i) - st.progress) : Infinity);
      const training = s.elders.map(e => e.running ? Math.max(1e-8, TRAINING_TIME[e.training] - e.progress) : Infinity);
      const dt = Math.min(seconds, s.boostLeft > 0 ? s.boostLeft : Infinity, ...pending, ...training);
      const inherited = support(s) * dt;
      const done = [];
      for (let i = 0; i < ACTIVITIES.length; i++) {
        const st = s.stations[i];
        if (!st.level || !st.running) continue;
        const dur = duration(s, i);
        st.progress += dt;
        let count = Math.floor((st.progress + 1e-9) / dur);
        if (!st.auto && i !== s.focus) count = Math.min(1, count);
        if (!count) continue;
        done.push([i, count]);
        if (st.auto || i === s.focus) st.progress = Math.max(0, st.progress - count * dur);
        else { st.progress = 0; st.running = false; }
      }
      // Pay after every place has advanced, so payouts use the same multipliers.
      const pay = done.map(([i, count]) => [i, count, payout(s, i) * count, sideGain(s, i, count)]);
      for (const [i, count, xp, side] of pay) {
        s.stations[i].cycles += count;
        s.cycles = (s.cycles || 0) + count;
        if (i === 0) s.studied = (s.studied || 0) + count;
        earn(s, xp);
        s[ACTIVITIES[i].side] += side;
      }
      if (inherited) earn(s, inherited);
      for (const e of s.elders) {
        if (!e.running) continue;
        e.progress += dt;
        if (e.progress >= TRAINING_TIME[e.training] - 1e-8) {
          e.progress = 0;
          e.running = false;
          e.training = Math.min(3, e.training + 1);
        }
      }
      s.boostLeft = Math.max(0, s.boostLeft - dt);
      s.time += dt;
      seconds -= dt;
    }
  }

  function upgrade(s, id) {
    const b = BOOSTS.find(x => x.id === id);
    if (!b || s.upgrades.includes(id) || s.xp < b.cost) return false;
    if (b.target >= 0 && !s.stations[b.target].level) return false;
    s.xp -= b.cost;
    s.upgrades.push(id);
    return true;
  }

  // ——— Goals ———
  function goal(s) { return GOALS[s.quest] || null; }
  // A goal is worth `reward` seconds of everything you have running (at least 50 XP).
  function goalReward(s, g = goal(s)) {
    return g ? Math.max(50, Math.round(rate(s, true) * g.reward)) : 0;
  }
  function claimGoal(s) {
    const g = goal(s);
    if (!g || g.value(s) < g.target) return 0;
    const reward = goalReward(s, g);
    earn(s, reward);
    s.quest++;
    return reward;
  }

  // ——— Japanese ———
  function lessonAt(i) { return Math.max(...CONTENT.LESSONS[i].words.map(w => CONTENT.WORDS[w][3])); }
  function lessonOpen(s, i) { return !!CONTENT.LESSONS[i] && s.jp >= lessonAt(i); }
  function lessonStars(mistakes) { return mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1; }
  // Finishing a lesson: new words count toward insight; first completion pays XP; better stars pay a little more.
  function finishLesson(s, i, mistakes) {
    if (!lessonOpen(s, i) || !Number.isInteger(mistakes) || mistakes < 0) return null;
    const lesson = CONTENT.LESSONS[i], before = s.lessons[lesson.id] || 0, stars = lessonStars(mistakes);
    const newWords = lesson.words.filter(w => !s.learned.includes(w));
    s.learned.push(...newWords);
    const jp = newWords.length + Math.max(0, stars - before);
    const xp = before ? 0 : Math.max(50, Math.round(rate(s, true) * 20));
    s.jp += jp;
    earn(s, xp);
    s.lessons[lesson.id] = Math.max(before, stars);
    return { stars, best: s.lessons[lesson.id], newWords, jp, xp, first: !before };
  }
  function situationOpen(s, i) {
    const q = JOURNEY.situations[i];
    return !!q && s.jp >= q.at && (q.city === undefined || q.city === s.city);
  }
  function solveSituation(s, i, answer) {
    const q = JOURNEY.situations[i];
    if (!situationOpen(s, i) || s.situations.includes(i) || answer !== q.answer) return false;
    s.situations.push(i);
    s.jp += 3;
    s[q.side] += q.side === 'jp' ? 2 : 4;
    earn(s, Math.max(50, rate(s) * 12));
    return true;
  }

  // ——— Neighbors ———
  function person(id) { return CONTENT.PEOPLE.find(p => p.id === id); }
  function storyReady(s, id) {
    const p = person(id), stage = s.stories[id] || 0;
    return !!p && s.jp >= p.needs && stage < 4 && s.bonds >= CONTENT.STORY_AT[stage];
  }
  function visitWait(s, id) { return Math.max(0, Math.ceil(VISIT_COOLDOWN - (s.time - (s.visits[id] ?? -999)))); }
  function canVisit(s, id) {
    const p = person(id);
    return !!p && s.started && s.jp >= p.needs && (storyReady(s, id) || visitWait(s, id) === 0);
  }
  // An ordinary visit (no story ready): a small moment, +2 connection, and a short rest.
  function visit(s, id) {
    if (!canVisit(s, id) || storyReady(s, id)) return null;
    s.visits[id] = s.time;
    s.bonds += 1;
    const list = CONTENT.moments[id], n = s.moments[id] || 0;
    s.moments[id] = n + 1;
    return { text: list[n % list.length], bonds: 1 };
  }
  // Story progress is committed only here, when a response is chosen.
  function chooseStory(s, id, choice) {
    if (!storyReady(s, id)) return null;
    const stage = s.stories[id] || 0, story = CONTENT.stories[id][stage];
    if (!story || !story.choices[choice]) return null;
    s.stories[id] = stage + 1;
    s.choices[id + stage] = choice;
    const gains = { jp: 0, culture: 0, bonds: 2 };
    for (const k of SIDES) gains[k] += story.gains?.[choice]?.[k] || 0;
    for (const k of SIDES) s[k] += gains[k];
    const xp = Math.max(40, Math.round(rate(s, true) * 15));
    earn(s, xp);
    return { stage, story, response: story.responses[choice], gains, xp };
  }
  function storyEcho(s, id, stage) {
    const echo = CONTENT.stories[id][stage]?.echo;
    if (!echo) return '';
    const pick = s.choices[id + echo.stage];
    return Number.isInteger(pick) ? echo.lines[pick] || '' : '';
  }

  // ——— Local leaders and elders ———
  function localPresent(s, i) { return (s.stations[LOCAL_PLACE[i]]?.level || 0) > 0; }
  function meetLocal(s, i) {
    const e = s.elders[i];
    if (!e || e.met || !localPresent(s, i)) return false;
    e.met = true;
    s.bonds += 3;
    return true;
  }
  function canTrain(s, i) {
    const e = s.elders[i];
    return !!e && e.met && e.training < 3 && !e.running && e.read >= e.training
      && s.bonds >= 20 && s.culture >= 20 && s.stations[4].level > 0;
  }
  function train(s, i) {
    if (!canTrain(s, i)) return false;
    const e = s.elders[i];
    e.running = true;
    e.progress = 0;
    return true;
  }
  // A finished mentoring stage leaves a conversation to read before the next stage.
  function readElder(s, i) {
    const e = s.elders[i];
    if (!e || e.read >= e.training) return false;
    e.read++;
    return true;
  }
  function appoint(s, i) {
    const e = s.elders[i];
    if (!e || e.training < 3 || e.appointed) return false;
    e.read = 3;
    e.appointed = true;
    return true;
  }

  // ——— Community projects ———
  function project(s) { return CITIES[s.city].projects[s.projects.length] || null; }
  function projectProgress(s) {
    const p = project(s);
    if (!p) return [];
    return p.tasks.map(([i, n, label], k) => ({
      i, target: n, label,
      done: s.projectActive ? Math.min(n, Math.max(0, s.stations[i].cycles - s.projectActive.baseline[k])) : 0
    }));
  }
  function projectCanStart(s) {
    const p = project(s);
    return !!p && !s.projectActive && p.tasks.every(([i]) => s.stations[i].level > 0);
  }
  function startProject(s) {
    if (!projectCanStart(s)) return false;
    const p = project(s);
    s.projectActive = { index: s.projects.length, baseline: p.tasks.map(([i]) => s.stations[i].cycles) };
    return true;
  }
  function projectReady(s) { return !!s.projectActive && projectProgress(s).every(t => t.done >= t.target); }
  // A finished project is worth `reward` seconds of everything you have running.
  function projectReward(s, p = project(s)) { return p ? Math.max(100, Math.round(rate(s, true) * p.reward)) : 0; }
  function claimProject(s) {
    if (!projectReady(s)) return false;
    const p = project(s), xp = projectReward(s, p);
    s.projects.push(s.projects.length);
    s.projectActive = null;
    earn(s, xp);
    s[p.side] += p.amount;
    return { ...p, xp };
  }

  // ——— Entrusting the church ———
  function legacyGain(s) {
    const goal = CITIES[s.city].goal;
    return s.run >= goal ? Math.max(1, Math.floor(Math.sqrt(s.run / goal))) : 0;
  }
  function handover(s) {
    return {
      projects: s.projects.length === 3,
      table: s.stations[4].level >= 10 && s.stations[4].auto,
      elders: s.elders.filter(e => e.appointed).length >= 2,
      xp: legacyGain(s) >= 1
    };
  }
  function complete(s) { return gifts(s).length === 5; }
  function ready(s) {
    const h = handover(s);
    return !complete(s) && h.projects && h.table && h.elders && h.xp;
  }
  function destinations(s) {
    const g = gifts(s);
    if (g.length === 4 && !g.includes(s.city)) return [-1];
    return CITIES.map((_, i) => i).filter(i => i !== s.city && !g.includes(i));
  }
  function prestige(s, destination) {
    if (!ready(s) || !destinations(s).includes(destination)) return false;
    const n = legacyGain(s);
    const inherited = s.stations.reduce((sum, st, i) => sum + (st.auto ? payout(s, i, false) / duration(s, i) / global(s) : 0), 0) * 0.02;
    s.plants.push({
      city: s.city,
      elders: s.elders.map((e, i) => e.appointed ? CITIES[s.city].locals[i].name : null).filter(Boolean),
      support: inherited
    });
    s.legacy += n;
    s.chapters++;
    if (destination === -1) return n;
    s.city = destination;
    s.focus = 0;
    s.elders = freshElders();
    s.xp = 15;
    s.run = 15;
    s.stations = freshStations();
    s.upgrades = [];
    s.projects = [];
    s.projectActive = null;
    s.boostLeft = 0;
    s.combo = 0;
    s.quest = 0;
    return n;
  }

  // ——— Saves ———
  function finite(v, max = 1e70) { return Number.isFinite(v) && v >= 0 && v <= max; }
  function hydrate(raw) {
    if (!raw || raw.version !== 2 || !Array.isArray(raw.stations) || raw.stations.length !== 8) throw Error('Not a valid Little Light save.');
    const s = fresh();
    for (const k of ['xp', 'total', 'run', 'jp', 'culture', 'bonds', 'legacy', 'chapters', 'time', 'last', 'taps', 'combo', 'boostLeft', 'quest']) {
      if (!finite(raw[k])) throw Error('Invalid save values.');
      s[k] = raw[k];
    }
    for (const k of ['studied', 'cycles']) s[k] = finite(raw[k]) ? Math.floor(raw[k]) : 0;
    s.city = Number.isInteger(raw.city) && CITIES[raw.city] ? raw.city : 0;
    s.plants = Array.isArray(raw.plants) ? raw.plants
      .filter(p => p && Number.isInteger(p.city) && CITIES[p.city] && finite(p.support, 1e65) && Array.isArray(p.elders))
      .slice(0, 100)
      .map(p => ({ city: p.city, support: p.support, elders: p.elders.filter(n => typeof n === 'string').map(n => n.slice(0, 30)).slice(0, 3) })) : [];
    s.elders = s.elders.map((e, i) => {
      const r = raw.elders?.[i];
      if (!r) return e;
      const training = Number.isInteger(r.training) ? Math.max(0, Math.min(3, r.training)) : 0;
      const appointed = training === 3 && !!r.appointed;
      return {
        // Saves from before meeting existed: anyone already mentored has clearly been met.
        met: !!r.met || training > 0 || !!r.running,
        training,
        progress: Number.isFinite(r.progress) ? Math.max(0, Math.min(TRAINING_TIME[Math.min(2, training)] - 0.001, r.progress)) : 0,
        running: training < 3 && !!r.running,
        appointed,
        read: appointed ? 3 : Number.isInteger(r.read) ? Math.max(0, Math.min(training, r.read)) : training
      };
    });
    s.last = Math.min(s.last, Date.now());
    s.combo = Math.min(24, Math.floor(s.combo));
    s.boostLeft = 0;
    s.quest = Math.min(GOALS.length, Math.floor(s.quest));
    s.focus = Number.isInteger(raw.focus) && raw.focus >= 0 && raw.focus < 8 ? raw.focus : 0;
    s.coat = ['#6e9275', '#648ca8', '#b98165', '#9b83ab'].includes(raw.coat) ? raw.coat : '#6e9275';
    s.name = String(raw.name || 'Friend').slice(0, 24);
    s.started = !!raw.started;
    s.sound = !!raw.sound;
    s.reducedMotion = !!raw.reducedMotion;
    s.quality = raw.quality === 'low' ? 'low' : 'auto';
    s.clock = raw.clock === 'day' ? 'day' : 'local';
    s.upgrades = BOOSTS.filter(b => raw.upgrades?.includes(b.id)).map(b => b.id);
    s.learned = Array.isArray(raw.learned) ? [...new Set(raw.learned.filter(n => Number.isInteger(n) && n >= 0 && n < CONTENT.WORDS.length))] : [];
    s.lessons = {};
    for (const l of CONTENT.LESSONS) {
      const v = raw.lessons?.[l.id];
      if (Number.isInteger(v) && v >= 1 && v <= 3) s.lessons[l.id] = v;
    }
    s.stations = raw.stations.map(st => {
      if (!st || !Number.isFinite(st.level) || !Number.isFinite(st.progress) || !Number.isFinite(st.cycles)) throw Error('Invalid activity.');
      const level = Math.max(0, Math.min(MAX_LEVEL, Math.floor(st.level)));
      return { level, auto: level > 0 && !!st.auto, running: level > 0 && !!st.running, progress: Math.max(0, st.progress), cycles: Math.max(0, st.cycles) };
    });
    s.stations.forEach((st, i) => { st.progress = Math.min(st.progress, duration(s, i) - 0.001); });
    for (const p of CONTENT.PEOPLE) {
      const id = p.id;
      if (Number.isFinite(raw.visits?.[id])) s.visits[id] = Math.max(-999, Math.min(raw.visits[id], 1e12));
      if (Number.isFinite(raw.stories?.[id])) s.stories[id] = Math.max(0, Math.min(4, Math.floor(raw.stories[id])));
      if (Number.isFinite(raw.moments?.[id])) s.moments[id] = Math.max(0, Math.floor(raw.moments[id]));
      for (let k = 0; k < 4; k++) if ([0, 1].includes(raw.choices?.[id + k])) s.choices[id + k] = raw.choices[id + k];
    }
    s.journal = Array.isArray(raw.journal) ? raw.journal
      .filter(e => e && typeof e.text === 'string' && Number.isFinite(e.time))
      .slice(0, 80)
      .map(e => ({ time: e.time, text: e.text.slice(0, 1000), ...(typeof e.kind === 'string' ? { kind: e.kind.slice(0, 20) } : {}) })) : [];
    s.projects = Array.isArray(raw.projects) ? [...new Set(raw.projects.filter(n => Number.isInteger(n) && n >= 0 && n < 3))].sort() : [];
    if (s.projects.some((n, i) => n !== i)) s.projects = [];
    s.situations = Array.isArray(raw.situations) ? [...new Set(raw.situations.filter(n => Number.isInteger(n) && JOURNEY.situations[n]))] : [];
    s.finaleSeen = !!raw.finaleSeen;
    const pr = CITIES[s.city].projects[s.projects.length];
    const active = raw.projectActive;
    if (pr && active?.index === s.projects.length && Array.isArray(active.baseline) && active.baseline.length === pr.tasks.length
      && active.baseline.every((n, i) => Number.isFinite(n) && n >= 0 && n <= s.stations[pr.tasks[i][0]].cycles)) {
      s.projectActive = { index: s.projects.length, baseline: [...active.baseline] };
    }
    if (!Number.isInteger(raw.revision) || raw.revision < REVISION) s.studied = Math.max(s.studied, Math.floor(s.stations[0].cycles));
    return s;
  }
  // The very first prototype's save format.
  function migrate(old) {
    const s = fresh();
    if (old?.version !== 1) return s;
    s.started = !!old.started;
    s.name = String(old.name || 'Jacob').slice(0, 24);
    s.jp = Math.max(0, Number(old.study) || 0);
    s.culture = Math.max(0, Number(old.culture) || 0);
    s.bonds = Object.values(old.friends || {}).reduce((n, f) => n + (Number(f.points) || 0), 0);
    s.xp = Math.min(10000, Math.max(100, (Number(old.yen) || 0) * 2));
    s.total = s.run = s.xp;
    s.learned = Array.isArray(old.learned) ? old.learned.filter(n => Number.isInteger(n) && n >= 0 && n < 28) : [];
    s.stations[0].auto = true;
    s.stations[0].running = true;
    for (const [id, f] of Object.entries(old.friends || {})) if (person(id)) s.stories[id] = Math.min(4, f.chapter || 0);
    s.journal = Array.isArray(old.journal) ? old.journal.filter(e => e && typeof e.text === 'string' && Number.isFinite(e.time)) : [];
    return s;
  }

  const api = {
    TUNE, REVISION, OFFLINE_CAP, HELP_SECONDS, VISIT_COOLDOWN,
    JOURNEY, CONTENT, ACTIVITIES, CITIES, THRESHOLDS, LANGUAGE_NAMES, TRAINING_TIME, LOCAL_PLACE, BOOSTS, GOALS, MAX_LEVEL,
    fresh, language, gifts, global, projectBonus, cultureBonus, bondsBonus, marks, nextMark, duration, placeBoost, payout, support, rate,
    notebook, notebookBonus, levelFactor, sideGain, accessible, price, quantity, buy, autoCost, automate, start, resume, earn, assist, tap, step, upgrade,
    goal, goalReward, claimGoal,
    lessonAt, lessonOpen, lessonStars, finishLesson, situationOpen, solveSituation,
    person, storyReady, visitWait, canVisit, visit, chooseStory, storyEcho,
    localPresent, meetLocal, canTrain, train, readElder, appoint,
    project, projectProgress, projectReward, projectCanStart, startProject, projectReady, claimProject,
    legacyGain, handover, complete, ready, destinations, prestige, hydrate, migrate
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.Idle = api;
})(typeof window !== 'undefined' ? window : globalThis);
