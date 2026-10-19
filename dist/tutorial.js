// A Little Light — Mrs. Sato's welcome: the first-time tutorial.
// A small card with her portrait walks a new player through the first ten minutes.
// Each step waits for the real action (and glows on the button that does it), so
// nothing is explained that the player doesn't then do. Progress lives in s.tutorial.
(function () {
  'use strict';
  const A = window.App, { E, esc } = A;
  const $ = q => document.querySelector(q);
  const DONE = E.TUTORIAL_DONE;

  // say: what she says · target: the element to glow · done: when the step is complete
  // progress: a short "how far along" line · button: a step you finish by tapping
  const STEPS = [
    { say: '<i>Knock, knock.</i> あら、こんにちは！ You must be the new neighbor. I’m Sato — I live just below you. Welcome to Hanamimachi.',
      button: 'はじめまして · Nice to meet you' },
    { say: 'A whole new life, and not a word of Japanese yet? Then we start with the words. Your desk is right there — tap <b>Begin studying</b>.',
      target: s => focusOn(s, 0, '#pc-help'), done: s => !s.resting },
    { say: 'See the bar filling? That’s you, studying. You’ll keep at it on your own — but if you tap <b>Help</b>, you’ll get through it faster.',
      target: s => focusOn(s, 0, '#pc-help'), done: s => s.stations[0].cycles >= 3,
      progress: s => Math.min(3, s.stations[0].cycles) + ' of 3 study sessions' },
    { say: 'Every session you finish earns experience — the ✦ number at the top. Spend a little on your study corner: tap <b>Improve</b>.',
      target: s => focusOn(s, 0, '#pc-improve'), done: s => s.stations[0].level >= 2 },
    { say: 'That bar at the bottom of the street is your purpose for today. When it glows gold, tap it to collect.',
      target: () => onTown('#goal-chip'), done: s => s.quest >= 1 },
    { say: 'Now — I’ve brought you something. Come and say hello: tap me, there by your door.',
      target: () => onTown('.person-pin[data-person="sato"]'), done: s => (s.stories.sato || 0) >= 1, low: true },
    { say: 'Studying alone is good; practicing is better. Open <b>Learn</b> and try the first lesson. There’s no penalty for mistakes — I make plenty.',
      target: () => document.body.dataset.tab === 'learn' ? '[data-lesson="0"]' : '.tabs [data-tab="learn"]',
      done: s => Object.keys(s.lessons).length >= 1 },
    { say: 'A few words is enough to go shopping. The corner shop opens once you have <b>5 Japanese</b> and a little experience. Then tap it in the row of places.',
      target: s => focusOn(s, 1, '#pc-unlock'),
      done: s => s.stations[1].level > 0,
      progress: s => 'あ ' + Math.floor(Math.min(5, s.jp)) + ' / 5 · ✦ ' + A.num(Math.min(s.xp, E.ACTIVITIES[1].cost)) + ' / ' + E.ACTIVITIES[1].cost },
    { say: 'You can only be in one place at a time. But a good habit keeps going while you’re out — and while you’re away. Go home and start a <b>∞ Routine</b> for your studies.',
      target: s => focusOn(s, 0, '#pc-auto'), done: s => s.stations.some(x => x.auto),
      progress: s => '✦ ' + A.num(Math.min(s.xp, E.autoCost(0))) + ' / ' + A.num(E.autoCost(0)) + ' for the routine' },
    { say: 'That’s the rhythm of it: work, improve, learn, and make friends. The bar at the bottom will show you what comes next. I’ll be downstairs — and I warn you, my garden is growing far too many cucumbers.',
      button: 'ありがとうございます · Thank you' }
  ];

  // Point at a button on a place's card, or at the place itself in the row if you're elsewhere.
  function focusOn(s, place, selector) {
    if (document.body.dataset.tab !== 'town') return '.tabs [data-tab="town"]';
    const selected = A.selected();
    if (selected !== place) return `.strip-place[data-place="${place}"]`;
    return selector;
  }
  function onTown(selector) {
    if (document.body.dataset.tab !== 'town') return '.tabs [data-tab="town"]';
    return selector;
  }

  let tour = false, shownStep = -1, lastTarget = null;

  function card() {
    let el = $('#coach');
    if (!el) {
      el = document.createElement('section');
      el.id = 'coach';
      el.className = 'coach';
      el.setAttribute('aria-live', 'polite');
      $('#app').append(el);
    }
    return el;
  }
  function finish() {
    const s = A.s;
    tour = false;
    s.tutorial = DONE;
    if (s.resting) E.start(s, s.focus);
    A.save();
    hide();
    A.render();
  }
  function hide() {
    $('#coach')?.remove();
    clearTarget();
    shownStep = -1;
  }
  function clearTarget() {
    lastTarget?.classList.remove('coach-target');
    lastTarget = null;
  }
  function next() {
    const s = A.s;
    window.Sound?.play('page');
    s.tutorial++;
    if (s.tutorial >= STEPS.length) return finish();
    A.save();
    tick();
  }

  function show(step) {
    const s = A.s, st = STEPS[step];
    const el = card();
    const action = st.button || (tour ? 'Next' : '');
    el.innerHTML = `<span class="portrait portrait-sato coach-portrait"></span>
      <div class="coach-body">
        <div class="coach-top"><small class="coach-name">Mrs. Sato <span lang="ja">佐藤さん</span> · ${step + 1}/${STEPS.length}</small><button class="coach-skip" id="coach-skip">${tour ? 'Close' : 'Skip'}</button></div>
        <p>${st.say}</p>
        <small class="coach-progress" id="coach-progress"></small>
        ${action ? `<div class="coach-actions"><button class="coach-next" id="coach-next">${esc(action)}</button></div>` : ''}
      </div>`;
    el.querySelector('#coach-next')?.addEventListener('click', next);
    el.querySelector('#coach-skip').addEventListener('click', () => {
      if (tour) return finish();
      A.openModal({
        label: 'Skip the welcome',
        html: `<h2>Skip Mrs. Sato’s welcome?</h2><p>You can replay it any time from Settings.</p><div class="row"><button class="btn-quiet" data-close>Keep going</button><button class="btn-primary" id="skip-yes">Skip</button></div>`,
        bind: m => { m.querySelector('[data-close]').onclick = A.closeModal; m.querySelector('#skip-yes').onclick = () => { A.closeModal(); finish(); }; }
      });
    });
    if (step === 0) window.Sound?.play('open');
    shownStep = step;
  }

  function tick() {
    const s = A.s;
    if (!s.started || s.tutorial >= DONE) { if (shownStep >= 0 || $('#coach')) hide(); return; }
    // Popups take the floor; Mrs. Sato waits politely.
    if (document.querySelector('.modal')) { card().classList.add('waiting'); clearTarget(); return; }
    // Steps already done (or done while she was talking) move on by themselves.
    let step = s.tutorial;
    while (!tour && step < STEPS.length && STEPS[step].done?.(s)) step++;
    if (step >= STEPS.length) return finish();
    if (step !== s.tutorial) { s.tutorial = step; window.Sound?.play('correct'); A.save(); }
    if (step !== shownStep) show(step);
    const el = card();
    el.classList.remove('waiting');
    const st = STEPS[step];
    const prog = el.querySelector('#coach-progress');
    if (prog) prog.textContent = st.progress && !tour ? st.progress(s) : '';
    // Keep the card clear of the header — or, when she points into the town, low down
    // so the street stays visible.
    const hud = $('.hud'), placeCard = $('#place-card');
    if (hud && window.innerWidth < 900) {
      const low = st.low && document.body.dataset.tab === 'town' && placeCard;
      el.style.top = Math.round(low ? placeCard.getBoundingClientRect().top - el.offsetHeight - 6 : hud.getBoundingClientRect().bottom + 4) + 'px';
    }
    // Glow on whatever she is pointing at.
    const sel = !tour && st.target?.(s);
    const target = sel ? $(sel) : null;
    if (target !== lastTarget) { clearTarget(); if (target) { target.classList.add('coach-target'); lastTarget = target; } }
  }

  A.tutorial = {
    tick,
    STEPS,
    // Replay as a guided tour: every step has a Next button and nothing needs doing.
    replay() { A.s.tutorial = 0; tour = true; shownStep = -1; tick(); }
  };
})();
