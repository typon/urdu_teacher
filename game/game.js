(function () {
  'use strict';
  const WORDS = window.WORDS;
  const stage = document.getElementById('stage');
  const W = () => window.innerWidth, H = () => window.innerHeight;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const URDU_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
  const urduNum = (n) => String(n).replace(/\d/g, (d) => URDU_DIGITS[+d]);

  // shuffle-bag: every item comes up once before any repeats, never the same twice in a row
  function bag(items) {
    let pool = [], last = null;
    return () => {
      if (!pool.length) {
        pool = items.slice().sort(() => Math.random() - 0.5);
        if (pool.length > 1 && pool[pool.length - 1] === last) [pool[0], pool[pool.length - 1]] = [pool[pool.length - 1], pool[0]];
      }
      return (last = pool.pop());
    };
  }

  // ─────────────────────────── sound effects (synthesised, no files) ───────────────────────────
  const Sfx = (() => {
    let ctx = null, master = null;
    function ensure() {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        master = ctx.createGain(); master.gain.value = 0.3; master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    function tone({ type = 'sine', f0, f1, dur = 0.2, vol = 0.5, delay = 0 }) {
      const c = ensure(); if (!c) return;
      const t = c.currentTime + delay;
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(f0, t);
      if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.8);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
    }
    function noise(dur, freq, vol, delay = 0) {
      const c = ensure(); if (!c) return;
      const t = c.currentTime + delay;
      const buf = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * dur)), c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const s = c.createBufferSource(); s.buffer = buf;
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.9;
      const g = c.createGain(); g.gain.value = vol;
      s.connect(f); f.connect(g); g.connect(master); s.start(t);
    }
    const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
    return {
      unlock: ensure,
      pop() { tone({ f0: 240, f1: 760, dur: 0.2, vol: 0.5 }); tone({ type: 'triangle', f0: 480, f1: 980, dur: 0.12, vol: 0.12, delay: 0.04 }); },
      hop() { tone({ f0: 360, f1: 640, dur: 0.11, vol: 0.22 }); },
      burst() { noise(0.1, 1500, 0.9); tone({ f0: 900, f1: 130, dur: 0.13, vol: 0.35 }); },
      plink(n) { const f = 392 * Math.pow(2, SCALE[clamp(n, 0, 10)] / 12); tone({ type: 'triangle', f0: f, dur: 0.55, vol: 0.4 }); tone({ f0: f * 2, dur: 0.3, vol: 0.1 }); },
      blip() { tone({ type: 'square', f0: 700, f1: 480, dur: 0.07, vol: 0.05 }); },
      cheer() { [0, 4, 7, 12, 16, 19].forEach((s, i) => tone({ type: 'triangle', f0: 523 * Math.pow(2, s / 12), dur: 0.4, vol: 0.3, delay: i * 0.08 })); },
      whoosh() { noise(0.4, 700, 0.35); },
      chomp() { noise(0.05, 900, 0.7); noise(0.05, 650, 0.6, 0.11); tone({ type: 'triangle', f0: 320, f1: 170, dur: 0.1, vol: 0.18 }); },
      burp() { tone({ type: 'sawtooth', f0: 130, f1: 70, dur: 0.45, vol: 0.1 }); noise(0.38, 260, 0.3); },
    };
  })();

  // ─────────────────────────── Urdu voice ───────────────────────────
  // Plays pre-recorded clips from voice/ (made by the build script). If a clip is missing it
  // falls back to the Mac's own speech voice (Urdu if installed, otherwise Hindi, which sounds
  // the same for these words). '~' in a queue is a short pause.
  const Voice = (() => {
    const files = window.VOICE_FILES || {};
    const els = {};
    let playing = false, until = 0, queue = [], cb = null, onItem = null, watchdog = null, token = 0, cur = null;
    let synthVoice = null, synthLang = null;
    function pickSynth() {
      if (!('speechSynthesis' in window)) return;
      const vs = speechSynthesis.getVoices();
      synthVoice = vs.find((v) => /^ur/i.test(v.lang)) || null; synthLang = 'ur';
      if (!synthVoice) { synthVoice = vs.find((v) => /^hi/i.test(v.lang)) || null; synthLang = 'hi'; }
    }
    if ('speechSynthesis' in window) { pickSynth(); speechSynthesis.onvoiceschanged = pickSynth; }
    for (const id in files) {
      const a = new Audio(); a.preload = 'auto'; a.src = files[id]; els[id] = a;
    }

    function next() {
      clearTimeout(watchdog);
      if (!queue.length) {
        playing = false; until = performance.now() + 180; cur = null;
        const c = cb; cb = null; onItem = null; if (c) c();
        return;
      }
      const id = queue.shift();
      const my = ++token;
      const done = () => { if (my === token) next(); };
      if (id === '~') { watchdog = setTimeout(done, 260); return; }
      if (onItem) onItem(id);
      const a = els[id];
      if (a) {
        let fell = false;
        const fallback = () => { if (my === token && !fell) { fell = true; speakSynth(id, done); } };
        cur = a;
        try { a.currentTime = 0; } catch (e) { /* not loaded yet */ }
        a.onended = done; a.onerror = fallback;
        const p = a.play();
        if (p && p.catch) p.catch(fallback);
        watchdog = setTimeout(done, 4500);
        return;
      }
      speakSynth(id, done);
    }
    function speakSynth(id, done) {
      clearTimeout(watchdog);
      const w = WORDS[id];
      if (synthVoice && w) {
        const u = new SpeechSynthesisUtterance(synthLang === 'hi' ? w.hi : w.ur);
        u.voice = synthVoice; u.lang = synthVoice.lang; u.rate = 0.85; u.pitch = 1.15;
        u.onend = done; u.onerror = done;
        try { speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { /* ignore */ }
        watchdog = setTimeout(done, 4000);
      } else {
        watchdog = setTimeout(done, 650); // no voice at all: keep the same rhythm silently
      }
    }
    function stop() {
      token++; clearTimeout(watchdog); queue = []; cb = null; onItem = null; playing = false;
      if (cur) { try { cur.pause(); } catch (e) { /* ignore */ } cur = null; }
      if ('speechSynthesis' in window) try { speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    }
    return {
      busy: () => playing || performance.now() < until,
      stop,
      say(ids, opts = {}) {
        if (!opts.force && this.busy()) return false;
        stop();
        queue = [].concat(ids).filter(Boolean);
        cb = opts.onDone || null; onItem = opts.onItem || null; playing = true;
        next();
        return true;
      },
    };
  })();

  // ─────────────────────────── sprites & the 12fps clock ───────────────────────────
  const sprites = new Set();
  class Sprite {
    constructor(name, height, opts = {}) {
      const sz = Doodle.size(name);
      this.h = height; this.w = height * sz.w / sz.h;
      this.anchor = opts.anchor || 'bottom';
      this.el = document.createElement('div');
      this.el.className = 'sprite' + (opts.cls ? ' ' + opts.cls : '');
      this.el.style.width = this.w + 'px'; this.el.style.height = this.h + 'px';
      this.el.style.transformOrigin = this.anchor === 'bottom' ? '50% 100%' : '50% 50%';
      this.el.appendChild(Doodle.svg(name));
      this.art = name;
      this.x = 0; this.y = 0; this.rot = 0; this.sx = 1; this.sy = 1; this.flip = 1; this.z = opts.z || 10;
      this.q = []; this.o = {}; this.ph = Math.floor(Math.random() * 12);
      (opts.parent || stage).appendChild(this.el);
      sprites.add(this);
    }
    setArt(name) {
      if (this.art === name) return;
      this.art = name;
      this.el.replaceChild(Doodle.svg(name), this.el.firstChild);
    }
    play(frames) { this.q = frames.slice(); return this; }
    step() { this.o = this.q.length ? this.q.shift() : {}; }
    apply() {
      const o = this.o, s = o.s == null ? 1 : o.s;
      const ox = this.w / 2, oy = this.anchor === 'bottom' ? this.h : this.h / 2;
      const x = this.x + (o.dx || 0) * this.h - ox, y = this.y + (o.dy || 0) * this.h - oy;
      const sx = this.sx * s * (o.sx == null ? 1 : o.sx) * this.flip, sy = this.sy * s * (o.sy == null ? 1 : o.sy);
      this.el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${(this.rot + (o.rot || 0)).toFixed(1)}deg) scale(${sx.toFixed(3)},${sy.toFixed(3)})`;
      this.el.style.zIndex = Math.round(this.z);
    }
    remove() { this.dead = true; this.el.remove(); sprites.delete(this); }
  }
  const POP = [{ s: 0.15 }, { s: 0.6 }, { s: 1.22, sy: 1.1 }, { s: 1.08, sy: 0.88 }, { s: 0.94 }, { s: 1.04 }, { s: 1 }];
  const HOP = [{ sy: 0.86, sx: 1.12 }, { dy: -0.14, sy: 1.1, sx: 0.92 }, { dy: -0.24 }, { dy: -0.2 }, { dy: -0.06 }, { sy: 0.88, sx: 1.1 }, {}];
  const HOP_SMALL = [{ sy: 0.9, sx: 1.06 }, { dy: -0.1 }, { dy: -0.13 }, { dy: -0.06 }, { sy: 0.93, sx: 1.05 }, {}];
  const WIGGLE = [{ rot: -9 }, { rot: 8 }, { rot: -6 }, { rot: 4 }, { rot: -2 }, {}];

  function scenery(name, css, cls, par) {
    const d = document.createElement('div');
    d.className = 'scenery' + (cls ? ' ' + cls : '');
    Object.assign(d.style, css);
    d.appendChild(Doodle.svg(name, { par }));
    stage.appendChild(d);
    return d;
  }

  function confetti(x, y, n = 12, spread = 1) {
    for (let i = 0; i < n; i++) {
      const kind = pick(['cf-star-', 'cf-dot-', 'cf-sq-']) + Math.floor(Math.random() * window.CONFETTI_COUNT);
      const c = new Sprite(kind, rand(18, 34) * Math.max(1, H() / 900), { anchor: 'center', z: 70 });
      c.x = x; c.y = y;
      const a = rand(0, Math.PI * 2), sp = rand(10, 26) * spread * Math.max(1, H() / 900);
      c.vx = Math.cos(a) * sp; c.vy = Math.sin(a) * sp - 12; c.life = 16 + Math.floor(Math.random() * 6);
      c.spin = rand(-40, 40);
      c.update = () => {
        c.x += c.vx; c.y += c.vy; c.vy += 3.2; c.vx *= 0.92; c.rot += c.spin;
        if (--c.life <= 0) c.remove();
        else if (c.life < 4) c.sx = c.sy = c.life / 4;
      };
    }
  }

  function floatText(text, x, y, size) {
    const d = document.createElement('div');
    d.className = 'floatnum'; d.textContent = text; d.style.fontSize = size + 'px';
    stage.appendChild(d);
    let t = 0;
    const s = { update() {
      t++;
      const sc = t === 1 ? 0.6 : t === 2 ? 1.2 : 1;
      d.style.transform = `translate(${x}px,${y - t * size * 0.07}px) translate(-50%,-50%) scale(${sc}) rotate(${t % 4 < 2 ? -4 : 4}deg)`;
      if (t > 10) d.style.opacity = String(Math.max(0, 1 - (t - 10) / 5));
      if (t > 15) { d.remove(); tickers.delete(s); }
    } };
    tickers.add(s); s.update();
  }

  // ─────────────────────────── word banner ───────────────────────────
  const Banner = (() => {
    const el = document.getElementById('banner');
    const urEl = el.querySelector('.ur'), numEl = el.querySelector('.num'), romanEl = el.querySelector('.roman');
    let frames = [], t = 0;
    const clean = (s) => s.replace(/!\s*$/, '').replace(/!\s+/g, '، ').trim();
    return {
      init() { el.querySelector('.bub').appendChild(Doodle.svg('bubble', { par: 'none' })); },
      show(id, opts = {}) {
        const w = WORDS[id]; if (!w) return;
        urEl.textContent = clean(w.ur);
        numEl.textContent = opts.num || '';
        romanEl.textContent = w.roman + (opts.west ? '  ·  ' + opts.west : '');
        el.classList.toggle('has-dot', !!opts.color);
        if (opts.color) el.style.setProperty('--accent', opts.color);
        el.classList.add('on');
        frames = [0.55, 1.14, 0.94, 1.04, 1];
      },
      hide() { el.classList.remove('on'); },
      tick() {
        t++;
        const s = frames.length ? frames.shift() : 1;
        el.style.transform = `translateX(-50%) scale(${s}) rotate(${(t >> 2) % 2 ? -0.8 : 0.8}deg)`;
      },
    };
  })();

  // ─────────────────────────── shared scenery bits ───────────────────────────
  function addSun(x, y, size) {
    const s = new Sprite('sun', size, { anchor: 'center', z: 2 });
    s.x = x; s.y = y;
    s.update = (t) => { s.rot = ((t >> 2) % 2 ? -5 : 5); s.sx = s.sy = (t >> 3) % 2 ? 1 : 1.04; };
    return s;
  }
  function addClouds(n, yMin, yMax) {
    for (let i = 0; i < n; i++) {
      const c = new Sprite('cloud', H() * rand(0.09, 0.13), { anchor: 'center', z: 1 });
      c.x = rand(0, W()); c.y = H() * rand(yMin, yMax);
      const v = rand(1.2, 2.6);
      c.update = () => { c.x += v; if (c.x - c.w / 2 > W()) c.x = -c.w / 2; };
    }
  }
  function addHill(heightFrac, cls) {
    return scenery('hill', { left: '0', right: '0', bottom: '0', height: (heightFrac * 100) + 'vh' }, cls, 'xMidYMax slice');
  }
  function addFlowers(n, yMin, yMax) {
    for (let i = 0; i < n; i++) {
      const f = new Sprite(pick(['flower-pink', 'flower-blue']), H() * rand(0.07, 0.1), { z: 3 });
      f.x = W() * ((i + rand(0.2, 0.8)) / n); f.y = H() * rand(yMin, yMax);
      f.update = (t) => { f.rot = ((t + f.ph) >> 2) % 2 ? -6 : 6; };
    }
  }

  // ═══════════════════════════ GAME 1: Animals ═══════════════════════════
  const Animals = {
    title: 'g_animals',
    kinds: [
      ['cat', 'a_cat', 's_cat'], ['dog', 'a_dog', 's_dog'], ['cow', 'a_cow'], ['goat', 'a_goat', 's_goat'],
      ['duck', 'a_duck', 's_duck'], ['rooster', 'a_rooster', 's_rooster'], ['fish', 'a_fish'],
      ['elephant', 'a_elephant'], ['lion', 'a_lion'], ['frog', 'a_frog', 's_frog'],
      ['bird', 'a_bird', 's_bird'], ['rabbit', 'a_rabbit'],
    ],
    enter() {
      stage.className = 'scene-day';
      this.animals = []; this.next = bag(this.kinds);
      addSun(W() * 0.09, H() * 0.15, H() * 0.2);
      addClouds(3, 0.08, 0.38);
      addHill(0.42);
      addFlowers(7, 0.9, 0.99);
    },
    press(info) {
      if (Voice.busy() && this.animals.length) {
        this.animals.forEach((a) => { if (!a.q.length && !a.leaving) a.play(HOP_SMALL); });
        Sfx.hop();
        return;
      }
      const [kind, wordId, soundId] = this.next();
      const s = Math.min(H() * 0.33, W() * 0.22);
      let x = (info.x != null ? info.x : Math.random()) * W();
      x = clamp(x + rand(-0.03, 0.03) * W(), s * 0.6, W() - s * 0.6);
      // shuffle sideways a bit so animals don't stack exactly on top of each other
      for (const o of this.animals) if (!o.leaving && Math.abs(o.x - x) < s * 0.45) x = clamp(x + (x < W() / 2 ? 1 : -1) * s * 0.5, s * 0.6, W() - s * 0.6);
      const a = new Sprite(kind, s, { z: 10 });
      a.x = x; a.baseY = H() * rand(0.885, 0.955);
      a.floaty = kind === 'fish' || kind === 'bird';
      if (a.floaty) a.baseY -= s * 0.45;
      a.y = a.baseY; a.z = 10 + a.baseY / 20;
      a.flip = Math.random() < 0.5 ? 1 : -1;
      a.play(POP);
      a.update = (t) => this.animalTick(a, t);
      Sfx.pop();
      this.animals.push(a);
      while (this.animals.filter((o) => !o.leaving).length > 6) this.leave(this.animals.find((o) => !o.leaving));
      a.spot = true;
      Voice.say(soundId ? [wordId, '~', soundId] : [wordId], {
        onItem: (id) => Banner.show(id),
        onDone: () => { a.spot = false; },
      });
    },
    animalTick(a, t) {
      if (a.leaving) {
        a.x += a.dir * W() * 0.022;
        a.y = a.baseY + ((t % 4) < 2 ? -a.h * 0.08 : 0);
        if (a.x < -a.w || a.x > W() + a.w) { a.remove(); this.animals = this.animals.filter((o) => o !== a); }
        return;
      }
      if (a.spot && !a.q.length && (t + a.ph) % 6 === 0) { a.play(HOP); }
      if (!a.q.length) {
        const k = ((t + a.ph) >> 2) % 2;
        a.sy = k ? 1 : 0.965; a.sx = k ? 1 : 1.03;
        if (a.floaty) a.y = a.baseY + (((t + a.ph) >> 2) % 2 ? -a.h * 0.04 : a.h * 0.04);
      }
    },
    leave(a) { if (!a) return; a.leaving = true; a.spot = false; a.dir = a.x < W() / 2 ? -1 : 1; a.flip = -a.dir; a.q = []; },
  };

  // ═══════════════════════════ GAME 2: Balloons ═══════════════════════════
  const Balloons = {
    title: 'g_balloons',
    colors: ['red', 'blue', 'yellow', 'green', 'orange', 'pink', 'purple', 'white', 'black', 'brown'],
    enter() {
      stage.className = 'scene-sky';
      this.balloons = []; this.next = bag(this.colors);
      addSun(W() * 0.91, H() * 0.14, H() * 0.18);
      addClouds(4, 0.06, 0.55);
      addHill(0.26);
      const n = Math.max(3, Math.round(W() / 420));
      for (let i = 0; i < n; i++) {
        const hs = new Sprite('house', H() * rand(0.13, 0.17), { z: 4 });
        hs.x = W() * ((i + 0.5) / n) + rand(-40, 40); hs.y = H() * rand(0.9, 0.96);
      }
      addFlowers(6, 0.93, 1.0);
    },
    press(info) {
      if (Voice.busy()) {
        // extra mashing pops the oldest balloon — but only once it has had time to float a bit
        const now = performance.now();
        const old = this.balloons.filter((b) => !b.popping && now - b.born > 1800);
        if (old.length >= 4 && now - (this.lastPop || 0) > 600) { this.lastPop = now; this.pop(old[0]); }
        else { this.balloons.forEach((b) => { if (!b.popping && !b.q.length) b.play(WIGGLE); }); Sfx.blip(); }
        return;
      }
      const color = this.next();
      const h = Math.min(H() * 0.36, W() * 0.26);
      const b = new Sprite('balloon-' + color, h, { z: 20 });
      b.x = clamp((info.x != null ? info.x : Math.random()) * W(), h * 0.4, W() - h * 0.4);
      b.y = H() + h * 0.05; b.vy = H() * rand(0.011, 0.015); b.top = H() * rand(0.03, 0.2);
      b.homeX = b.x; b.z = 20 + (this.balloons.length % 10); b.born = performance.now();
      b.play([{ s: 0.6 }, { s: 1.15, sy: 1.12 }, { sy: 0.92 }, {}]);
      b.update = (t) => {
        if (b.popping) return;
        b.y -= b.vy;
        b.rot = ((t + b.ph) >> 2) % 2 ? -5 : 5;
        b.x = b.homeX + (((t + b.ph) >> 3) % 2 ? -1 : 1) * h * 0.04;
        if (b.y - h < b.top) this.pop(b);
      };
      this.balloons.push(b);
      const live = this.balloons.filter((x) => !x.popping);
      if (live.length > 9) this.pop(live[0]);
      Sfx.pop();
      Voice.say(['c_' + color], { onItem: (id) => Banner.show(id, { color: window.BALLOON_COLORS[color] }) });
    },
    pop(b) {
      if (b.popping) return;
      b.popping = true;
      b.play([{ s: 1.12 }, { s: 1.28, sy: 1.18 }, { s: 0.25 }]);
      Sfx.burst();
      const cx = b.x, cy = b.y - b.h * 0.65;
      later(180, epoch, () => { confetti(cx, cy, 14); b.remove(); this.balloons = this.balloons.filter((x) => x !== b); });
    },
  };

  // ═══════════════════════════ GAME 3: Counting ═══════════════════════════
  const APPLE_SLOTS = [[118, 104], [182, 74], [248, 84], [306, 118], [92, 176], [158, 152], [226, 160], [298, 184], [140, 228], [258, 228]];
  const STAR_SLOTS = [[0.1, 0.45], [0.2, 0.36], [0.31, 0.5], [0.42, 0.38], [0.53, 0.52], [0.64, 0.38], [0.75, 0.5], [0.87, 0.38], [0.32, 0.72], [0.68, 0.72]];
  const FISH_SLOTS = [[0.24, 0.3], [0.41, 0.24], [0.59, 0.24], [0.76, 0.3], [0.16, 0.56], [0.36, 0.52], [0.64, 0.52], [0.84, 0.56], [0.38, 0.78], [0.62, 0.78]];
  const Counting = {
    title: 'g_counting',
    scenes: ['apples', 'stars', 'fish'],
    enter() { this.sceneIdx = 0; this.build(); },
    build() {
      clearStage();
      this.count = 0; this.items = []; this.phase = 'count';
      const scene = this.scenes[this.sceneIdx % this.scenes.length];
      this.scene = scene;
      if (scene === 'apples') {
        stage.className = 'scene-day';
        addSun(W() * 0.09, H() * 0.15, H() * 0.18);
        addClouds(2, 0.1, 0.3);
        addHill(0.3);
        addFlowers(6, 0.92, 1.0);
        const th = Math.min(H() * 0.7, W() * 0.6);
        const tree = new Sprite('tree', th, { z: 5 });
        tree.x = W() / 2; tree.y = H() * 0.985;
        this.holder = tree;
        this.slot = (i) => {
          const [sx, sy] = APPLE_SLOTS[i];
          return [tree.x - tree.w / 2 + sx * tree.w / 400, tree.y - tree.h + sy * tree.h / 440];
        };
        this.itemName = 'apple'; this.itemSize = th * 0.15; this.finale = 'f_apples';
      } else if (scene === 'stars') {
        stage.className = 'scene-night';
        for (let i = 0; i < 40; i++) {
          const d = document.createElement('div'); d.className = 'twinkle';
          d.style.left = rand(0, 100) + 'vw'; d.style.top = rand(0, 80) + 'vh';
          stage.appendChild(d);
        }
        const tw = Array.from(stage.querySelectorAll('.twinkle'));
        tickers.add({ update(t) { if (t % 2 === 0) pick(tw).classList.toggle('off'); } });
        const moon = new Sprite('moon', H() * 0.22, { anchor: 'center', z: 3 });
        moon.x = W() * 0.9; moon.y = H() * 0.16;
        moon.update = (t) => { moon.rot = (t >> 3) % 2 ? -4 : 4; };
        this.holder = moon;
        addHill(0.2, 'dim');
        this.slot = (i) => [STAR_SLOTS[i][0] * W(), STAR_SLOTS[i][1] * H()];
        this.itemName = 'star'; this.itemSize = Math.min(H() * 0.14, W() * 0.1); this.finale = 'f_stars';
      } else {
        stage.className = 'scene-meadow';
        addSun(W() * 0.92, H() * 0.13, H() * 0.17);
        addClouds(2, 0.08, 0.26);
        addHill(0.62);
        addFlowers(8, 0.97, 1.0);
        const ph = Math.min(H() * 0.6, W() * 0.86 * 0.52);
        const pond = new Sprite('pond', ph, { z: 4 });
        pond.x = W() / 2; pond.y = H() * 0.975;
        for (const [fx, fy] of [[0.06, 0.995], [0.94, 0.99]]) {
          const r = new Sprite('reeds', H() * 0.3, { z: 6 }); r.x = W() * fx; r.y = H() * fy;
          r.update = (t) => { r.rot = ((t + r.ph) >> 2) % 2 ? -3 : 3; };
        }
        for (const [lx, ly] of [[0.13, 0.42], [0.88, 0.5], [0.3, 0.9]]) {
          const l = new Sprite('lilypad', pond.h * 0.13, { anchor: 'center', z: 5 });
          l.x = pond.x - pond.w / 2 + lx * pond.w; l.y = pond.y - pond.h + ly * pond.h;
        }
        this.holder = pond;
        this.slot = (i) => [pond.x - pond.w / 2 + FISH_SLOTS[i][0] * pond.w, pond.y - pond.h + FISH_SLOTS[i][1] * pond.h];
        this.itemName = 'fish'; this.itemSize = pond.h * 0.24; this.finale = 'f_fish';
      }
    },
    press() {
      if (this.phase !== 'count' || Voice.busy()) {
        if (this.holder && !this.holder.q.length) this.holder.play(this.scene === 'apples' ? [{ rot: -1.5 }, { rot: 1.5 }, { rot: -1 }, {}] : WIGGLE);
        if (this.items.length) { const it = pick(this.items); if (!it.q.length) it.play(HOP_SMALL); }
        Sfx.blip();
        return;
      }
      const i = this.count; this.count++;
      const n = this.count;
      const [x, y] = this.slot(i);
      const it = new Sprite(this.itemName, this.itemSize, { anchor: 'center', z: 30 + i });
      it.x = x; it.y = y; it.home = [x, y];
      if (this.scene === 'fish') it.flip = i % 2 ? -1 : 1;
      it.play(POP);
      it.update = (t) => this.itemTick(it, t);
      this.items.push(it);
      Sfx.plink(n);
      floatText(urduNum(n), x, y - this.itemSize * 0.7, this.itemSize * 0.8);
      const last = n === 10;
      if (last) this.phase = 'finale';
      Voice.say(['n' + n], {
        onItem: (id) => Banner.show(id, { num: urduNum(n), west: String(n) }),
        onDone: last ? () => this.celebrate() : null,
      });
    },
    itemTick(it, t) {
      if (it.exit) { it.exit(t); return; }
      if (it.q.length) return;
      const k = ((t + it.ph) >> 2) % 2;
      if (this.scene === 'fish') {
        it.x = it.home[0] + (k ? 1 : -1) * it.h * 0.12;
        if (((t + it.ph) >> 2) % 4 === 0 && (t & 3) === 0) it.flip = -it.flip;
      } else if (this.scene === 'stars') {
        it.rot = k ? -8 : 8; it.sx = it.sy = k ? 1 : 1.06;
      } else {
        it.rot = k ? -5 : 5;
      }
    },
    celebrate() {
      if (this.phase !== 'finale') return;
      this.phase = 'party';
      const ep = epoch;
      Voice.say([this.finale], { force: true, onItem: (id) => Banner.show(id) });
      Sfx.cheer();
      this.items.forEach((it, i) => later(i * 70, ep, () => it.play(HOP.concat(HOP))));
      for (let k = 0; k < 4; k++) later(250 + k * 450, ep, () => confetti(rand(0.2, 0.8) * W(), rand(0.3, 0.6) * H(), 16, 1.2));
      later(3400, ep, () => this.exitItems());
    },
    exitItems() {
      const ep = epoch;
      Sfx.whoosh();
      this.items.forEach((it, i) => {
        it.vx = rand(-8, 8); it.vy = this.scene === 'apples' ? rand(-6, 0) : this.scene === 'stars' ? -rand(18, 30) : -rand(30, 42);
        it.exit = () => {
          if (this.scene === 'stars') { it.y += it.vy; it.x += it.vx; it.rot += 25; }
          else { it.y += it.vy; it.x += it.vx; it.vy += this.scene === 'apples' ? 7 : 6; it.rot += it.vx * 2; }
        };
        it.z = 60 + i;
      });
      later(1500, ep, () => { this.sceneIdx++; this.build(); });
    },
  };

  // ═══════════════════════════ GAME 4: Food (کھانا) ═══════════════════════════
  const FOODS = [
    ['food-roti', 'k_roti'], ['food-naan', 'k_naan'], ['food-bread', 'k_bread'], ['food-eggs', 'k_eggs'],
    ['food-milk', 'k_milk'], ['food-dahi', 'k_dahi'], ['food-rice', 'k_rice'], ['food-daal', 'k_daal'],
    ['food-biryani', 'k_biryani'], ['food-chai', 'k_chai'], ['food-samosa', 'k_samosa'], ['food-jalebi', 'k_jalebi'],
    ['food-gulabjamun', 'k_gulabjamun'], ['food-chocolate', 'k_chocolate'], ['food-biscuit', 'k_biscuit'],
    ['food-mango', 'k_mango'], ['food-banana', 'k_banana'], ['apple', 'k_apple'],
  ];
  const FULL_AT = 8; // bites until the bear's tummy is full
  const Food = {
    title: 'g_food',
    enter() {
      stage.className = 'scene-kitchen';
      this.next = bag(FOODS);
      this.react = bag(['e_hap', 'e_yum', 'e_hap', 'e_more']);
      this.eaten = 0; this.phase = 'idle'; this.onPlate = null;
      const tableTop = H() * 0.71;
      for (const [fx, flip] of [[0.13, 1], [0.87, -1]]) {
        const w = new Sprite('window', H() * 0.36, { z: 1 });
        w.x = W() * fx; w.y = H() * 0.47; w.flip = flip;
      }
      const bear = new Sprite('bear', H() * 0.62, { z: 5 });
      bear.x = W() / 2; bear.y = tableTop + H() * 0.21;
      bear.update = (t) => { if (!bear.q.length) bear.sy = ((t >> 2) % 2) ? 1 : 0.985; };
      this.bear = bear;
      const hDiv = H() - tableTop + H() * 0.05, s = Math.max(W() / 1000, hDiv / 260);
      const table = scenery('table', { left: '0', right: '0', bottom: '0', top: (tableTop - 28 * s) + 'px', zIndex: 8 }, null, 'xMidYMin slice');
      table.style.zIndex = 8;
      const plate = new Sprite('plate', H() * 0.085, { anchor: 'center', z: 9 });
      plate.x = W() / 2; plate.y = tableTop + H() * 0.06;
      this.plate = plate;
    },
    mouth() { const b = this.bear; return [b.x, b.y - b.h + b.h * (172 / 340)]; },
    belly() { this.bear.sx = 1 + Math.min(this.eaten, FULL_AT) * 0.035; },
    press(info) {
      if (this.phase !== 'idle' || Voice.busy()) {
        if (!this.bear.q.length) this.bear.play(WIGGLE);
        if (this.onPlate && !this.onPlate.q.length && !this.onPlate.mode) this.onPlate.play(HOP_SMALL);
        Sfx.blip();
        return;
      }
      const [art, word] = this.next();
      const s = H() * 0.21;
      const f = new Sprite(art, s, { anchor: 'center', z: 20 });
      f.x = clamp((info.x != null ? info.x : Math.random()) * W(), s, W() - s);
      f.y = H() * 0.36;
      const x0 = f.x, y0 = f.y, px = this.plate.x, py = this.plate.y - s * 0.3;
      f.play(POP);
      f.t = 0;
      f.update = (t) => {
        if (f.mode) { f.mode(); return; }
        f.t++;
        if (f.t > 6 && f.t <= 12) {
          const k = (f.t - 6) / 6;
          f.x = x0 + (px - x0) * k;
          f.y = y0 + (py - y0) * k - Math.sin(k * Math.PI) * H() * 0.12;
          f.rot = (1 - k) * (px > x0 ? 20 : -20);
          if (f.t === 12) { Sfx.hop(); f.play([{ sy: 0.8, sx: 1.15 }, { sy: 1.06 }, {}]); }
        } else if (f.t > 12 && !f.q.length) {
          f.rot = ((t + f.ph) >> 2) % 2 ? -5 : 5;
        }
      };
      this.onPlate = f; this.phase = 'serving';
      Sfx.pop();
      this.bear.play(HOP_SMALL);
      const react = this.react();
      const full = this.eaten + 1 >= FULL_AT;
      const ids = [word, '~', '~', react].concat(full ? ['~', 'e_full'] : []);
      const ep = epoch;
      Voice.say(ids, {
        onItem: (id) => {
          if (id === word) Banner.show(word);
          else if (id === react) this.eat(f);
          else if (id === 'e_full') { Banner.show('e_full'); this.full(); }
        },
        onDone: () => {
          if (ep !== epoch) return;
          if (!f.eaten) this.eat(f);
          if (this.phase === 'serving') this.phase = 'idle';
        },
      });
    },
    eat(f) {
      if (f.eaten || f.dead) return;
      f.eaten = true; f.q = [];
      this.bear.setArt('bear-open');
      const x0 = f.x, y0 = f.y;
      let k = 0;
      f.mode = () => {
        k++;
        const [mx, my] = this.mouth();
        f.x = x0 + (mx - x0) * (k / 4); f.y = y0 + (my - y0) * (k / 4);
        f.sx = f.sy = 1 - 0.7 * (k / 4); f.rot += 25;
        if (k >= 4) { f.remove(); this.chomp(); }
      };
    },
    chomp() {
      const ep = epoch;
      this.onPlate = null;
      Sfx.chomp();
      this.bear.setArt('bear-chew');
      const [mx, my] = this.mouth();
      confetti(mx, my, 6, 0.45);
      this.eaten++; this.belly();
      this.bear.play([{ sy: 0.95, sx: 1.04 }, { sy: 1.03 }, { sy: 0.95, sx: 1.04 }, { sy: 1.03 }, { sy: 0.95, sx: 1.04 }, { sy: 1.02 }, {}]);
      later(1000, ep, () => { if (this.phase !== 'full') this.bear.setArt('bear'); });
    },
    full() {
      const ep = epoch;
      this.phase = 'full';
      this.bear.setArt('bear-chew');
      const wig = [{ rot: -6 }, { rot: -6 }, { rot: 6 }, { rot: 6 }];
      this.bear.play(wig.concat(wig, wig, [{}]));
      later(900, ep, () => { Sfx.burp(); this.bear.play([{ sy: 1.08, sx: 0.97 }, { sy: 1.04 }, {}]); });
      for (let i = 0; i < 4; i++) later(300 + i * 450, ep, () => confetti(rand(0.25, 0.75) * W(), rand(0.2, 0.5) * H(), 14, 1.1));
      later(3600, ep, () => {
        this.eaten = 0; this.belly();
        this.bear.setArt('bear'); this.bear.play(HOP);
        this.phase = 'idle';
      });
    },
  };

  const GAMES = { animals: Animals, balloons: Balloons, counting: Counting, food: Food };

  // ─────────────────────────── game switching ───────────────────────────
  let current = null, epoch = 0;
  const tickers = new Set();
  function later(ms, ep, fn) { setTimeout(() => { if (ep === epoch) fn(); }, ms); }
  function clearStage() {
    for (const s of Array.from(sprites)) s.remove();
    for (const t of Array.from(tickers)) tickers.delete(t);
    stage.innerHTML = '';
  }
  const picker = document.getElementById('picker');
  function startGame(name) {
    const g = GAMES[name]; if (!g) return;
    epoch++;
    Voice.stop(); clearStage();
    current = g;
    picker.classList.add('hidden');
    document.body.classList.add('in-game');
    g.enter();
    Banner.show(g.title);
    Voice.say([g.title], { force: true });
  }
  function showPicker(opts) {
    epoch++;
    Voice.stop(); clearStage(); Banner.hide();
    current = null;
    stage.className = '';
    picker.classList.remove('hidden');
    document.body.classList.remove('in-game');
    if (opts && opts.greet) Voice.say(['hello'], { force: true });
  }

  // ─────────────────────────── picker ───────────────────────────
  const cards = Array.from(document.querySelectorAll('.card'));
  function initPicker() {
    picker.querySelector('.p-title .bub').appendChild(Doodle.svg('bubble', { par: 'none' }));
    cards.forEach((c) => {
      c.querySelector('.frame').appendChild(Doodle.svg(c.dataset.frame, { par: 'none' }));
      c.querySelector('.icon').appendChild(Doodle.svg(c.dataset.icon));
      c.addEventListener('pointerdown', (e) => {
        e.stopPropagation(); e.preventDefault();
        Sfx.unlock(); Sfx.pop();
        c.dataset.boing = '1';
        setTimeout(() => startGame(c.dataset.game), 260);
      });
    });
  }
  let pickerT = 0;
  function pickerTick() {
    pickerT++;
    cards.forEach((c, i) => {
      let s = 1, r = ((pickerT + i * 3) >> 3) % 2 ? -1.6 : 1.6;
      if (c.dataset.wig) { const w = +c.dataset.wig; r = [-7, 6, -4, 3, 0][5 - w] || 0; c.dataset.wig = w - 1 > 0 ? w - 1 : ''; }
      if (c.dataset.boing) { s = 1.1; c.dataset.boing = ''; }
      c.style.transform = `rotate(${r}deg) scale(${s})`;
    });
  }
  function setLock(mode) {
    const el = picker.querySelector('.lock');
    el.className = 'lock ' + mode;
    el.querySelector('.lock-txt').textContent =
      mode === 'full' ? 'Keyboard is locked — mash away!' :
      mode === 'partial' ? 'Partly locked: some shortcuts still work. Turn on Urdu Doodles in System Settings → Privacy & Security → Accessibility, then reopen.' :
      'Browser preview — the keyboard is NOT locked here (press Esc twice for this menu).';
  }

  // ─────────────────────────── input ───────────────────────────
  const ROWS = ['`1234567890-=', 'qwertyuiop[]\\', "asdfghjkl;'", 'zxcvbnm,./'];
  const SROWS = ['~!@#$%^&*()_+', 'QWERTYUIOP{}|', 'ASDFGHJKL:"', 'ZXCVBNM<>?'];
  const ROW_OFF = [0, 1.5, 1.8, 2.3];
  const KC_X = { 49: 0.45, 36: 0.9, 76: 0.9, 51: 0.95, 117: 0.95, 48: 0.04, 53: 0.03, 57: 0.05, 123: 0.85, 124: 0.97, 125: 0.91, 126: 0.91,
    56: 0.06, 63: 0.04, 59: 0.12, 58: 0.2, 55: 0.29, 54: 0.62, 61: 0.7, 62: 0.78, 60: 0.92,
    122: 0.1, 120: 0.17, 99: 0.24, 118: 0.31, 96: 0.38, 97: 0.45, 98: 0.52, 100: 0.59, 101: 0.66, 109: 0.73, 103: 0.8, 111: 0.87 };
  const CODE_X = { Space: 0.45, Enter: 0.9, Backspace: 0.95, Tab: 0.04, Escape: 0.03, CapsLock: 0.05, ArrowLeft: 0.85, ArrowRight: 0.97, ArrowUp: 0.91, ArrowDown: 0.91,
    ShiftLeft: 0.06, ControlLeft: 0.12, AltLeft: 0.2, MetaLeft: 0.29, MetaRight: 0.62, AltRight: 0.7, ShiftRight: 0.92 };
  function keyX(ch, kc, code) {
    if (ch && ch.length === 1) {
      for (let r = 0; r < ROWS.length; r++) {
        let i = ROWS[r].indexOf(ch.toLowerCase()); if (i < 0) i = SROWS[r].indexOf(ch);
        if (i >= 0) return (ROW_OFF[r] + i + 0.5) / 15;
      }
    }
    if (kc != null && KC_X[kc] != null) return KC_X[kc];
    if (code && CODE_X[code] != null) return CODE_X[code];
    return Math.random();
  }

  let lastMash = 0;
  function mash(info) {
    const now = performance.now();
    if (now - lastMash < 45) return;
    lastMash = now;
    Sfx.unlock();
    if (!current) {
      const c = pick(cards); c.dataset.wig = '5'; Sfx.blip();
      return;
    }
    current.press(info);
  }

  // Called by the Mac app (keys never reach the page directly there)
  window.urduMash = (e) => mash({ x: keyX(e && e.ch, e && e.kc), source: 'key' });
  window.urduMenu = () => showPicker({ greet: true });
  window.urduSetLock = (mode) => { window.__native = true; setLock(mode); };
  window.urduStartGame = (name) => startGame(name);

  // Browser fallback (preview / testing)
  let lastEsc = 0;
  window.addEventListener('keydown', (e) => {
    if (window.__native) return;
    e.preventDefault();
    if (e.repeat) return;
    if (e.key === 'Escape') {
      const now = performance.now();
      if (now - lastEsc < 600) { showPicker(); lastEsc = 0; return; }
      lastEsc = now;
    }
    mash({ x: keyX(e.key, null, e.code), source: 'key' });
  });
  stage.addEventListener('pointerdown', (e) => { mash({ x: e.clientX / W(), source: 'click' }); });
  window.addEventListener('contextmenu', (e) => e.preventDefault());
  window.addEventListener('dragstart', (e) => e.preventDefault());

  // ─────────────────────────── boot ───────────────────────────
  Doodle.init();
  Banner.init();
  initPicker();
  if (!window.__native) setLock('browser');

  let tick = 0;
  setInterval(() => {
    tick++;
    if (tick % 2 === 0) document.body.dataset.boil = String((tick >> 1) % 3);
    Banner.tick();
    if (!current) { pickerTick(); return; }
    for (const s of Array.from(sprites)) {
      if (s.update) s.update(tick);
      if (s.dead) continue;
      s.step(); s.apply();
    }
    for (const t of Array.from(tickers)) t.update(tick);
  }, 1000 / 12);

  // warm up the most-used doodles so the first key press is instant
  setTimeout(() => {
    try { Doodle.prebuild(['cat', 'dog', 'cow', 'goat', 'duck', 'rooster', 'fish', 'elephant', 'lion', 'frog', 'bird', 'rabbit', 'sun', 'cloud', 'hill', 'flower-pink', 'flower-blue']); } catch (e) { console.error(e); }
  }, 50);
})();
