// A Little Light — sound. Everything is synthesised with the Web Audio API:
// soft wooden taps, bell-like chimes, a pentatonic sparkle for milestones.
(function (root) {
  'use strict';
  let ctx = null, master = null, enabled = false, last = {};

  function audio() {
    if (!ctx) {
      const AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      const comp = ctx.createDynamicsCompressor();
      master.connect(comp);
      comp.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // One soft bell-ish note: a sine with a quieter octave partial and a gentle decay.
  function note(freq, at = 0, length = 0.9, volume = 0.12, type = 'sine') {
    const a = audio();
    if (!a) return;
    const t = a.currentTime + at;
    for (const [mult, vol] of [[1, 1], [2, 0.22], [3.01, 0.06]]) {
      const o = a.createOscillator(), g = a.createGain();
      o.type = type;
      o.frequency.value = freq * mult;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(volume * vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + length / mult);
      o.connect(g);
      g.connect(master);
      o.start(t);
      o.stop(t + length + 0.05);
    }
  }
  // A short filtered noise burst: footsteps, page turns, wooden taps, a passing train.
  function noise(length = 0.08, freq = 1800, volume = 0.08, at = 0, q = 1.2, sweep = 0) {
    const a = audio();
    if (!a) return;
    const t = a.currentTime + at;
    const buffer = a.createBuffer(1, Math.ceil(a.sampleRate * length), a.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    src.buffer = buffer;
    f.type = 'bandpass';
    f.frequency.setValueAtTime(freq, t);
    if (sweep) f.frequency.exponentialRampToValueAtTime(freq * sweep, t + length);
    f.Q.value = q;
    g.gain.setValueAtTime(volume, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + length);
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(t);
  }

  // Pentatonic (yo scale) so everything sits together: D E G A B.
  const SCALE = [293.66, 329.63, 392.0, 440.0, 493.88, 587.33, 659.25, 783.99, 880.0, 987.77];
  const PLACE_NOTE = [5, 3, 6, 4, 2, 7, 1, 8];

  const sounds = {
    tap() { noise(0.05, 2400, 0.06, 0, 3); },
    help(i = 0) { noise(0.04, 2000 + (i % 4) * 300, 0.05, 0, 4); note(SCALE[PLACE_NOTE[i] || 0] * 2, 0, 0.18, 0.025); },
    cycle(i = 0) { note(SCALE[PLACE_NOTE[i] || 0], 0, 0.7, 0.05); },
    buy() { note(SCALE[2] * 2, 0, 0.25, 0.05); note(SCALE[4] * 2, 0.05, 0.3, 0.04); },
    milestone() { [0, 2, 4, 5, 7].forEach((n, i) => note(SCALE[n], i * 0.08, 1.2, 0.07)); },
    unlock() { [2, 4, 7, 9].forEach((n, i) => note(SCALE[n], i * 0.1, 1.4, 0.07)); },
    goal() { note(SCALE[5], 0, 0.8, 0.07); note(SCALE[7], 0.1, 1.0, 0.07); },
    story() { note(SCALE[0], 0, 1.8, 0.06); note(SCALE[4], 0.18, 1.8, 0.05); note(SCALE[7], 0.36, 2.2, 0.05); },
    correct() { note(SCALE[4], 0, 0.4, 0.06); note(SCALE[7], 0.08, 0.6, 0.06); },
    wrong() { note(SCALE[1] / 2, 0, 0.35, 0.05, 'triangle'); },
    lesson() { [0, 2, 4, 7, 9].forEach((n, i) => note(SCALE[n], i * 0.09, 1.3, 0.06)); },
    page() { noise(0.18, 3500, 0.03, 0, 0.8, 0.5); },
    open() { noise(0.12, 900, 0.04, 0, 0.7); note(SCALE[3], 0.02, 0.5, 0.03); },
    train() { for (let i = 0; i < 6; i++) noise(0.22, 420, 0.035, i * 0.32, 0.7); },
    elder() { [0, 4, 7, 9, 11].forEach((n, i) => note(SCALE[Math.min(9, n)], i * 0.14, 2.4, 0.06)); },
    city() { [0, 2, 4, 7, 9, 7, 9].forEach((n, i) => note(SCALE[n], i * 0.16, 2.0, 0.055)); }
  };

  root.Sound = {
    get enabled() { return enabled; },
    set enabled(v) { enabled = !!v; if (enabled) audio(); },
    // Unlock audio on the first touch (iOS requires a user gesture).
    unlock() { if (enabled) audio(); },
    play(name, arg) {
      if (!enabled || !sounds[name]) return;
      const now = performance.now();
      // Avoid stacking identical sounds within a few frames.
      if (now - (last[name] || 0) < (name === 'cycle' ? 120 : 40)) return;
      last[name] = now;
      try { sounds[name](arg); } catch { /* audio is optional */ }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
