// A Little Light — the Learn, People and Journey tabs.
// Each panel draws itself from the current state and binds its buttons to window.App.
(function () {
  'use strict';
  const A = window.App, { E, C, J, num, esc } = A;
  const $ = (root, q) => root.querySelector(q);

  function head(title, sub) { return `<header class="panel-head"><h2>${title}</h2><p>${sub}</p></header>`; }
  function bar(f) { return `<span class="bar"><i style="width:${Math.max(0, Math.min(1, f)) * 100}%"></i></span>`; }

  // ——— Learn ———
  function learn(root) {
    const s = A.s, lv = E.language(s), next = E.THRESHOLDS[lv + 1], base = E.THRESHOLDS[lv];
    const books = E.notebook(s);
    const open = J.situations.map((q, i) => ({ q, i })).filter(x => E.situationOpen(s, x.i) && !s.situations.includes(x.i));
    const sit = open[0];
    const solved = s.situations.length, total = J.situations.filter(q => q.city === undefined || s.situations.includes(J.situations.indexOf(q)) || q.city === s.city).length;
    root.innerHTML = head('Make sense of the world.', 'Study runs on its own. Lessons give it a head start — and every word makes the town a little more readable.') + `
      <section class="card language">
        <div class="lang-top"><span class="big-glyph">あ</span><div><small>Japanese insight</small><h3 id="lang-name">${esc(E.LANGUAGE_NAMES[lv])}</h3></div><b class="big-num" id="lang-num">${num(s.jp)}</b></div>
        <div id="lang-bar">${bar(next ? (s.jp - base) / (next - base) : 1)}</div>
        <p class="aside" id="lang-next">${next ? num(s.jp) + ' / ' + next + ' to “' + E.LANGUAGE_NAMES[lv + 1] + '”' : 'Every translation is open to you.'} · ×${(1 + lv * 0.1).toFixed(1)} XP from everything</p>
      </section>
      ${sit ? `<section class="card situation">
        <small class="kicker">Use it in the neighborhood${sit.q.city !== undefined ? ' · ' + esc(E.CITIES[sit.q.city].name) + ' dialect' : ''}</small>
        <h3>${esc(sit.q.title)}</h3><p>${esc(sit.q.scene)}</p>
        <div class="phrase big"><span lang="ja">${esc(sit.q.jp)}</span><small>${esc(sit.q.romaji)} <button class="listen" data-say="${esc(sit.q.jp)}">▷</button></small></div>
        <div class="options">${sit.q.options.map((o, a) => `<button class="option" data-sit="${sit.i}" data-answer="${a}">${esc(o)}</button>`).join('')}</div>
        <p class="aside">${solved} situations understood · no penalty for trying.</p>
      </section>` : ''}
      <section class="card">
        <small class="kicker">Lessons · ${Object.keys(s.lessons).length} of ${C.LESSONS.length} finished</small>
        <div class="lessons">${C.LESSONS.map((l, i) => {
          const openL = E.lessonOpen(s, i), stars = s.lessons[l.id] || 0;
          return `<button class="lesson ${openL ? '' : 'locked'} ${openL && !stars ? 'new' : ''}" data-lesson="${i}" ${openL ? '' : 'disabled'}>
            <span class="lesson-jp" lang="ja">${esc(l.jp)}</span>
            <b>${esc(l.title)}</b>
            <small>${openL ? (stars ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : 'New · 8 words') : 'Opens at ' + E.lessonAt(i) + ' insight'}</small>
          </button>`;
        }).join('')}</div>
      </section>
      <section class="card notebook">
        <small class="kicker">Your study notebook</small>
        <p class="aside">Every study session at home fills in a little more. Each finished page adds 10% to the Japanese you learn.</p>
        ${books.map(b => `<details ${b.complete ? '' : b.filled ? 'open' : ''}><summary><b>${{ hiragana: 'Hiragana ひらがな', katakana: 'Katakana カタカナ', kanji: 'First kanji 漢字' }[b.key]}</b><span>${b.filled} / ${b.chars.length}${b.complete ? ' ✓' : ''}</span></summary>
          <div class="kana" lang="ja">${[...b.chars].map((c, i) => `<span class="${i < b.filled ? 'got' : ''}">${i < b.filled ? c : ''}</span>`).join('')}</div></details>`).join('')}
      </section>
      <section class="card">
        <details><summary><b>Words you know</b><span>${s.learned.length} / ${C.WORDS.length}</span></summary>
        <div class="vocab">${C.WORDS.map((w, i) => s.learned.includes(i) ? `<button class="word" data-say="${esc(w[0])}"><b lang="ja">${esc(w[0])}</b><small>${esc(w[1])}</small><span>${esc(w[2])}</span></button>` : '').join('') || '<p class="aside">Finish a lesson to start your word list.</p>'}</div></details>
      </section>
      <p class="tip">Meanings are introductory, not exhaustive. Audio uses your device’s Japanese voice if it has one.</p>`;
    root.querySelectorAll('[data-lesson]').forEach(b => b.onclick = () => A.lesson(Number(b.dataset.lesson)));
    root.querySelectorAll('[data-say]').forEach(b => b.onclick = () => A.speak(b.dataset.say));
    root.querySelectorAll('[data-sit]').forEach(b => b.onclick = () => A.situation(Number(b.dataset.sit), Number(b.dataset.answer), b));
  }
  function syncLearn() {
    const s = A.s, root = document.getElementById('panel-inner'), lv = E.language(s), next = E.THRESHOLDS[lv + 1], base = E.THRESHOLDS[lv];
    const n = $(root, '#lang-num');
    if (!n) return;
    n.textContent = num(s.jp);
    $(root, '#lang-name').textContent = E.LANGUAGE_NAMES[lv];
    $(root, '#lang-bar i').style.width = (next ? Math.min(1, (s.jp - base) / (next - base)) : 1) * 100 + '%';
  }

  // ——— People ———
  function people(root) {
    const s = A.s;
    const tokyo = s.city === 0;
    const city = E.CITIES[s.city];
    const localsHtml = `<section>
        <small class="kicker">${esc(city.district)} · people you are getting to know</small>
        <div class="locals">${city.locals.map((l, i) => localCard(l, i)).join('')}</div>
        <p class="tip">Mentoring needs the shared table open, 20 culture and 20 connection. Appoint two of the three as elders before you entrust the church.</p>
      </section>`;
    const neighborsHtml = `<section>
        <small class="kicker">${tokyo ? 'Your neighbors in Hanamimachi' : 'Your Tokyo friends · a weekend train away'}</small>
        <div class="neighbors">${C.PEOPLE.map(p => neighborCard(p)).join('')}</div>
      </section>`;
    root.innerHTML = head('A circle that keeps growing.', `Connection: <b id="bonds-now">${num(s.bonds)}</b> · every 25 adds 5% to everything you earn (up to +50%).`)
      + (tokyo ? neighborsHtml + localsHtml : localsHtml + neighborsHtml)
      + `<p class="tip">People have their own lives, hopes and questions. Friendship is worth growing for its own sake.</p>`;
    root.querySelectorAll('[data-visit]').forEach(b => b.onclick = () => A.visit(b.dataset.visit));
    root.querySelectorAll('[data-mentor]').forEach(b => b.onclick = () => A.mentor(Number(b.dataset.mentor)));
    syncPeople();
  }
  function neighborCard(p) {
    const s = A.s, read = s.stories[p.id] || 0;
    return `<article class="card neighbor">
      ${A.portrait(p.id, 'card-portrait')}
      <div class="neighbor-text"><h3>${esc(p.name)} <span lang="ja" class="jp-name">${esc(p.jp)}</span></h3><small>${esc(p.role)}</small>
      <div class="hearts" aria-label="${read} of 4 stories">${'♥'.repeat(read)}${'♡'.repeat(4 - read)}</div>
      <small class="partner">${read >= 4 ? '✓ ' + esc(p.partner) : 'Share four stories for a lasting partnership.'}</small></div>
      <button class="btn-small" data-visit="${p.id}" data-neighbor="${p.id}">Visit</button>
    </article>`;
  }
  function localCard(l, i) {
    return `<article class="card local" data-local="${i}">
      <div class="local-top">${A.seal(l, 'card-seal')}<div><h3>${esc(l.name)} <span lang="ja" class="jp-name">${esc(l.jp)}</span></h3><small>${esc(l.role)} · ${['teacher', 'listener', 'host'][i]}</small></div></div>
      <p class="local-bio">${esc(l.bio)}</p>
      <div class="stages" aria-label="Mentoring stages">${[0, 1, 2].map(k => `<span data-stage="${k}">${['Character', 'Care', 'Teaching'][k]}</span>`).join('')}</div>
      <div class="local-bar">${bar(0)}</div>
      <div class="local-actions"><button class="btn-small" data-visit="local${i}">Talk</button><button class="btn-small primary" data-mentor="${i}">Mentor</button></div>
      <small class="local-status"></small>
    </article>`;
  }
  function syncPeople() {
    const s = A.s, root = document.getElementById('panel-inner');
    const b = $(root, '#bonds-now');
    if (!b) return;
    b.textContent = num(s.bonds);
    root.querySelectorAll('[data-neighbor]').forEach(btn => {
      const p = E.person(btn.dataset.neighbor), wait = E.visitWait(s, p.id), ready = E.storyReady(s, p.id);
      btn.disabled = !s.started || s.jp < p.needs || (!ready && wait > 0);
      btn.textContent = s.jp < p.needs ? p.needs + ' あ to meet' : ready ? 'Story ✦' : wait ? 'In ' + wait + 's' : 'Visit';
      btn.classList.toggle('glow', ready);
    });
    root.querySelectorAll('[data-local]').forEach(card => {
      const i = Number(card.dataset.local), e = s.elders[i], l = E.CITIES[s.city].locals[i];
      const present = E.localPresent(s, i);
      card.classList.toggle('appointed', e.appointed);
      card.querySelectorAll('[data-stage]').forEach(st => st.classList.toggle('done', Number(st.dataset.stage) < e.training));
      card.querySelector('.local-bar i').style.width = ((e.training + (e.running ? e.progress / E.TRAINING_TIME[e.training] : 0)) / 3) * 100 + '%';
      const talk = card.querySelector('[data-visit]'), mentor = card.querySelector('[data-mentor]');
      const ready = A.personReady('local' + i);
      talk.disabled = !present || (e.met && !ready);
      talk.textContent = !e.met ? 'Meet' : e.read < e.training ? 'Talk ✦' : e.training === 3 && !e.appointed ? 'Appoint' : 'Talk';
      talk.classList.toggle('glow', ready);
      mentor.hidden = e.appointed || !e.met;
      mentor.disabled = !E.canTrain(s, i);
      mentor.textContent = e.running ? 'Mentoring · ' + A.secs(Math.max(0, E.TRAINING_TIME[e.training] - e.progress)) : e.training >= 3 ? 'Ready' : 'Mentor · stage ' + (e.training + 1);
      card.querySelector('.local-status').textContent = e.appointed ? '✓ Appointed elder · +20% ' + ['Japanese', 'culture', 'connection'][i] + ' gains'
        : !present ? 'You’ll meet ' + l.name + ' at the ' + A.PLACES[E.LOCAL_PLACE[i]].room.toLowerCase() + ' once it opens.'
          : !e.met ? 'Waiting to meet you at the ' + A.PLACES[E.LOCAL_PLACE[i]].room.toLowerCase() + '.'
            : e.read < e.training ? 'A conversation is waiting.'
              : e.running ? 'Spending time together…'
                : e.training < 3 && !E.canTrain(s, i) ? (s.stations[4].level ? 'Mentoring needs 20 culture and 20 connection.' : 'Mentoring begins once the shared table is open.')
                  : e.training === 3 ? 'Ready to be appointed.' : '';
    });
  }

  // ——— Journey ———
  function journey(root) {
    const s = A.s, city = E.CITIES[s.city], p = E.project(s), h = E.handover(s), g = E.gifts(s);
    const tasks = E.projectProgress(s);
    root.innerHTML = head(E.complete(s) ? 'The light stays on.' : esc(city.theme), esc(city.season) + ' · ' + g.length + ' of 5 churches entrusted') + `
      <section class="route" aria-label="Five cities">${E.CITIES.map((c, i) => `<button class="stop ${i === s.city ? 'here' : ''} ${g.includes(i) ? 'done' : ''}" data-city="${i}" style="--accent:${c.color}"><span>${g.includes(i) ? '✦' : i === s.city ? '●' : '○'}</span><b>${esc(c.name)}</b><small lang="ja">${esc(c.jp)}</small></button>`).join('')}</section>
      ${E.complete(s) ? `<section class="card"><h3>Five cities. A life shared.</h3><p>Your journey is complete. The neighborhood is yours to keep enjoying.</p><button class="btn-small primary" id="read-ending">Read the ending again</button></section>` : ''}
      ${p ? `<section class="card project">
        <small class="kicker">Community project ${s.projects.length + 1} of 3</small>
        <h3>${esc(p.name)}</h3><p>${esc(p.text)}</p>
        <div class="tasks">${tasks.map((t, k) => `<button class="task" data-task="${t.i}"><span class="task-icon">${E.ACTIVITIES[t.i].icon}</span><span class="task-text"><b>${esc(t.label[0].toUpperCase() + t.label.slice(1))}</b><small>${esc(E.ACTIVITIES[t.i].name)}${s.stations[t.i].level ? s.stations[t.i].auto ? ' · routine helping' : ' · go and help' : ' · not open yet'}</small><span class="bar"><i data-task-fill="${k}"></i></span></span><b class="task-count" data-task-count="${k}"></b></button>`).join('')}</div>
        <button class="btn-primary" id="project-action"></button>
        <p class="aside">Completed tasks count once the project begins. Routines contribute while you work elsewhere, and while you are away.</p>
      </section>` : !E.complete(s) ? `<section class="card project"><small class="kicker">Community projects</small><h3>Three projects, shared together.</h3><p>${esc(city.letter)}</p></section>` : ''}
      ${!E.complete(s) ? `<section class="card handover">
        <small class="kicker">Entrust the church</small>
        <h3>${esc(city.district)} fellowship</h3>
        <p>A shared table becomes a praying community. When the church can carry its own life, it is time to go.</p>
        <ul class="checks">
          <li data-check="projects">Three community projects completed</li>
          <li data-check="table">The shared table at level 10, with a routine</li>
          <li data-check="elders">Two local elders appointed</li>
          <li data-check="xp">${num(city.goal)} XP earned in ${esc(city.name)} <small id="run-xp"></small></li>
        </ul>
        <button class="btn-primary" id="entrust">Entrust the church and choose a city</button>
        <p class="aside">You carry forward: ${esc(city.gift)} — ${esc(city.effect)}</p>
      </section>` : ''}
      <section class="card">
        <small class="kicker">A family of churches</small>
        <h3>${s.plants.length} entrusted · +${num(E.support(s))} XP / sec in support</h3>
        <div class="plants">${s.plants.map(pl => `<div class="plant"><b>✦ ${esc(E.CITIES[pl.city].name)}</b><small>Elders: ${pl.elders.map(esc).join(', ')}</small></div>`).join('') || '<p class="aside">Your first church will appear here after you appoint elders and move on. It will keep supporting the next beginning.</p>'}</div>
        <p class="aside">${s.legacy} experience root${s.legacy === 1 ? '' : 's'} · ×${((1 + s.legacy * 0.5) * Math.pow(2, s.plants.length)).toFixed(1)} permanent production</p>
      </section>
      <section class="card journal">
        <details ${s.journal.length < 8 ? 'open' : ''}><summary><b>Letters &amp; journal</b><span>${s.journal.length}</span></summary>
        ${s.journal.map(e => `<article class="entry ${esc(e.kind || '')}"><small>${when(e.time)}</small><p>${esc(e.text)}</p></article>`).join('') || '<p class="aside">Your stories and milestones will be written here.</p>'}</details>
      </section>`;
    root.querySelectorAll('[data-task]').forEach(b => b.onclick = () => A.selectPlace(Number(b.dataset.task)));
    root.querySelectorAll('[data-city]').forEach(b => b.onclick = () => cityInfo(Number(b.dataset.city)));
    $(root, '#project-action')?.addEventListener('click', A.projectAction);
    $(root, '#entrust')?.addEventListener('click', A.entrust);
    $(root, '#read-ending')?.addEventListener('click', A.finale);
    syncJourney();
  }
  function when(t) {
    const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60);
    return h ? h + 'h ' + m + 'm into the journey' : m + ' minutes into the journey';
  }
  function cityInfo(i) {
    const s = A.s, c = E.CITIES[i], done = E.gifts(s).includes(i);
    A.openModal({
      label: c.name, cls: 'story',
      html: `<small class="kicker">${done ? 'A church entrusted' : i === s.city ? 'You are here' : 'A place in your journey'}</small><h2>${esc(c.name)} <span lang="ja" class="jp-name">${esc(c.jp)}</span></h2>
        <p class="theme">${esc(c.theme)}</p><p>${esc(c.season)} · ${esc(c.district)}</p>
        <p class="aside">${c.projects.map(p => esc(p.name)).join(' → ')}</p>
        <div class="note gold"><b>${esc(c.gift)}</b><p>${esc(c.effect)}</p></div>
        ${done ? `<p class="story-text">${esc(c.letter)}</p>` : ''}
        <button class="btn-primary" data-close>Close</button>`,
      bind: el => el.querySelector('[data-close]').onclick = A.closeModal
    });
  }
  function syncJourney() {
    const s = A.s, root = document.getElementById('panel-inner');
    const tasks = E.projectProgress(s);
    tasks.forEach((t, k) => {
      const c = $(root, `[data-task-count="${k}"]`);
      if (!c) return;
      c.textContent = t.done + ' / ' + t.target;
      $(root, `[data-task-fill="${k}"]`).style.width = (t.done / t.target) * 100 + '%';
    });
    const b = $(root, '#project-action');
    if (b) {
      const p = E.project(s);
      b.disabled = s.projectActive ? !E.projectReady(s) : !E.projectCanStart(s);
      b.textContent = E.projectReady(s) ? 'Complete the project ✦' : s.projectActive ? 'Working on it together…' : p.tasks.some(([i]) => !s.stations[i].level) ? 'Open the places it needs first' : 'Begin this project';
      b.classList.toggle('glow', E.projectReady(s) || E.projectCanStart(s));
    }
    const h = E.handover(s);
    root.querySelectorAll('[data-check]').forEach(li => li.classList.toggle('met', !!h[li.dataset.check]));
    const r = $(root, '#run-xp');
    if (r) r.textContent = '(' + num(s.run) + ' so far)';
    const en = $(root, '#entrust');
    if (en) { en.disabled = !E.ready(s); en.classList.toggle('glow', E.ready(s)); }
  }

  A.panels.learn = learn;
  A.panels.people = people;
  A.panels.journey = journey;
  A.panels.sync = { learn: syncLearn, people: syncPeople, journey: syncJourney };
})();
