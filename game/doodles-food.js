// Art for the food game (کھانا): a hungry bear, his table and plate, and the foods.
// Same rules as doodles.js — plain SVG shapes, the engine adds the hand-drawn wobble.
(function () {
  const D = window.Doodle;
  const INK = D.INK;
  const { scallop } = window.DoodleHelpers;

  const eye = (x, y, r = 7) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}" stroke="none"/>` +
    `<circle cx="${x + r * 0.3}" cy="${y - r * 0.35}" r="${r * 0.36}" fill="#fff" stroke="none"/>`;
  const cheek = (x, y, rx = 9, ry = 5.5) =>
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#ff8fa3" stroke="none" opacity=".75"/>`;
  // little face for a food: two dot eyes, a smile, pink cheeks
  const face = (x, y, s = 1, col = INK) =>
    `<circle cx="${x - 9 * s}" cy="${y}" r="${4.2 * s}" fill="${col}" stroke="none"/>` +
    `<circle cx="${x + 9 * s}" cy="${y}" r="${4.2 * s}" fill="${col}" stroke="none"/>` +
    `<path d="M${x - 5 * s} ${y + 7 * s} Q${x} ${y + 12 * s} ${x + 5 * s} ${y + 7 * s}" stroke="${col}" stroke-width="3.2"/>` +
    cheek(x - 16 * s, y + 6 * s, 5 * s, 3.2 * s) + cheek(x + 16 * s, y + 6 * s, 5 * s, 3.2 * s);
  const dots = (pts, col, r = 2.4) => pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}" stroke="none"/>`).join('');
  const blobs = (pts, col) => pts.map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${col}" stroke="none"/>`).join('');
  const food = (name, svg) => D.define('food-' + name, { w: 100, h: 100, sw: 4.5, amp: 1.5, svg });

  // ───────── breads ─────────
  food('roti', `
    <circle cx="50" cy="52" r="42" fill="#efca88"/>
    ${blobs([[27, 34, 6, 4], [70, 29, 5, 3.5], [78, 64, 7, 4], [26, 70, 5, 3], [58, 84, 5, 3], [46, 22, 3.5, 2.5], [40, 82, 3, 2]], '#c48745')}
    ${face(50, 52)}
  `);
  food('naan', `
    <path d="M50 4 C72 20 94 46 89 70 C85 90 66 97 50 97 C34 97 15 90 11 70 C6 46 28 20 50 4 Z" fill="#f2cf86"/>
    ${blobs([[42, 30, 5, 3], [61, 42, 6, 3.5], [29, 60, 6, 3], [72, 74, 5, 3], [36, 86, 4, 2.5], [56, 88, 4, 2.5]], '#bf7f3d')}
    ${dots([[47, 20], [66, 58], [24, 78], [78, 84]], '#7a4a24', 2)}
    ${face(50, 64)}
  `);
  food('bread', `
    <path d="M20 94 L20 46 C5 42 4 15 25 11 C37 3 63 3 75 11 C96 15 95 42 80 46 L80 94 Z" fill="#d8955a"/>
    <path d="M28 88 L28 41 C17 37 17 22 29 19 C39 12 61 12 71 19 C83 22 83 37 72 41 L72 88 Z" fill="#fff0cc" stroke="none"/>
    ${dots([[36, 30], [62, 26], [44, 78], [64, 72], [34, 64]], '#ecd6a4', 1.8)}
    ${face(50, 56)}
  `);
  food('biscuit', `
    <path d="${scallop(50, 50, 40, 40, 14, 0.06)}" fill="#e9b65a"/>
    ${dots([[30, 30], [50, 24], [70, 30], [26, 50], [74, 50], [32, 72], [68, 72], [50, 80]], '#b97a3a', 2.6)}
    ${face(50, 52)}
  `);

  // ───────── eggs & dairy ─────────
  food('eggs', `
    <ellipse cx="33" cy="58" rx="22" ry="28" fill="#f4dcbc"/>
    <ellipse cx="68" cy="52" rx="23" ry="29" fill="#fffaf0"/>
    <path d="M24 44 Q26 38 30 36" stroke="#fff" stroke-width="4"/>
    <path d="M58 37 Q61 31 65 29" stroke="#f2e6d0" stroke-width="4"/>
    ${face(33, 62, 0.7)}${face(68, 56, 0.75)}
  `);
  food('milk', `
    <path d="M22 12 L78 12 L71 93 L29 93 Z" fill="#e3f2fb"/>
    <path d="M25 32 L75 32 L70 90 L30 90 Z" fill="#ffffff" stroke="none"/>
    <path d="M25 32 Q50 39 75 32" stroke-width="3"/>
    <path d="M71 18 L70 28" stroke="#ffffff" stroke-width="4"/>
    ${face(50, 60)}
  `);
  food('dahi', `
    <path d="M14 50 C18 26 82 26 86 50 Z" fill="#ffffff"/>
    <path d="M38 34 Q46 28 56 32" stroke="#e8e2d6" stroke-width="3"/>
    <path d="M8 50 L92 50 C90 78 72 94 50 94 C28 94 10 78 8 50 Z" fill="#c97a4a"/>
    <path d="M14 62 L86 62" stroke="#a85e33" stroke-width="3"/>
    ${face(50, 74)}
  `);

  // ───────── pots & plates ─────────
  food('rice', `
    <path d="M12 54 Q12 40 22 38 Q24 26 36 28 Q40 16 52 20 Q63 15 68 26 Q80 24 80 36 Q90 40 88 54 Z" fill="#ffffff"/>
    ${[[30, 40, 36, 37], [48, 30, 54, 29], [62, 38, 68, 40], [40, 46, 46, 45], [72, 48, 78, 46], [22, 48, 26, 46]].map(([a, b, c, d]) => `<path d="M${a} ${b} L${c} ${d}" stroke="#d9d2c0" stroke-width="2.6"/>`).join('')}
    <path d="M8 52 L92 52 C90 80 72 94 50 94 C28 94 10 80 8 52 Z" fill="#7cc4f0"/>
    ${dots([[24, 66], [76, 66], [50, 86]], '#ffffff', 3)}
    ${face(50, 70)}
  `);
  food('daal', `
    <path d="M10 48 C10 80 30 92 50 92 C70 92 90 80 90 48 Z" fill="#c9d4ea"/>
    <ellipse cx="50" cy="48" rx="40" ry="11" fill="#f5c242"/>
    ${dots([[34, 46], [58, 44], [66, 51], [44, 52]], '#d9534f', 2.4)}${dots([[50, 45], [40, 49], [62, 47]], '#5cb85c', 2)}
    <path d="M24 60 Q26 74 34 80" stroke="#ffffff" stroke-width="4"/>
    ${face(52, 70)}
  `);
  food('biryani', `
    <ellipse cx="50" cy="76" rx="47" ry="17" fill="#ffffff"/>
    <ellipse cx="50" cy="78" rx="36" ry="11" fill="none" stroke="#5aa9f0" stroke-width="2.6"/>
    <path d="M12 72 Q12 50 28 44 Q38 30 52 34 Q64 28 74 40 Q88 46 88 72 Z" fill="#ffe3a0"/>
    ${[[24, 60, 30, 58, '#f39c2b'], [36, 46, 42, 45, '#ffffff'], [56, 42, 62, 44, '#f39c2b'], [66, 58, 72, 56, '#ffffff'], [44, 62, 50, 60, '#f5c242'], [30, 52, 34, 49, '#ffffff'], [76, 64, 82, 62, '#f39c2b'], [50, 52, 56, 51, '#ffffff']].map(([a, b, c, d, col]) => `<path d="M${a} ${b} L${c} ${d}" stroke="${col}" stroke-width="3"/>`).join('')}
    <path d="M58 36 C54 20 72 12 80 24 C86 34 74 44 64 42 Z" fill="#b5652f"/>
    <path d="M77 22 L87 11" tube="#fff8ec" stroke-width="5"/>
    <circle cx="89" cy="9" r="4.5" fill="#fff8ec" stroke-width="3"/>
    <path d="M20 50 C16 44 22 40 26 44 Z" fill="#5cb85c" stroke-width="2.5"/>
    ${face(38, 60, 0.75)}
  `);
  food('gulabjamun', `
    <ellipse cx="50" cy="54" rx="42" ry="10" fill="#f0b44c"/>
    <circle cx="28" cy="48" r="14" fill="#8a3f1e"/>
    <circle cx="72" cy="48" r="13" fill="#8a3f1e"/>
    <circle cx="50" cy="42" r="16" fill="#8a3f1e"/>
    ${dots([[23, 42], [67, 43], [44, 34]], '#ffd8a8', 2.6)}
    <path d="M6 54 L94 54 C92 80 74 94 50 94 C26 94 8 80 6 54 Z" fill="#ffffff"/>
    <path d="M14 66 L86 66" stroke="#ff8fa3" stroke-width="3"/>
    ${face(50, 44, 0.6, '#fff4dc')}
    ${face(50, 78, 0.8)}
  `);

  // ───────── drinks & sweets ─────────
  food('chai', `
    <path d="M34 26 Q28 18 34 10 Q40 2 34 -4" stroke="#b7aca0" stroke-width="3"/>
    <path d="M58 26 Q52 18 58 10 Q64 2 58 -4" stroke="#b7aca0" stroke-width="3"/>
    <ellipse cx="48" cy="88" rx="42" ry="9" fill="#ffffff"/>
    <path d="M78 44 C96 42 96 68 74 70" tube="#ff9ac1" stroke-width="6"/>
    <path d="M16 36 L80 36 C78 68 68 84 48 84 C28 84 18 68 16 36 Z" fill="#ff9ac1"/>
    <ellipse cx="48" cy="36" rx="32" ry="7" fill="#c08552"/>
    ${face(48, 58)}
  `);
  food('samosa', `
    <path d="M50 10 C55 10 92 76 89 83 C86 90 14 90 11 83 C8 76 45 10 50 10 Z" fill="#e8ae4c"/>
    <path d="M18 80 Q22 74 26 80 Q30 74 34 80 Q38 74 42 80 Q46 74 50 80 Q54 74 58 80 Q62 74 66 80 Q70 74 74 80 Q78 74 82 80" stroke="#b97a3a" stroke-width="2.4"/>
    ${dots([[42, 34], [58, 42], [36, 52], [64, 62]], '#c98f3a', 1.8)}
    <path d="M40 22 Q36 30 34 36" stroke="#fff4dc" stroke-width="4"/>
    ${face(50, 58)}
  `);
  {
    // jalebi: a sticky orange spiral
    let d = '';
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2 * 2.6;
      const r = 6 + (i / 64) * 34;
      d += (i ? 'L' : 'M') + (50 + r * Math.cos(a)).toFixed(1) + ' ' + (52 + r * Math.sin(a) * 0.92).toFixed(1);
    }
    food('jalebi', `
      <path d="${d}" tube="#f39c2b" stroke-width="10"/>
      ${dots([[40, 30], [70, 50], [30, 66], [58, 76], [52, 38]], '#ffe0a8', 2.2)}
      <circle cx="44" cy="50" r="3.6" fill="${INK}" stroke="none"/><circle cx="58" cy="50" r="3.6" fill="${INK}" stroke="none"/>
    `);
  }
  food('chocolate', `
    <path d="M18 8 L82 8 L82 56 L18 56 Z" fill="#7a4428"/>
    <path d="M39.3 8 L39.3 56 M60.6 8 L60.6 56 M18 24 L82 24 M18 40 L82 40" stroke="#5a2f1a" stroke-width="3"/>
    ${dots([[26, 14], [47, 14], [68, 14]], '#a0694a', 2.4)}
    <path d="M14 56 L86 56 L86 95 L14 95 Z" fill="#e8463c"/>
    <path d="M14 56 L20 50 L26 56 L32 50 L38 56 L44 50 L50 56 L56 50 L62 56 L68 50 L74 56 L80 50 L86 56" stroke="#c9d4ea" stroke-width="3"/>
    ${face(50, 74, 1, '#fff4dc')}
  `);

  // ───────── fruit ─────────
  food('mango', `
    <path d="M58 14 C86 18 96 50 82 74 C70 94 40 98 24 84 C10 72 14 50 30 40 C42 32 40 16 58 14 Z" fill="#ffb92e"/>
    <path d="M62 22 C80 26 88 44 82 58 C72 48 62 36 62 22 Z" fill="#ff7a3c" stroke="none" opacity=".55"/>
    <path d="M58 14 Q56 8 60 3" stroke-width="4"/>
    <path d="M60 7 C70 -3 88 1 91 7 C81 15 69 15 60 7 Z" fill="#5cb85c" stroke-width="3.5"/>
    ${face(50, 62)}
  `);
  food('banana', `
    <path d="M8 26 C8 76 50 100 92 76 C97 70 93 63 86 65 C58 74 36 58 30 26 C28 16 8 16 8 26 Z" fill="#ffd94e"/>
    <path d="M22 40 C30 62 54 76 80 74" stroke="#e5b62e" stroke-width="2.6"/>
    <circle cx="16" cy="18" r="4.5" fill="#7a5230"/>
    <circle cx="91" cy="72" r="3" fill="#7a5230" stroke="none"/>
    ${face(46, 74, 0.72)}
  `);

  // ───────── the bear ─────────
  const B = { fur: '#c98b5a', dark: '#a86b3f', cream: '#f6e1c6', pad: '#f6c9a8' };
  function bear(mode) {
    const eyes = mode === 'chew'
      ? `<path d="M104 108 Q116 94 128 108" stroke-width="5.5"/><path d="M172 108 Q184 94 196 108" stroke-width="5.5"/>`
      : eye(116, 104, 10) + eye(184, 104, 10);
    const mouth = mode === 'open'
      ? `<ellipse cx="150" cy="166" rx="24" ry="22" fill="#6b2a1e"/><ellipse cx="150" cy="178" rx="14" ry="7" fill="#ff7b8f" stroke="none"/>`
      : mode === 'chew'
        ? `<path d="M138 158 Q150 168 162 158" stroke-width="4.5"/>`
        : `<path d="M132 152 Q141 163 150 152 Q159 163 168 152" stroke-width="4.5"/>`;
    const cheeks = mode === 'chew' ? cheek(104, 146, 17, 11) + cheek(196, 146, 17, 11) : cheek(104, 140) + cheek(196, 140);
    return `
      <path d="M78 226 C46 210 34 178 42 150" tube="${B.fur}" stroke-width="26"/>
      <path d="M222 226 C254 210 266 178 258 150" tube="${B.fur}" stroke-width="26"/>
      <circle cx="42" cy="142" r="19" fill="${B.fur}"/><ellipse cx="42" cy="144" rx="9" ry="8" fill="${B.pad}" stroke="none"/>
      <circle cx="258" cy="142" r="19" fill="${B.fur}"/><ellipse cx="258" cy="144" rx="9" ry="8" fill="${B.pad}" stroke="none"/>
      <ellipse cx="150" cy="270" rx="98" ry="80" fill="${B.fur}"/>
      <ellipse cx="150" cy="286" rx="64" ry="52" fill="${B.cream}" stroke="none"/>
      <path d="M98 196 C112 214 188 214 202 196 C208 238 188 270 150 272 C112 270 92 238 98 196 Z" fill="#ffffff"/>
      <path d="M150 256 C134 244 134 228 144 228 C148 228 150 232 150 234 C150 232 152 228 156 228 C166 228 166 244 150 256 Z" fill="#ff6b5e" stroke-width="3"/>
      <circle cx="84" cy="52" r="28" fill="${B.fur}"/><circle cx="86" cy="54" r="15" fill="${B.pad}" stroke="none"/>
      <circle cx="216" cy="52" r="28" fill="${B.fur}"/><circle cx="214" cy="54" r="15" fill="${B.pad}" stroke="none"/>
      <circle cx="150" cy="118" r="82" fill="${B.fur}"/>
      <path d="M138 40 Q144 30 150 40 Q156 30 162 40" stroke-width="4"/>
      <ellipse cx="150" cy="154" rx="44" ry="34" fill="${B.cream}"/>
      <ellipse cx="150" cy="132" rx="13" ry="9" fill="${INK}" stroke="none"/>
      ${eyes}${mouth}${cheeks}
    `;
  }
  for (const m of ['', 'open', 'chew']) D.define('bear' + (m ? '-' + m : ''), { w: 300, h: 340, sw: 5.5, amp: 2.3, svg: bear(m) });

  // ───────── kitchen ─────────
  D.define('table', { w: 1000, h: 260, sw: 6, amp: 3, svg: `
    <path d="M-30 74 L1030 74 L1030 290 L-30 290 Z" fill="#ff8f8f"/>
    ${Array.from({ length: 52 }, (_, i) => { const r = Math.floor(i / 13), c = i % 13; return `<circle cx="${30 + c * 80 + (r % 2) * 40}" cy="${108 + r * 48}" r="8" fill="#fff4f0" stroke="none"/>`; }).join('')}
    <path d="M-30 28 L1030 28 L1030 76 L-30 76 Z" fill="#c98f5a"/>
    <path d="M60 50 L180 50 M420 46 L560 46 M760 52 L900 52" stroke="#a86f3f" stroke-width="4"/>
  `});
  D.define('plate', { w: 300, h: 90, sw: 5, amp: 2, svg: `
    <ellipse cx="150" cy="45" rx="146" ry="40" fill="#ffffff"/>
    <ellipse cx="150" cy="44" rx="104" ry="25" fill="none" stroke="#5aa9f0" stroke-width="3"/>
  `});
  D.define('window', { w: 240, h: 260, sw: 5, amp: 2, svg: `
    <path d="M40 22 L200 22 L200 222 L40 222 Z" fill="#bfe6fb"/>
    <circle cx="86" cy="74" r="20" fill="#ffd34e"/>
    <path d="M140 150 C130 150 128 136 140 134 C142 122 162 122 164 134 C176 132 178 150 166 150 Z" fill="#ffffff" stroke-width="3.5"/>
    <path d="M120 22 L120 222 M40 122 L200 122" stroke-width="6"/>
    <path d="M6 14 C40 70 26 170 52 252 L6 252 Z" fill="#ffb3c1"/>
    <path d="M234 14 C200 70 214 170 188 252 L234 252 Z" fill="#ffb3c1"/>
    <path d="M0 12 L240 12" stroke-width="7"/>
  `});
})();
