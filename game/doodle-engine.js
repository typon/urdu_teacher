// Doodle engine: turns clean SVG markup into three hand-wobbled "boiling line" variants.
// Each sprite shows one variant at a time; flipping the variant a few times a second
// gives the jittery, hand-redrawn flipbook look.
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const INK = '#3b2a20';
  const VARIANTS = 3;
  const registry = {};   // name -> {w,h,svg,sw,amp,built}
  let defs, scratch, scratchPath;

  function init() {
    const holder = document.createElementNS(NS, 'svg');
    holder.setAttribute('width', '0'); holder.setAttribute('height', '0');
    holder.style.position = 'absolute'; holder.style.left = '-9999px';
    holder.setAttribute('aria-hidden', 'true');
    defs = document.createElementNS(NS, 'defs');
    holder.appendChild(defs);
    document.body.appendChild(holder);
    scratch = document.createElementNS(NS, 'svg');
    scratch.setAttribute('width', '10'); scratch.setAttribute('height', '10');
    scratch.style.position = 'absolute'; scratch.style.left = '-9999px';
    scratchPath = document.createElementNS(NS, 'path');
    scratch.appendChild(scratchPath);
    document.body.appendChild(scratch);
  }

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }

  const num = (el, a, d = 0) => { const v = parseFloat(el.getAttribute(a)); return isNaN(v) ? d : v; };

  function shapeToD(el) {
    const tag = el.tagName.toLowerCase();
    if (tag === 'path') return el.getAttribute('d');
    if (tag === 'circle' || tag === 'ellipse') {
      const cx = num(el, 'cx'), cy = num(el, 'cy');
      const rx = tag === 'circle' ? num(el, 'r') : num(el, 'rx');
      const ry = tag === 'circle' ? num(el, 'r') : num(el, 'ry');
      return `M${cx - rx} ${cy} A${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
    }
    if (tag === 'rect') {
      const x = num(el, 'x'), y = num(el, 'y'), w = num(el, 'width'), h = num(el, 'height');
      return `M${x} ${y} L${x + w} ${y} L${x + w} ${y + h} L${x} ${y + h} Z`;
    }
    if (tag === 'line') return `M${num(el, 'x1')} ${num(el, 'y1')} L${num(el, 'x2')} ${num(el, 'y2')}`;
    return null;
  }

  // Split into absolute-M subpaths and sample points along each.
  function sample(d) {
    const subs = d.match(/M[^M]*/g) || [];
    const out = [];
    for (const sd of subs) {
      scratchPath.setAttribute('d', sd);
      let L = 0;
      try { L = scratchPath.getTotalLength(); } catch (e) { L = 0; }
      if (!(L > 0)) continue;
      const closed = /z\s*$/i.test(sd.trim());
      const step = Math.max(2.2, Math.min(7, L / 14));
      const n = Math.max(closed ? 8 : 2, Math.round(L / step));
      const pts = [];
      const count = closed ? n : n + 1;
      for (let i = 0; i < count; i++) {
        const p = scratchPath.getPointAtLength((i / n) * L);
        pts.push([p.x, p.y]);
      }
      out.push({ pts, closed, L });
    }
    return out;
  }

  function wobble(sub, amp, r) {
    const { pts, closed, L } = sub;
    const TAU = Math.PI * 2;
    const k1 = Math.max(1, Math.round(L * 0.012)), k2 = Math.max(2, Math.round(L * 0.034));
    const f1 = TAU * k1 / L, f2 = TAU * k2 / L;
    const p1 = r() * TAU, p2 = r() * TAU, p3 = r() * TAU, p4 = r() * TAU;
    // small shapes wobble less, so eyes stay round-ish
    const a = Math.min(amp, (L / TAU) * 0.09 + 0.15);
    let s = 0;
    return pts.map((p, i) => {
      if (i > 0) s += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
      return [
        p[0] + a * (0.72 * Math.sin(s * f1 + p1) + 0.28 * Math.sin(s * f2 + p2)),
        p[1] + a * (0.72 * Math.sin(s * f1 + p3) + 0.28 * Math.sin(s * f2 + p4)),
      ];
    });
  }

  const fx = (v) => Math.round(v * 10) / 10;
  function toD(pts, closed) {
    const n = pts.length;
    if (n < 2) return '';
    const get = (i) => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = `M${fx(pts[0][0])} ${fx(pts[0][1])}`;
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      d += `C${fx(p1[0] + (p2[0] - p0[0]) / 6)} ${fx(p1[1] + (p2[1] - p0[1]) / 6)} ` +
           `${fx(p2[0] - (p3[0] - p1[0]) / 6)} ${fx(p2[1] - (p3[1] - p1[1]) / 6)} ` +
           `${fx(p2[0])} ${fx(p2[1])}`;
    }
    return closed ? d + 'Z' : d;
  }

  function mk(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
    parent.appendChild(e);
    return e;
  }

  function renderEl(el, spec, r, g) {
    const tag = el.tagName.toLowerCase();
    if (tag === 'g') { for (const c of el.children) renderEl(c, spec, r, g); return; }
    const d = shapeToD(el);
    if (!d) return;
    const subs = sample(d);
    if (!subs.length) return;
    const fill = el.getAttribute('fill') || 'none';
    const stroke = el.getAttribute('stroke') || INK;
    const tube = el.getAttribute('tube');
    const sw = num(el, 'stroke-width', spec.sw);
    const amp = spec.amp * num(el, 'jit', 1);
    const opacity = el.getAttribute('opacity');

    if (tube) {
      const sd = subs.map((s) => toD(wobble(s, amp, r), s.closed)).join('');
      mk('path', { d: sd, fill: 'none', stroke: INK, 'stroke-width': sw + spec.sw * 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      mk('path', { d: sd, fill: 'none', stroke: tube, 'stroke-width': sw, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      return;
    }
    if (fill !== 'none') {
      const fd = subs.map((s) => toD(wobble(s, amp * 0.7, r), s.closed)).join('');
      const off = spec.amp * 0.55;
      const ox = stroke === 'none' ? 0 : (r() - 0.5) * 2 * off, oy = stroke === 'none' ? 0 : (r() - 0.5) * 2 * off;
      mk('path', { d: fd, fill, opacity, transform: (ox || oy) ? `translate(${fx(ox)} ${fx(oy)})` : null }, g);
    }
    if (stroke !== 'none') {
      const sd = subs.map((s) => toD(wobble(s, amp, r), s.closed)).join('');
      mk('path', { d: sd, fill: 'none', stroke, 'stroke-width': sw, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity }, g);
    }
  }

  function build(name) {
    const spec = registry[name];
    if (!spec) throw new Error('no doodle ' + name);
    if (spec.built) return spec;
    const doc = new DOMParser().parseFromString(`<svg xmlns="${NS}">${spec.svg}</svg>`, 'image/svg+xml');
    const root = doc.documentElement;
    for (let v = 0; v < VARIANTS; v++) {
      const g = mk('g', { id: `dd-${name}-${v}` }, defs);
      const r = rng(hash(name) + v * 7919 + 13);
      for (const el of root.children) renderEl(el, spec, r, g);
    }
    spec.built = true;
    return spec;
  }

  window.Doodle = {
    INK,
    init,
    define(name, spec) { registry[name] = Object.assign({ w: 200, h: 200, sw: 5, amp: 2.2 }, spec); },
    has(name) { return !!registry[name]; },
    size(name) { const s = registry[name]; return { w: s.w, h: s.h }; },
    // Returns an <svg> element that shows the doodle with boiling lines.
    svg(name, opts = {}) {
      const spec = build(name);
      const s = document.createElementNS(NS, 'svg');
      s.setAttribute('viewBox', `0 0 ${spec.w} ${spec.h}`);
      s.setAttribute('class', 'doodle' + (opts.cls ? ' ' + opts.cls : ''));
      if (opts.par) s.setAttribute('preserveAspectRatio', opts.par);
      s.setAttribute('overflow', 'visible');
      for (let v = 0; v < VARIANTS; v++) {
        const u = document.createElementNS(NS, 'use');
        u.setAttribute('href', `#dd-${name}-${v}`);
        u.setAttribute('class', 'v' + v);
        s.appendChild(u);
      }
      return s;
    },
    prebuild(names) { names.forEach(build); },
  };
})();
