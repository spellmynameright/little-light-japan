// A Little Light — the game interface.
// Owns the save, the clock, the HUD, the place card, and every popup.
// The Learn / People / Journey tabs are drawn by panels.js through window.App.
(function () {
  'use strict';
  const E = window.Idle, C = window.Content, J = window.Journey, Sound = window.Sound;
  const KEY = 'little-light-japan-v2';
  const $ = q => document.querySelector(q), $$ = q => [...document.querySelectorAll(q)];
  const esc = x => String(x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  // What each place is for, in words.
  const PLACES = [
    { kicker: 'Your apartment', title: 'A few words open doors.', purpose: 'Study a little every day. Signs, menus and neighbors slowly start to make sense.', action: 'Write the next kana', verb: 'Studying Japanese', improve: 'Improve your study corner', auto: 'Build a daily study habit', result: 'Japanese', room: 'Home' },
    { kicker: 'The corner shop', title: 'Learn the everyday.', purpose: 'Shop locally, sort the recycling, and learn the routines that help you care for the place you live.', action: 'Read the next label', verb: 'Running errands', improve: 'Learn a better route', auto: 'Plan a regular errand route', result: 'culture', room: 'Shop' },
    { kicker: 'Café Hidamari', title: 'Become a familiar face.', purpose: 'Practice greetings over tea. Learn names, remember stories, and make time for friendship.', action: 'Practice a greeting', verb: 'Having tea with neighbors', improve: 'Make more time for conversation', auto: 'Arrange a regular tea time', result: 'connection', room: 'Café' },
    { kicker: 'The community hall', title: 'Teach a little. Learn a lot.', purpose: 'Neighbors practice English while they help you with Japanese. Both sides have something to give.', action: 'Practice the next phrase', verb: 'Language exchange', improve: 'Prepare better lessons', auto: 'Organize a weekly exchange', result: 'Japanese', room: 'Hall' },
    { kicker: 'Everyone’s dining room', title: 'There is room at the table.', purpose: 'Cook and eat together. A meal is an invitation to belong — and nobody has to earn their seat.', action: 'Prepare the next plate', verb: 'Cooking a shared supper', improve: 'Equip the kitchen', auto: 'Share the cooking rota', result: 'connection', room: 'Table' },
    { kicker: 'The reading room', title: 'Stories are windows.', purpose: 'Read with children and neighbors, share questions, and discover what matters to one another.', action: 'Read the next page', verb: 'Reading together', improve: 'Grow the neighborhood library', auto: 'Start a reading circle', result: 'culture', room: 'Books' },
    { kicker: 'The community garden', title: 'Tend something together.', purpose: 'Grow vegetables with your neighbors. Share the work, the waiting, and eventually the harvest.', action: 'Water the next seedling', verb: 'Tending the garden', improve: 'Improve the garden beds', auto: 'Form a garden team', result: 'culture', room: 'Garden' },
    { kicker: 'Everyone’s house', title: 'A church with an open door.', purpose: 'Make room for prayer, shared meals, honest questions, and neighbors caring for one another.', action: 'Set out another cushion', verb: 'Opening the house', improve: 'Make more room', auto: 'Share the life of the house', result: 'connection', room: 'House' }
  ];
  const SIDE_NAME = { jp: 'Japanese', culture: 'culture', bonds: 'connection' };
  const COATS = [['#6e9275', 'Sage'], ['#648ca8', 'Blue'], ['#b98165', 'Terracotta'], ['#9b83ab', 'Lavender']];

  // ——— Load ———
  let s = E.fresh(), tab = 'town', selected = 0, buyMode = '1', last = Date.now(), storageOK = true, returning = false, priorRevision = E.REVISION;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      s = E.hydrate(parsed);
      priorRevision = parsed.revision;
      returning = parsed.started && parsed.revision < E.REVISION;
    } else {
      const old = localStorage.getItem('little-light-japan-v1');
      if (old) { s = E.migrate(JSON.parse(old)); returning = true; }
    }
  } catch { storageOK = false; }
  s.revision = E.REVISION;
  Sound.enabled = s.sound;
  selected = s.focus || 0;
  E.resume(s);
  document.body.classList.toggle('reduce-motion', s.reducedMotion);

  function advance(now = Date.now()) {
    const dt = Math.max(0, (now - last) / 1000);
    last = now;
    if (s.started) E.step(s, dt);
  }
  function save() {
    advance();
    s.last = last;
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
      storageOK = true;
    } catch { storageOK = false; }
  }

  // ——— Formatting ———
  const UNITS = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
  function num(n) {
    if (!Number.isFinite(n)) return '∞';
    if (n < 1000) return Math.floor(n).toLocaleString('en-US');
    const k = Math.floor(Math.log10(n) / 3);
    if (k >= UNITS.length) return n.toExponential(2);
    const v = n / Math.pow(1000, k);
    return (v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : v.toFixed(0)).replace(/\.0+$/, '').replace(/(\.\d)0$/, '$1') + UNITS[k];
  }
  function small(n) { return n >= 100 ? num(n) : n >= 10 ? n.toFixed(1) : n.toFixed(2); }
  function secs(n) { return n >= 60 ? Math.floor(n / 60) + 'm ' + String(Math.floor(n % 60)).padStart(2, '0') + 's' : n.toFixed(1) + 's'; }

  // ——— Toasts ———
  let toastTimer;
  function toast(text, kind = '') {
    const t = $('#toast');
    t.textContent = text;
    t.className = 'toast show ' + kind;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = 'toast'; }, 3200);
  }
  function log(text, kind) {
    s.journal.unshift({ time: s.time, text, ...(kind ? { kind } : {}) });
    s.journal = s.journal.slice(0, 80);
  }

  // ——— Popups, one at a time ———
  const pending = [];
  let modalOpen = null, previousFocus = null;
  function openModal(spec) {
    if (modalOpen) { pending.push(spec); return; }
    modalOpen = spec;
    previousFocus = document.activeElement;
    const closable = spec.closable !== false;
    $('#modal-root').innerHTML = `<div class="modal-backdrop ${spec.cls || ''}"><section class="modal" tabindex="-1" role="dialog" aria-modal="true" aria-label="${esc(spec.label || 'A Little Light')}">${closable ? '<button class="modal-close" aria-label="Close">×</button>' : ''}<div class="modal-body">${spec.html}</div></section></div>`;
    const el = $('#modal-root .modal');
    if (closable) {
      el.querySelector('.modal-close').onclick = () => closeModal();
      $('#modal-root .modal-backdrop').onclick = e => { if (e.target === e.currentTarget) closeModal(); };
    }
    spec.bind?.(el);
    // Focus the dialog itself: focusing a text box would pop up the phone keyboard.
    (el.querySelector('[autofocus]') || el).focus({ preventScroll: true });
  }
  function closeModal() {
    const spec = modalOpen;
    $('#modal-root').innerHTML = '';
    modalOpen = null;
    spec?.onClose?.();
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    const next = pending.shift();
    if (next) openModal(next);
    else render();
  }
  function setModal(html, bind) {
    const body = $('#modal-root .modal-body');
    if (!body) return;
    body.innerHTML = html;
    bind?.($('#modal-root .modal'));
    body.scrollTop = 0;
  }

  function portrait(id, cls = '') {
    const p = C.PEOPLE.find(x => x.id === id);
    if (id === 'player' || p) return `<span class="portrait portrait-${id} ${cls}" role="img" aria-label="${esc(p?.name || 'You')}"></span>`;
    return '';
  }
  function seal(local, cls = '') {
    return `<span class="seal ${cls}" style="--accent:${local.color}" aria-hidden="true">${local.seal}</span>`;
  }
  function chips(gains) {
    return Object.entries(gains).filter(([, v]) => v).map(([k, v]) => `<span class="gain gain-${k}">+${typeof v === 'number' && v >= 1000 ? num(v) : v} ${k === 'xp' ? 'XP' : SIDE_NAME[k]}</span>`).join('');
  }

  // ——— HUD ———
  function hud() {
    $('#xp').textContent = num(s.xp);
    $('#rate').textContent = '+' + num(E.rate(s)) + ' / sec';
    $('#jp').textContent = num(s.jp);
    $('#culture').textContent = num(s.culture);
    $('#bonds').textContent = num(s.bonds);
    const city = E.CITIES[s.city];
    $('#city-name').textContent = city.name;
    $('#where-line').textContent = city.district + ' · ' + timeWord() + ' · ' + city.season.split(' · ')[0].toLowerCase();
    goalChip();
    dots();
  }
  function timeWord() {
    if (s.clock === 'day') return 'daytime';
    const h = new Date().getHours();
    return h < 5 ? 'night' : h < 11 ? 'morning' : h < 17 ? 'afternoon' : h < 20 ? 'evening' : 'night';
  }
  function goalChip() {
    const g = E.goal(s), chip = $('#goal-chip');
    if (!g) {
      const h = E.handover(s), done = Object.values(h).filter(Boolean).length;
      chip.classList.toggle('ready', E.ready(s));
      $('#goal-kicker').textContent = E.complete(s) ? 'Five cities. A life shared.' : 'Prepare to entrust the church';
      $('#goal-title').textContent = E.complete(s) ? 'The light stays on' : E.ready(s) ? 'Ready — open Journey' : done + ' of 4 steps ready';
      $('#goal-fill').style.width = (E.complete(s) ? 100 : done * 25) + '%';
      return;
    }
    const v = Math.min(g.value(s), g.target), ready = v >= g.target;
    chip.classList.toggle('ready', ready);
    $('#goal-kicker').textContent = ready ? 'Tap to claim · +' + num(E.goalReward(s)) + ' XP' : 'A purpose for today · ' + (s.quest + 1) + '/' + E.GOALS.length;
    $('#goal-title').textContent = g.title;
    $('#goal-fill').style.width = (v / g.target) * 100 + '%';
  }
  function claimGoal() {
    advance();
    const g = E.goal(s);
    if (!g) { selectTab('journey'); return; }
    if (g.value(s) < g.target) { toast('Keep going: ' + g.title.toLowerCase() + '.'); return; }
    const reward = E.claimGoal(s);
    if (!reward) return;
    Sound.play('goal');
    window.WorldView?.reward('+' + num(reward) + ' XP', 'gold');
    toast('Purpose fulfilled · +' + num(reward) + ' XP', 'gold');
    save();
    render();
  }
  function dots() {
    $('#dot-learn').hidden = !(learnNews());
    $('#dot-people').hidden = !(C.PEOPLE.some(p => personReady(p.id)) || [0, 1, 2].some(i => personReady('local' + i)));
    $('#dot-journey').hidden = !(E.projectReady(s) || E.projectCanStart(s) || E.ready(s));
  }
  function learnNews() {
    return C.LESSONS.some((l, i) => E.lessonOpen(s, i) && !s.lessons[l.id]) || J.situations.some((q, i) => E.situationOpen(s, i) && !s.situations.includes(i));
  }

  // ——— The place card ———
  let cardKey = '';
  function placeCard() {
    const i = selected, st = s.stations[i], a = E.ACTIVITIES[i], p = PLACES[i];
    const owned = st.level > 0;
    const boost = E.BOOSTS.find(b => b.target === i || b.home === i);
    const key = [i, owned, st.auto, s.city, boost && s.upgrades.includes(boost.id), buyMode, cardOpen, s.jp >= a.needs[0]].join('|');
    if (key !== cardKey) {
      cardKey = key;
      $('#place-card').innerHTML = owned ? ownedCard(i) : lockedCard(i);
      bindCard();
    }
    syncCard();
  }
  let cardOpen = window.innerWidth >= 900;
  function placeName(i) { return s.jp >= E.ACTIVITIES[i].needs[0] ? E.ACTIVITIES[i].name : E.ACTIVITIES[i].jp; }
  function strip() {
    return `<div class="strip" role="tablist" aria-label="Places">${E.ACTIVITIES.map((a, i) => `<button class="strip-place" data-place="${i}" role="tab" aria-label="${esc(placeName(i))}"><span class="strip-icon">${a.icon}</span><small class="strip-status"></small></button>`).join('')}</div>`;
  }
  function ownedCard(i) {
    const st = s.stations[i], a = E.ACTIVITIES[i], p = PLACES[i];
    const boost = E.BOOSTS.find(b => b.target === i || b.home === i);
    return `
      <div class="pc-head">
        <span class="pc-icon" style="--accent:${a.color}">${a.icon}</span>
        <div class="pc-title"><small>${esc(p.kicker)} · <span lang="ja">${esc(a.jp)}</span></small><h2>${esc(placeName(i))}</h2></div>
        <span class="pc-level" id="pc-level"></span>
      </div>
      <div class="pc-progress"><i id="pc-fill"></i><span id="pc-verb">${esc(p.verb)}</span><span id="pc-yield"></span></div>
      <div class="pc-actions">
        <button class="btn-help" id="pc-help"><span>${esc(p.action)}</span><small id="pc-help-sub">Tap to help</small></button>
        <button class="btn-improve" id="pc-improve"><span>Improve <em id="pc-qty"></em></span><small id="pc-price"></small></button>
      </div>
      <div class="pc-extras">
        ${st.auto ? `<span class="pc-tag done">∞ Routine running</span>` : `<button class="pc-tag" id="pc-auto"><b>∞ Routine</b><small id="pc-auto-price"></small></button>`}
        ${boost ? (s.upgrades.includes(boost.id) ? `<span class="pc-tag done">${boost.icon} ${esc(boost.name)}</span>` : `<button class="pc-tag" id="pc-boost" data-upgrade="${boost.id}"><b>${boost.icon} ${esc(boost.name)}</b><small>${esc(boost.desc.replace(/^.* earns? /, ''))} · ${num(boost.cost)}</small></button>`) : ''}
        <button class="pc-more" id="pc-more" aria-expanded="${cardOpen}" aria-label="${cardOpen ? 'Fewer details' : 'More details'}">${cardOpen ? '⌃' : '⋯'}</button>
      </div>
      ${cardOpen ? `<div class="pc-details">
        <p>${esc(p.purpose)}</p>
        <p class="pc-mile">${st.auto ? '∞ ' + esc(a.mentor) + ' keeps this going while you are elsewhere.' : '∞ ' + esc(p.auto) + ': this place keeps going while you are elsewhere, and while you are away.'}${boost ? ' ' + boost.icon + ' ' + esc(boost.name) + ': ' + esc(boost.desc) + '.' : ''}</p>
        <div class="buy-modes" role="group" aria-label="How many levels to buy">${['1', '10', 'max'].map(n => `<button data-mode="${n}" class="${n === buyMode ? 'active' : ''}">${n === 'max' ? 'Max' : '×' + n}</button>`).join('')}</div>
        <p class="pc-mile" id="pc-mile"></p>
        <p class="pc-project" id="pc-project" hidden></p>
      </div>` : ''}
      ${strip()}`;
  }
  function lockedCard(i) {
    const a = E.ACTIVITIES[i], p = PLACES[i];
    const names = ['Japanese', 'culture', 'connection'], icons = ['あ', '❀', '♡'];
    return `
      <div class="pc-head">
        <span class="pc-icon locked">${a.icon}</span>
        <div class="pc-title"><small>${esc(p.kicker)}</small><h2>${esc(placeName(i))}</h2></div>
        <span class="pc-level">準備中</span>
      </div>
      <p class="pc-purpose">${esc(s.jp >= a.needs[0] ? p.purpose : 'You can’t read the sign yet. Learn a little more Japanese to find out what happens here.')}</p>
      <div class="needs">${a.needs.map((v, k) => v ? `<span class="need" data-need="${k}">${icons[k]} ${v} ${names[k]}</span>` : '').join('')}${i ? `<span class="need" id="need-prev">${esc(PLACES[i - 1].room)} first</span>` : ''}</div>
      <div class="pc-actions single"><button class="btn-help" id="pc-unlock"><span>Begin here</span><small>${num(a.cost)} XP</small></button></div>
      ${strip()}`;
  }
  function bindCard() {
    $$('#place-card [data-place]').forEach(b => b.onclick = () => selectPlace(Number(b.dataset.place)));
    $('#pc-help')?.addEventListener('click', helpTap);
    $('#pc-improve')?.addEventListener('click', improve);
    $('#pc-auto')?.addEventListener('click', automate);
    $('#pc-boost')?.addEventListener('click', e => buyBoost(e.currentTarget.dataset.upgrade));
    $('#pc-unlock')?.addEventListener('click', unlock);
    $('#pc-more')?.addEventListener('click', () => { cardOpen = !cardOpen; placeCard(); });
    $$('#place-card [data-mode]').forEach(b => b.onclick = () => { buyMode = b.dataset.mode; placeCard(); });
  }
  function syncCard() {
    const i = selected, st = s.stations[i], a = E.ACTIVITIES[i];
    $$('#place-card .strip-place').forEach(b => {
      const k = Number(b.dataset.place), x = s.stations[k];
      const ready = !x.level && E.accessible(s, k) && s.xp >= E.ACTIVITIES[k].cost;
      b.classList.toggle('selected', k === i);
      b.classList.toggle('locked', !x.level);
      b.classList.toggle('ready', ready);
      b.classList.toggle('focus', k === s.focus && x.level > 0);
      b.querySelector('.strip-status').textContent = x.level ? (x.auto ? '∞' : x.level) : ready ? 'new' : '·';
    });
    if (!st.level) {
      $$('#place-card [data-need]').forEach(el => { const k = Number(el.dataset.need); el.classList.toggle('met', s[['jp', 'culture', 'bonds'][k]] >= a.needs[k]); });
      $('#need-prev')?.classList.toggle('met', s.stations[i - 1].level > 0);
      const b = $('#pc-unlock');
      if (b) b.disabled = !s.started || !E.accessible(s, i) || s.xp < a.cost;
      return;
    }
    const dur = E.duration(s, i), n = E.quantity(s, i, buyMode), qty = buyMode === 'max' ? Math.max(1, n) : Number(buyMode);
    const price = E.price(s, i, qty);
    $('#pc-level').textContent = 'Lv ' + st.level;
    $('#pc-fill').style.width = (st.running ? st.progress / dur : 0) * 100 + '%';
    $('#pc-yield').textContent = '+' + num(E.payout(s, i)) + ' XP · +' + small(E.sideGain(s, i)) + ' ' + PLACES[i].result;
    const focused = i === s.focus;
    $('#pc-verb').textContent = focused ? secs(Math.max(0, dur - st.progress)) + ' · ' + PLACES[i].verb : st.auto ? 'Your routine is running here' : 'Tap Help to work here';
    $('#pc-help-sub').textContent = focused ? 'Tap to help · +' + E.HELP_SECONDS + 's' : 'Go here and help';
    $('#pc-qty').textContent = buyMode === 'max' ? '×' + n : buyMode === '10' ? '×10' : '';
    $('#pc-price').textContent = st.level >= E.MAX_LEVEL ? 'Fully improved' : num(price) + ' XP';
    $('#pc-improve').disabled = st.level >= E.MAX_LEVEL || n < 1 || s.xp < price;
    const auto = $('#pc-auto');
    if (auto) { auto.disabled = s.xp < E.autoCost(i); $('#pc-auto-price').textContent = num(E.autoCost(i)) + ' XP · runs without you'; }
    const boost = $('#pc-boost');
    if (boost) { const b = E.BOOSTS.find(x => x.id === boost.dataset.upgrade); boost.disabled = s.xp < b.cost; }
    const mile = $('#pc-mile');
    if (mile) {
      const next = E.nextMark(st.level);
      mile.textContent = next ? 'Level ' + next + ': production ×2' + ([25, 100].includes(next) ? ' and twice as fast' : '') + '. New things appear at levels 10, 25, 50 and 100.' : 'Every milestone reached.';
      const task = E.projectProgress(s).find(t => t.i === i);
      const pj = $('#pc-project');
      pj.hidden = !s.projectActive || !task;
      if (task) pj.textContent = 'Helping with “' + E.project(s).name + '”: ' + task.done + ' / ' + task.target + ' ' + task.label;
    }
  }

  // ——— Actions ———
  let lastTap = 0;
  function helpTap() {
    if (!s.started) return;
    if (selected !== s.focus && s.stations[selected].level) { selectPlace(selected); return; }
    if (Date.now() - lastTap < 80) return;
    lastTap = Date.now();
    Sound.unlock();
    advance();
    const r = E.assist(s);
    window.WorldView?.assist();
    if (r.xp) {
      window.WorldView?.reward('+' + num(r.xp) + ' XP', 'xp');
      Sound.play('cycle', s.focus);
    } else Sound.play('help', s.focus);
    const b = $('#pc-help');
    if (b) { b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse'); }
    hud();
    syncCard();
  }
  function improve() {
    advance();
    const i = selected, before = E.marks(s.stations[i].level), lvl = s.stations[i].level;
    if (!E.buy(s, i, buyMode === 'max' ? 'max' : buyMode)) return;
    const after = s.stations[i].level;
    if (E.marks(after) > before) {
      Sound.play('milestone');
      toast('Milestone! ' + placeName(i) + ' now produces twice as much.', 'gold');
      window.WorldView?.celebrate(i, 'Milestone ×2', 'gold');
    } else {
      Sound.play('buy');
      if ([10, 25, 50, 100].some(m => lvl < m && after >= m)) window.WorldView?.celebrate(i, 'Something new appears', 'gold');
      else window.WorldView?.celebrate(i, 'Lv ' + after);
    }
    save();
    render();
  }
  function automate() {
    advance();
    if (!E.automate(s, selected)) return;
    Sound.play('unlock');
    toast(PLACES[selected].auto + ' — it keeps going while you are elsewhere.', 'gold');
    log('A routine took root: ' + PLACES[selected].auto.toLowerCase() + '.');
    window.WorldView?.celebrate(selected, '∞ Routine', 'gold');
    save();
    render();
  }
  function buyBoost(id) {
    advance();
    if (!E.upgrade(s, id)) return;
    const b = E.BOOSTS.find(x => x.id === id);
    Sound.play('unlock');
    toast(b.name + ': ' + b.desc + '.', 'gold');
    window.WorldView?.celebrate(selected, b.icon + ' ' + b.name, 'gold');
    save();
    render();
  }
  function unlock() {
    advance();
    const i = selected;
    if (!E.buy(s, i, '1')) return;
    E.start(s, i);
    Sound.play('unlock');
    log('A new part of life: ' + E.ACTIVITIES[i].name.toLowerCase() + '.');
    window.WorldView?.celebrate(i, 'Open!', 'gold');
    toast(E.ACTIVITIES[i].name + ' is open. You head over.', 'gold');
    save();
    render();
  }
  function selectPlace(i) {
    if (!Number.isInteger(i) || i < 0 || i > 7) return;
    advance();
    if (selected !== i) Sound.play('page');
    selected = i;
    if (s.stations[i].level && s.started) E.start(s, i);
    if (tab !== 'town') selectTab('town');
    if (window.WorldView?.mode() === 'town' && window.innerWidth < 900) { window.WorldView.setMode('close'); viewToggleLabel(); }
    save();
    render();
  }

  // ——— Tabs ———
  function selectTab(t) {
    tab = t;
    document.body.dataset.tab = t;
    $$('.tabs [data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === t));
    $('#panel').hidden = t === 'town';
    render();
    if (t !== 'town') $('#panel').scrollTop = 0;
  }
  function render() {
    hud();
    placeCard();
    if (tab !== 'town') window.App.panels[tab]?.($('#panel-inner'));
  }
  function viewToggleLabel() {
    const town = window.WorldView?.mode() === 'town';
    const b = $('#view-toggle');
    b.textContent = town ? '⌖' : '⤢';
    b.title = town ? 'Look inside the current place' : 'See the whole neighborhood';
    b.setAttribute('aria-label', b.title);
  }

  // ——— Neighbors and local leaders ———
  function local(i) { return E.CITIES[s.city].locals[i]; }
  function personReady(id) {
    if (!s.started) return false;
    if (id.startsWith('local')) {
      const i = Number(id.slice(5)), e = s.elders[i];
      if (!e || !E.localPresent(s, i)) return false;
      return !e.met || e.read < e.training || (e.training === 3 && !e.appointed);
    }
    return s.city === 0 && E.storyReady(s, id);
  }
  function personInfo(id) {
    if (id.startsWith('local')) {
      const i = Number(id.slice(5)), l = local(i), e = s.elders[i];
      return { key: id + s.city + e.met + e.read + e.training, seal: l.seal, color: l.color, badge: !e.met ? '!' : '✦', label: (e.met ? 'Talk with ' : 'Meet ') + l.name };
    }
    return { key: id, portrait: true, badge: '✦', label: 'A story with ' + E.person(id).name };
  }
  function visit(id) {
    advance();
    Sound.unlock();
    if (id.startsWith('local')) return talkLocal(Number(id.slice(5)));
    const p = E.person(id);
    if (!p) return;
    if (s.jp < p.needs) { toast('Learn a little more Japanese to meet ' + p.name + ' (' + p.needs + ' insight).'); return; }
    if (E.storyReady(s, id)) return story(id);
    const wait = E.visitWait(s, id);
    if (wait > 0) { toast(p.name + ' is busy. Come back in ' + wait + 's.'); return; }
    const moment = E.visit(s, id);
    if (!moment) return;
    Sound.play('open');
    save();
    const far = s.city !== 0;
    openModal({
      label: p.name,
      html: `<div class="who">${portrait(id, 'who-portrait')}<div><small>${esc(p.role)}</small><h2>${esc(p.name)}</h2></div></div>
        ${far ? '<p class="aside">A weekend back in Hanamimachi.</p>' : ''}
        <p class="moment">${esc(moment.text)}</p>
        <div class="gains">${chips({ bonds: moment.bonds })}</div>
        <p class="aside">${nextStoryHint(id)}</p>
        <button class="btn-primary" data-close>Until next time</button>`,
      bind: el => el.querySelector('[data-close]').onclick = closeModal
    });
  }
  function nextStoryHint(id) {
    const stage = s.stories[id] || 0;
    if (stage >= 4) return 'You have shared all of ' + E.person(id).name + '’s stories. The friendship goes on.';
    return 'Next story at ' + C.STORY_AT[stage] + ' connection (you have ' + Math.floor(s.bonds) + ').';
  }
  // Japanese phrase with as much meaning as you can follow.
  function phrase(jp, en, at) {
    const words = C.WORDS.map((w, i) => ({ w, i })).filter(x => jp.includes(x.w[0]));
    const known = words.filter(x => s.learned.includes(x.i) || s.jp >= x.w[3]);
    const full = s.jp >= at || (words.length && known.length === words.length);
    return `<div class="phrase"><span lang="ja">${esc(jp)}</span><small>${full ? esc(en) : known.length ? 'You catch: ' + known.map(x => '<b>' + esc(x.w[0]) + '</b> “' + esc(x.w[2].toLowerCase()) + '”').join(', ') : 'The words are still unfamiliar. The warmth is not.'}</small></div>`;
  }
  function story(id) {
    const p = E.person(id), stage = s.stories[id] || 0, st = C.stories[id][stage];
    const echo = E.storyEcho(s, id, stage);
    Sound.play('story');
    openModal({
      label: st.title, cls: 'story',
      html: `<div class="who">${portrait(id, 'who-portrait')}<div><small>${esc(p.role)} · story ${stage + 1} of 4</small><h2>${esc(p.name)}</h2></div></div>
        ${s.city !== 0 ? '<p class="aside">A weekend back in Hanamimachi.</p>' : ''}
        <h3 class="story-title">${esc(st.title)}</h3>
        ${phrase(st.jp, st.en, st.at)}
        ${echo ? `<p class="echo">${esc(echo)}</p>` : ''}
        <p class="story-text">${esc(st.text)}</p>
        <div class="choices">${st.choices.map((c, i) => `<button class="choice" data-choice="${i}">${esc(c)}<small>${chips(st.gains?.[i] || {})}</small></button>`).join('')}</div>`,
      bind: el => el.querySelectorAll('[data-choice]').forEach(b => b.onclick = () => {
        advance();
        const r = E.chooseStory(s, id, Number(b.dataset.choice));
        if (!r) return;
        log(p.name + ' · ' + st.title + ' — ' + r.response, 'story');
        Sound.play('correct');
        save();
        const done = (s.stories[id] || 0) >= 4;
        setModal(`<div class="who">${portrait(id, 'who-portrait')}<div><small>${esc(p.role)}</small><h2>${esc(p.name)}</h2></div></div>
          <h3 class="story-title">${esc(st.title)}</h3>
          <p class="story-text response">${esc(r.response)}</p>
          <div class="note"><b>Culture note</b><p>${esc(st.note)}</p></div>
          <div class="gains">${chips({ ...r.gains, xp: r.xp })}</div>
          ${done ? `<div class="note gold"><b>A lasting friendship</b><p>${esc(p.partner)}.</p></div>` : `<p class="aside">${nextStoryHint(id)}</p>`}
          <button class="btn-primary" data-close>Carry this with you</button>`, el2 => el2.querySelector('[data-close]').onclick = closeModal);
      })
    });
  }
  function talkLocal(i) {
    const l = local(i), e = s.elders[i];
    if (!E.localPresent(s, i)) { toast('You haven’t met ' + l.name + ' yet. They spend time at the ' + PLACES[E.LOCAL_PLACE[i]].room.toLowerCase() + '.'); return; }
    const head = `<div class="who">${seal(l, 'who-seal')}<div><small>${esc(l.role)}</small><h2>${esc(l.name)} <span lang="ja" class="jp-name">${esc(l.jp)}</span></h2></div></div>`;
    if (!e.met) {
      E.meetLocal(s, i);
      log('Met ' + l.name + '. ' + l.meet, 'local');
      Sound.play('story');
      save();
      openModal({ label: l.name, cls: 'story', html: head + `<p class="story-text">${esc(l.meet)}</p><p class="aside">${esc(l.bio)}</p><div class="gains">${chips({ bonds: 3 })}</div><p class="aside">When the table is open, you can begin mentoring ${esc(l.name)} from the People tab.</p><button class="btn-primary" data-close>Glad to know you</button>`, bind: el => el.querySelector('[data-close]').onclick = closeModal });
      return;
    }
    if (e.read < e.training) {
      const text = l.stages[e.read];
      E.readElder(s, i);
      log(l.name + ': ' + text, 'local');
      Sound.play('story');
      save();
      const stageName = ['Listening and character', 'Shared care', 'Teaching and discernment'][e.read - 1];
      openModal({ label: l.name, cls: 'story', html: head + `<small class="kicker">Mentoring · ${stageName}</small><p class="story-text">${esc(text)}</p><p class="aside">${e.training < 3 ? 'You can begin the next stage of mentoring in the People tab.' : 'Pray, and when the time is right, appoint ' + esc(l.name) + ' as an elder.'}</p><button class="btn-primary" data-close>Continue</button>`, bind: el => el.querySelector('[data-close]').onclick = closeModal });
      return;
    }
    if (e.training === 3 && !e.appointed) return appointLocal(i);
    selectTab('people');
  }
  function appointLocal(i) {
    const l = local(i);
    openModal({
      label: 'Appoint ' + l.name, cls: 'story',
      html: `<div class="who">${seal(l, 'who-seal')}<div><small>${esc(l.role)}</small><h2>${esc(l.name)}</h2></div></div>
        <p class="story-text">The church gathers. Some people pray aloud; most pray quietly. Hands are laid gently on ${esc(l.name)}’s shoulders. Nobody is pretending this is a promotion. It is a trust.</p>
        <p class="aside">Elders care for the church and its people. Their value is not measured by anything in this game.</p>
        <button class="btn-primary" id="appoint-yes">Appoint ${esc(l.name)} as an elder</button>
        <button class="btn-quiet" data-close>Not yet</button>`,
      bind: el => {
        el.querySelector('[data-close]').onclick = closeModal;
        el.querySelector('#appoint-yes').onclick = () => {
          advance();
          if (!E.appoint(s, i)) return;
          log(l.name + ' was appointed as an elder. ' + l.appoint, 'elder');
          Sound.play('elder');
          save();
          setModal(`<div class="who">${seal(l, 'who-seal')}<div><small>An elder of the ${esc(E.CITIES[s.city].district)} church</small><h2>${esc(l.name)}</h2></div></div><p class="story-text">${esc(l.appoint)}</p><div class="gains"><span class="gain gain-${['jp', 'culture', 'bonds'][i]}">+20% ${['Japanese', 'culture', 'connection'][i]} gains while you are here</span></div><button class="btn-primary" data-close>Amen</button>`, el2 => el2.querySelector('[data-close]').onclick = closeModal);
        };
      }
    });
  }
  function mentor(i) {
    advance();
    if (!E.train(s, i)) return;
    Sound.play('open');
    toast('Mentoring ' + local(i).name + ' has begun. It takes time — like real mentoring.');
    save();
    render();
  }

  // ——— Lessons ———
  function voice() { return window.speechSynthesis?.getVoices?.().find(v => v.lang?.startsWith('ja')); }
  function speak(text) {
    const v = voice();
    if (!v) { toast('No Japanese voice is installed on this device.'); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP';
    u.voice = v;
    u.rate = 0.8;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function lesson(index) {
    if (!E.lessonOpen(s, index)) return;
    const L = C.LESSONS[index];
    const words = shuffle([...L.words]).slice(0, 6);
    const canListen = !!voice();
    const qs = words.map((w, n) => {
      const type = canListen && n === 4 ? 'listen' : n % 2 ? 'reverse' : 'meaning';
      const others = shuffle(C.WORDS.map((_, i) => i).filter(i => i !== w && C.WORDS[i][2] !== C.WORDS[w][2])).slice(0, 2);
      return { w, type, options: shuffle([w, ...others]) };
    });
    let q = 0, mistakes = 0, wrongHere = new Set();
    Sound.play('open');
    function question() {
      const Q = qs[q], W = C.WORDS[Q.w];
      const prompt = Q.type === 'reverse'
        ? `<div class="prompt en">${esc(W[2])}</div><small class="prompt-sub">Which is the Japanese?</small>`
        : Q.type === 'listen'
          ? `<button class="listen big" data-say="${esc(W[0])}">▷ Listen</button><small class="prompt-sub">What did you hear?</small>`
          : `<div class="prompt" lang="ja">${esc(W[0])}</div><small class="prompt-sub">${esc(W[1])} · <button class="listen" data-say="${esc(W[0])}">▷</button></small>`;
      setModal(`<small class="kicker">Lesson · ${esc(L.title)} · <span lang="ja">${esc(L.jp)}</span></small>
        <div class="dots">${qs.map((_, n) => `<i class="${n < q ? 'done' : n === q ? 'now' : ''}"></i>`).join('')}</div>
        ${prompt}
        <div class="options">${Q.options.map(o => `<button class="option" data-option="${o}" ${wrongHere.has(o) ? 'disabled' : ''}>${Q.type === 'reverse' ? `<span lang="ja">${esc(C.WORDS[o][0])}</span><small>${esc(C.WORDS[o][1])}</small>` : esc(C.WORDS[o][2])}</button>`).join('')}</div>
        <p class="feedback" id="feedback">${mistakes ? 'Mistakes are how this works. No penalty.' : 'Take your time.'}</p>`, el => {
        el.querySelectorAll('[data-say]').forEach(b => b.onclick = () => speak(b.dataset.say));
        if (Q.type === 'listen') speak(W[0]);
        el.querySelectorAll('[data-option]').forEach(b => b.onclick = () => {
          const o = Number(b.dataset.option);
          if (o !== Q.w) {
            mistakes++;
            wrongHere.add(o);
            b.disabled = true;
            b.classList.add('wrong');
            Sound.play('wrong');
            el.querySelector('#feedback').textContent = 'Not quite — that one means “' + C.WORDS[o][2] + '”.';
            return;
          }
          b.classList.add('right');
          Sound.play('correct');
          el.querySelectorAll('[data-option]').forEach(x => x.disabled = true);
          el.querySelector('#feedback').innerHTML = `<b lang="ja">${esc(W[0])}</b> · ${esc(W[1])} · ${esc(W[2])}`;
          setTimeout(() => { q++; wrongHere = new Set(); q < qs.length ? question() : finish(); }, 700);
        });
      });
    }
    function finish() {
      advance();
      const r = E.finishLesson(s, index, mistakes);
      if (!r) return closeModal();
      Sound.play('lesson');
      if (r.first) log('Finished the lesson “' + L.title + '.”', 'lesson');
      save();
      setModal(`<small class="kicker">Lesson complete</small><h2>${esc(L.title)}</h2>
        <div class="stars" aria-label="${r.stars} of 3 stars">${'★'.repeat(r.stars)}${'☆'.repeat(3 - r.stars)}</div>
        <p class="aside">${r.stars === 3 ? 'Perfect — not a single slip.' : 'Every mistake was a step. Try again any time for more stars.'}</p>
        <div class="gains">${chips({ jp: r.jp, xp: r.xp })}</div>
        ${r.newWords.length ? `<div class="word-chips">${r.newWords.map(w => `<span><b lang="ja">${esc(C.WORDS[w][0])}</b> ${esc(C.WORDS[w][2])}</span>`).join('')}</div>` : ''}
        <button class="btn-primary" data-close>Done</button>
        <button class="btn-quiet" data-again>Practice again</button>`, el => {
        el.querySelector('[data-close]').onclick = closeModal;
        el.querySelector('[data-again]').onclick = () => { closeModal(); lesson(index); };
      });
    }
    openModal({ label: 'Lesson: ' + L.title, cls: 'lesson-modal', html: '', bind: question });
  }
  function situation(i, answer, button) {
    advance();
    const q = J.situations[i];
    if (answer !== q.answer) {
      button?.classList.add('wrong');
      if (button) button.disabled = true;
      Sound.play('wrong');
      return false;
    }
    if (!E.solveSituation(s, i, answer)) return false;
    Sound.play('lesson');
    log('Understood: ' + q.jp + ' — ' + q.options[q.answer], 'lesson');
    toast('Understood! ' + q.note, 'gold');
    save();
    render();
    return true;
  }

  // ——— Community projects and the handover ———
  function projectAction() {
    advance();
    if (E.projectReady(s)) {
      const p = E.claimProject(s);
      log(p.name + '. ' + p.done, 'project');
      Sound.play('milestone');
      save();
      render();
      openModal({
        label: p.name, cls: 'story',
        html: `<small class="kicker">A project completed together</small><h2>${esc(p.name)}</h2><p class="story-text">${esc(p.done)}</p>
          <div class="gains">${chips({ xp: p.xp, [p.side]: p.amount })}<span class="gain gain-gold">+15% production in ${esc(E.CITIES[s.city].name)}</span></div>
          <p class="aside">You’ll see it in the neighborhood.</p><button class="btn-primary" data-close>See what comes next</button>`,
        bind: el => el.querySelector('[data-close]').onclick = () => { closeModal(); if (window.innerWidth < 900) selectTab('town'); }
      });
    } else if (E.startProject(s)) {
      Sound.play('open');
      toast('Project begun. Work at the places it needs.', 'gold');
      save();
      render();
    }
  }
  function entrust() {
    advance();
    if (!E.ready(s)) return;
    const city = E.CITIES[s.city], gain = E.legacyGain(s);
    const names = s.elders.map((e, i) => e.appointed ? local(i).name : null).filter(Boolean);
    const dest = E.destinations(s);
    openModal({
      label: 'Entrust the church', cls: 'story wide',
      html: `<small class="kicker">Entrust the church</small><h2>The light stays on in ${esc(city.name)}.</h2>
        <p class="story-text">${esc(names.join(' and '))} will care for the church as local elders. ${esc(city.letter)}</p>
        <div class="note gold"><b>You carry: ${esc(city.gift)}</b><p>${esc(city.effect)}</p><p>+${gain} experience root${gain > 1 ? 's' : ''} (+50% permanent XP each) · this church keeps supporting you · ×2 production for every church entrusted · all your Japanese, culture and friendships.</p></div>
        <h3>${dest[0] === -1 ? 'The five-city journey is complete.' : 'Where will you go next?'}</h3>
        <div class="destinations">${dest[0] === -1
          ? '<button class="destination" data-dest="-1"><b>Entrust this church and finish the journey</b><span>Your neighborhood stays yours to enjoy afterward.</span></button>'
          : dest.map(i => `<button class="destination" data-dest="${i}" style="--accent:${E.CITIES[i].color}"><b>${esc(E.CITIES[i].name)} <span lang="ja">${esc(E.CITIES[i].jp)}</span></b><span>${esc(E.CITIES[i].season)}</span><em>${esc(E.CITIES[i].theme)}</em><small>${esc(E.CITIES[i].tag)}</small></button>`).join('')}</div>
        <p class="aside">${dest[0] === -1 ? '' : 'Places, routines, equipment and projects begin again in the new city. Your learning, friendships and churches stay with you.'}</p>
        <button class="btn-quiet" data-close>Stay a little longer</button>`,
      bind: el => {
        el.querySelector('[data-close]').onclick = closeModal;
        el.querySelectorAll('[data-dest]').forEach(b => b.onclick = () => {
          advance();
          const d = Number(b.dataset.dest), from = s.city;
          const gained = E.prestige(s, d);
          if (!gained) return;
          log('The church in ' + E.CITIES[from].name + ' was entrusted to ' + names.join(' and ') + '. ' + E.CITIES[from].letter, 'church');
          if (d >= 0) {
            E.start(s, 0);
            selected = 0;
            cardKey = '';
          }
          save();
          closeModal();
          selectTab('town');
          window.WorldView?.setMode('close');
          if (E.complete(s)) finale();
          else arrival();
        });
      }
    });
  }
  function arrival() {
    const city = E.CITIES[s.city];
    Sound.play('city');
    log('Arrived in ' + city.name + '. ' + city.arrival, 'city');
    save();
    openModal({
      label: city.name, cls: 'story city',
      html: `<small class="kicker">${esc(city.season)}</small><h2>${esc(city.name)} <span lang="ja" class="jp-name">${esc(city.jp)}</span></h2>
        <p class="theme">${esc(city.theme)}</p><p class="story-text">${esc(city.arrival)}</p>
        <p class="aside">${esc(city.district)} · ${esc(city.tag)}. You begin again in a small apartment — but you are not the person who arrived in Tokyo.</p>
        <button class="btn-primary" data-close>Unpack</button>`,
      bind: el => el.querySelector('[data-close]').onclick = closeModal
    });
  }
  function finale() {
    s.finaleSeen = true;
    save();
    let n = 0;
    const cards = J.finale;
    Sound.play('city');
    function card() {
      if (n < cards.length) {
        const c = cards[n];
        setModal(`<small class="kicker">A Little Light · ${n + 1} / ${cards.length}</small><h2>${esc(c.title)}</h2><p class="story-text">${esc(c.text)}</p><button class="btn-primary" data-next>${n < cards.length - 1 ? 'Continue' : 'One more thing'}</button>`, el => el.querySelector('[data-next]').onclick = () => { n++; Sound.play('page'); card(); });
        return;
      }
      const elders = s.plants.reduce((k, p) => k + p.elders.length, 0);
      const stories = Object.values(s.stories).reduce((k, v) => k + v, 0);
      setModal(`<small class="kicker">The end of the first journey</small><h2>“Will you stay for tea?”</h2>
        <div class="ending-stats"><span><b>5</b>churches entrusted</span><span><b>${elders}</b>local elders</span><span><b>${s.learned.length}</b>words learned</span><span><b>${stories}</b>stories shared</span></div>
        <p class="story-text">The neighborhood is still here. The kettle is still on. You can stay as long as you like.</p>
        <button class="btn-primary" data-close>Stay a while</button>`, el => el.querySelector('[data-close]').onclick = closeModal);
    }
    openModal({ label: 'The end of the journey', cls: 'story finale', closable: false, html: '', bind: card });
  }

  // ——— Settings ———
  function settings() {
    openModal({
      label: 'Settings',
      html: `<small class="kicker">Your life in Japan</small><h2>Settings</h2>
        <div class="profile">${portrait('player', 'who-portrait')}<div>
          <label for="profile-name">Your name</label><input id="profile-name" maxlength="24" value="${esc(s.name)}" autocomplete="off">
          <div class="coats" role="group" aria-label="Jacket colour">${COATS.map(([c, n]) => `<button data-coat="${c}" style="--c:${c}" class="${s.coat === c ? 'chosen' : ''}" aria-label="${n} jacket"></button>`).join('')}</div>
        </div></div>
        <div class="toggles">
          <label><input type="checkbox" id="opt-sound" ${s.sound ? 'checked' : ''}> Sound</label>
          <label><input type="checkbox" id="opt-clock" ${s.clock === 'local' ? 'checked' : ''}> Follow my clock (evenings bring lamplight)</label>
          <label><input type="checkbox" id="opt-low" ${s.quality === 'low' ? 'checked' : ''}> Battery saver</label>
          <label><input type="checkbox" id="opt-motion" ${s.reducedMotion ? 'checked' : ''}> Reduce motion</label>
        </div>
        <h3>Your progress</h3>
        <p class="aside">Saved automatically in this browser. Your current place and routines keep going for up to 8 hours while you are away. Backups move your game between devices.</p>
        <div class="row"><button class="btn-quiet" id="opt-export">Export backup</button><button class="btn-quiet" id="opt-import">Import backup</button></div>
        <p class="aside">${num(s.total)} lifetime XP · chapter ${s.chapters + 1} · ${s.learned.length} words · ${Math.floor(s.time / 3600)}h ${Math.floor((s.time % 3600) / 60)}m of life in Japan${storageOK ? '' : ' · <b>Storage unavailable — export a backup.</b>'}</p>
        <div class="row"><button class="btn-quiet" id="opt-help">How to play</button><button class="btn-quiet danger" id="opt-reset">Start over…</button></div>`,
      bind: el => {
        el.querySelector('#profile-name').onchange = e => { s.name = e.target.value.trim().slice(0, 24) || 'Friend'; save(); };
        el.querySelectorAll('[data-coat]').forEach(b => b.onclick = () => { s.coat = b.dataset.coat; el.querySelectorAll('[data-coat]').forEach(x => x.classList.toggle('chosen', x === b)); save(); });
        el.querySelector('#opt-sound').onchange = e => { s.sound = e.target.checked; Sound.enabled = s.sound; Sound.play('goal'); save(); };
        el.querySelector('#opt-clock').onchange = e => { s.clock = e.target.checked ? 'local' : 'day'; save(); hud(); };
        el.querySelector('#opt-low').onchange = e => { s.quality = e.target.checked ? 'low' : 'auto'; save(); };
        el.querySelector('#opt-motion').onchange = e => { s.reducedMotion = e.target.checked; document.body.classList.toggle('reduce-motion', s.reducedMotion); save(); };
        el.querySelector('#opt-export').onclick = exportSave;
        el.querySelector('#opt-import').onclick = () => $('#import-file').click();
        el.querySelector('#opt-help').onclick = () => { closeModal(); help(); };
        el.querySelector('#opt-reset').onclick = () => setModal(`<h2>Start from the beginning?</h2><p>This replaces your current life in Japan. Export a backup first if you want to keep it.</p><div class="row"><button class="btn-quiet" id="keep">Keep my game</button><button class="btn-primary danger" id="reset">Start over</button></div>`, el2 => {
          el2.querySelector('#keep').onclick = () => { closeModal(); settings(); };
          el2.querySelector('#reset').onclick = () => {
            s = E.fresh();
            selected = 0;
            cardKey = '';
            last = Date.now();
            document.body.classList.remove('reduce-motion');
            save();
            closeModal();
            selectTab('town');
            intro();
          };
        });
      }
    });
  }
  function exportSave() {
    save();
    const a = document.createElement('a'), url = URL.createObjectURL(new Blob([JSON.stringify(s, null, 1)], { type: 'application/json' }));
    a.href = url;
    a.download = 'little-light-save.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Backup exported.');
  }
  $('#import-file').onchange = async e => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      if (file.size > 400000) throw Error('That file is too large to be a save.');
      const raw = JSON.parse(await file.text());
      const imported = raw.version === 1 ? E.migrate(raw) : E.hydrate(raw);
      closeModal();
      openModal({
        label: 'Restore backup',
        html: `<h2>Restore this life?</h2><p>Replace your current progress with a save in ${esc(E.CITIES[imported.city].name)}, ${num(imported.total)} lifetime XP and ${num(imported.jp)} Japanese insight?</p><div class="row"><button class="btn-quiet" data-close>Cancel</button><button class="btn-primary" id="restore">Restore</button></div>`,
        bind: el => {
          el.querySelector('[data-close]').onclick = closeModal;
          el.querySelector('#restore').onclick = () => {
            s = imported;
            s.revision = E.REVISION;
            Sound.enabled = s.sound;
            document.body.classList.toggle('reduce-motion', s.reducedMotion);
            selected = s.focus;
            cardKey = '';
            last = Date.now();
            E.resume(s);
            closeModal();
            away(Math.max(0, (Date.now() - s.last) / 1000));
            save();
            render();
            if (!s.started) intro();
          };
        }
      });
    } catch (error) { toast('Could not import: ' + error.message); }
  };

  function help() {
    openModal({
      label: 'How to play',
      html: `<small class="kicker">How to play</small><h2>Choose a place. Do the work. Make room.</h2>
        <p><b>Your character</b> works at one place at a time and repeats it on their own. Tap <b>Help</b> (or your character) to speed up the task in front of them. Each completed task earns experience (XP) and some Japanese, culture or connection.</p>
        <p><b>Improve</b> places with XP. New furniture and decorations appear at levels 10, 25, 50 and 100; production doubles at 25, 50, 100 and beyond.</p>
        <p><b>Routines</b> keep a place going while you are somewhere else — and while you are away, for up to 8 hours.</p>
        <p><b>Learn</b> Japanese with short lessons and everyday situations. As you learn, signs and conversations become readable, and new places open.</p>
        <p><b>People</b> have stories to share as your connection grows. Your choices are remembered. In each city you will meet three local people; mentor them, and appoint two as elders.</p>
        <p><b>Journey:</b> finish three community projects, keep the table open with a routine, appoint two elders, and grow enough to entrust the church — then begin again in a new city. Five cities make the journey.</p>
        <p class="aside">The town follows your clock — lamps come on in the evening. Drag to look around; pinch or scroll to zoom; ⤢ shows the whole neighborhood.</p>
        <p class="aside">Neighborhoods and people are fictional. XP measures progress in a game, not anyone’s worth.</p>
        <button class="btn-primary" data-close>Got it</button>`,
      bind: el => el.querySelector('[data-close]').onclick = closeModal
    });
  }

  function intro() {
    openModal({
      label: 'Welcome', cls: 'story intro', closable: false,
      html: `${portrait('player', 'intro-portrait')}
        <small class="kicker">A Little Light · 小さな光</small>
        <h2>You’ve arrived in Tokyo.</h2>
        <p class="story-text">A small apartment in Hanamimachi. A handful of words. A street full of people you haven’t met yet.</p>
        <p>Your character studies, shops, shares tea and cooks — and keeps going on their own. Tap to help with whatever is in front of them. Learn the language, make friends, and someday entrust a church to the people who belong here.</p>
        <label for="your-name">Your name</label><input id="your-name" maxlength="24" value="${esc(s.name)}" autocomplete="off">
        <div class="coats" role="group" aria-label="Jacket colour">${COATS.map(([c, n]) => `<button data-coat="${c}" style="--c:${c}" class="${s.coat === c ? 'chosen' : ''}" aria-label="${n} jacket"></button>`).join('')}</div>
        <button class="btn-primary" id="begin">Unpack and start studying</button>`,
      bind: el => {
        el.querySelectorAll('[data-coat]').forEach(b => b.onclick = () => { s.coat = b.dataset.coat; el.querySelectorAll('[data-coat]').forEach(x => x.classList.toggle('chosen', x === b)); });
        el.querySelector('#begin').onclick = () => {
          s.name = el.querySelector('#your-name').value.trim().slice(0, 24) || 'Friend';
          s.started = true;
          s.sound = true;
          Sound.enabled = true;
          Sound.play('city');
          E.start(s, 0);
          last = Date.now();
          log('I arrived with a suitcase and began learning the words for a new life.', 'city');
          save();
          closeModal();
          toast('Your character is studying. Tap Help to write the next kana.');
        };
      }
    });
  }
  function whatsNew() {
    openModal({
      label: 'What’s new', cls: 'story',
      html: `<small class="kicker">Welcome back</small><h2>The neighborhood has grown.</h2>
        <p>Your progress is safe. Since you were last here:</p>
        <ul class="news"><li>A rebuilt town with real streets, signs you learn to read, a passing train and lamplight in the evening.</li><li>Ten Japanese lessons, a kana notebook that fills as you study, and city dialects.</li><li>Your story choices are now remembered. Each city has three local people to meet and mentor.</li><li>A rebalanced journey, a proper ending, sound, and Add to Home Screen.</li></ul>
        <p class="aside">The economy was rebalanced, so numbers may look different from before.</p>
        <button class="btn-primary" data-close>Let’s go</button>`,
      bind: el => el.querySelector('[data-close]').onclick = closeModal
    });
  }

  function away(seconds) {
    if (!s.started || seconds < 60) { E.step(s, seconds); return; }
    const before = { xp: s.xp, jp: s.jp, culture: s.culture, bonds: s.bonds, cycles: s.cycles };
    E.step(s, seconds);
    const capped = seconds > E.OFFLINE_CAP;
    const mins = Math.floor(Math.min(seconds, E.OFFLINE_CAP) / 60);
    const span = mins >= 60 ? Math.floor(mins / 60) + ' hours' + (mins % 60 ? ' ' + (mins % 60) + ' minutes' : '') : mins + ' minutes';
    const lines = ['The kettle was on when you got back.', 'Someone had left a note under your door: お帰りなさい — welcome home.', 'Mrs. Sato watered your plant. She mentions this twice.', 'The street sounds the same as when you left. That is a comfort.', 'A neighbor waved from a balcony. You waved back.'];
    openModal({
      label: 'While you were away', cls: 'story',
      html: `<small class="kicker">While you were away · ${span}${capped ? ' (8-hour limit)' : ''}</small><h2>Life kept going.</h2>
        <p class="story-text">${esc(lines[Math.floor(Math.random() * lines.length)])} ${s.stations.some(x => x.auto) ? 'Your routines carried on without you.' : 'Your character kept at it; routines let more places run at once.'}</p>
        <div class="gains big">${chips({ xp: s.xp - before.xp, jp: +(s.jp - before.jp).toFixed(1), culture: +(s.culture - before.culture).toFixed(1), bonds: +(s.bonds - before.bonds).toFixed(1) })}</div>
        <button class="btn-primary" data-close>Good to be back</button>`,
      bind: el => el.querySelector('[data-close]').onclick = closeModal
    });
  }

  // ——— Watching for moments worth mentioning ———
  const seen = { level: E.language(s), ready: new Set(), unlockable: new Set(), cycles: s.stations.map(x => x.cycles), elders: s.elders.map(e => e.training) };
  function watch() {
    const lv = E.language(s);
    if (lv > seen.level) {
      Sound.play('milestone');
      toast('Japanese: ' + E.LANGUAGE_NAMES[lv] + '. More of the town makes sense.', 'gold');
      log('My Japanese reached a new stage: ' + E.LANGUAGE_NAMES[lv].toLowerCase() + '.', 'lesson');
      cardKey = '';
    }
    seen.level = lv;
    for (const p of [...C.PEOPLE.map(x => x.id), 'local0', 'local1', 'local2']) {
      const r = personReady(p);
      const key = p + (p.startsWith('local') ? s.city + ':' + s.elders[Number(p.slice(5))].read + s.elders[Number(p.slice(5))].met : s.stories[p] || 0);
      if (r && !seen.ready.has(key)) {
        seen.ready.add(key);
        const name = p.startsWith('local') ? local(Number(p.slice(5))).name : E.person(p).name;
        if (s.started && !modalOpen) toast(name + ' has something to share. Tap them in town.');
      }
    }
    for (let i = 0; i < 8; i++) {
      const k = s.city + ':' + i;
      if (!s.stations[i].level && E.accessible(s, i) && s.xp >= E.ACTIVITIES[i].cost && !seen.unlockable.has(k)) {
        seen.unlockable.add(k);
        if (s.started && i > 0) toast('A new place is ready to open: ' + placeName(i) + '.', 'gold');
      }
    }
    s.elders.forEach((e, i) => {
      if (e.training > seen.elders[i] && s.started) toast('Mentoring with ' + local(i).name + ': a conversation is waiting.', 'gold');
      seen.elders[i] = e.training;
    });
    // Little bursts of feedback as routines complete their work.
    s.stations.forEach((st, i) => {
      if (st.cycles > seen.cycles[i] && st.level) {
        if (i === s.focus) window.WorldView?.reward('+' + num(E.payout(s, i) * (st.cycles - seen.cycles[i])) + ' XP', 'xp');
        else if (st.auto && Math.random() < 0.35) window.WorldView?.celebrate(i, '+' + num(E.payout(s, i)), 'xp small');
      }
      seen.cycles[i] = st.cycles;
    });
  }

  // ——— Wiring ———
  $$('[data-tab]').forEach(b => b.addEventListener('click', () => selectTab(b.dataset.tab)));
  $('#goal-chip').onclick = claimGoal;
  $('#settings-btn').onclick = settings;
  $('#hud-xp').onclick = () => toast('Experience: ' + num(s.xp) + ' · lifetime ' + num(s.total) + ' · ×' + E.global(s).toFixed(2) + ' from everything you have grown.');
  $('#view-toggle').onclick = () => { window.WorldView?.toggle(); viewToggleLabel(); Sound.play('page'); };
  document.addEventListener('pointerdown', () => Sound.unlock(), { once: true });
  document.addEventListener('keydown', e => {
    const m = $('.modal');
    if (m) {
      if (e.key === 'Escape' && m.querySelector('.modal-close')) closeModal();
      if (e.key === 'Tab') {
        const els = [...m.querySelectorAll('button:not(:disabled), input')];
        if (!els.length) return;
        if (e.shiftKey && document.activeElement === els[0]) { e.preventDefault(); els[els.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === els[els.length - 1]) { e.preventDefault(); els[0].focus(); }
      }
      return;
    }
    if (e.key === 'Escape') selectTab('town');
    if (e.code === 'Space' && tab === 'town' && !['INPUT', 'BUTTON'].includes(document.activeElement?.tagName)) { e.preventDefault(); helpTap(); }
  });

  window.GameBridge = {
    state: () => s,
    selection: () => selected,
    select: selectPlace,
    assist: helpTap,
    visit,
    personReady,
    personInfo,
    notice: toast,
    sound: name => Sound.play(name)
  };
  window.App = {
    get s() { return s; }, E, C, J, PLACES, num, small, secs, esc, toast, portrait, seal, chips, phrase, local, personReady,
    openModal, closeModal, setModal, save, advance, render, selectTab, selectPlace,
    visit, mentor, talkLocal, appointLocal, lesson, situation, speak, projectAction, entrust, finale, help, panels: {}
  };

  // ——— Start ———
  render();
  const awayFor = Math.max(0, (Date.now() - s.last) / 1000);
  if (s.started) {
    away(awayFor);
    if (returning && priorRevision < 6) whatsNew();
    if (E.complete(s) && !s.finaleSeen) finale();
    save();
  } else intro();

  // One wall-clock cursor drives everything, so time is never counted twice.
  function tick() {
    advance();
    watch();
    hud();
    syncCard();
    if (tab !== 'town') window.App.panels.sync?.[tab]?.();
  }
  setInterval(tick, 100);
  setInterval(() => { if (s.started) save(); }, 4000);
  document.addEventListener('visibilitychange', () => { tick(); save(); });
  window.addEventListener('pagehide', save);
  window.addEventListener('pageshow', tick);
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
