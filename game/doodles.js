// All the art. Plain SVG shapes in a 200x200 box (unless noted); the engine adds the wobble.
// fill="…" colours a shape, stroke="none" drops its ink outline, tube="#colour" makes an
// outlined thick line (tails, legs, horns).
(function () {
  const D = window.Doodle;
  const INK = D.INK;
  const P = {
    orange: '#f6a04d', cream: '#fff4dc', pink: '#ff8fa3', tongue: '#ff7b8f', red: '#ff6b5e',
    tan: '#f3d9b1', brown: '#b77b4b', dbrown: '#8a5a36', gray: '#a9b8d6', lgray: '#c9d4ea',
    yellow: '#ffd34e', dyellow: '#f5bd2e', beak: '#ff9a3c', green: '#8fd16a', dgreen: '#5cb85c',
    grass: '#3d8b4d', blue: '#7cc4f0', dblue: '#4fa3d9', white: '#ffffff', goat: '#f2efe8',
    mane: '#d9773a', lion: '#f7c76b', lilac: '#b48cf0',
  };

  const eye = (x, y, r = 7) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}" stroke="none"/>` +
    `<circle cx="${x + r * 0.3}" cy="${y - r * 0.35}" r="${r * 0.36}" fill="#fff" stroke="none"/>`;
  const cheek = (x, y, rx = 9, ry = 5.5) =>
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${P.pink}" stroke="none" opacity=".75"/>`;
  const smile = (x, y, w = 10) => `<path d="M${x - w} ${y} Q${x} ${y + w * 0.9} ${x + w} ${y}" stroke-width="4"/>`;
  const wmouth = (x, y) => `<path d="M${x - 10} ${y} Q${x - 5} ${y + 6} ${x} ${y} Q${x + 5} ${y + 6} ${x + 10} ${y}" stroke-width="3.5"/>`;

  // bumpy (cloud / mane / tree-top) outline around an ellipse
  function scallop(cx, cy, rx, ry, n, depth = 0.18, rot = 0) {
    let d = '';
    for (let i = 0; i <= n; i++) {
      const a = rot + (i / n) * Math.PI * 2;
      const x = cx + rx * Math.cos(a), y = cy + ry * Math.sin(a);
      if (i === 0) { d += `M${x.toFixed(1)} ${y.toFixed(1)}`; continue; }
      const am = a - Math.PI / n;
      const k = 1 + depth * 2;
      d += `Q${(cx + rx * k * Math.cos(am)).toFixed(1)} ${(cy + ry * k * Math.sin(am)).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d + 'Z';
  }
  function starPath(cx, cy, ro, ri, pts = 5, rot = -Math.PI / 2) {
    let d = '';
    for (let i = 0; i < pts * 2; i++) {
      const r = i % 2 ? ri : ro, a = rot + (i * Math.PI) / pts;
      d += (i ? 'L' : 'M') + (cx + r * Math.cos(a)).toFixed(1) + ' ' + (cy + r * Math.sin(a)).toFixed(1);
    }
    return d + 'Z';
  }
  window.DoodleHelpers = { scallop, starPath };

  // ───────────────────────── animals ─────────────────────────
  D.define('cat', { svg: `
    <path d="M140 168 C186 164 192 124 168 104" tube="${P.orange}" stroke-width="13"/>
    <ellipse cx="100" cy="150" rx="50" ry="40" fill="${P.orange}"/>
    <ellipse cx="100" cy="160" rx="27" ry="22" fill="${P.cream}" stroke="none"/>
    <ellipse cx="78" cy="188" rx="15" ry="8" fill="${P.orange}"/>
    <ellipse cx="122" cy="188" rx="15" ry="8" fill="${P.orange}"/>
    <path d="M58 72 L60 20 L94 48 Z" fill="${P.orange}"/>
    <path d="M142 72 L140 20 L106 48 Z" fill="${P.orange}"/>
    <ellipse cx="100" cy="80" rx="49" ry="42" fill="${P.orange}"/>
    <path d="M64 50 L65 28 L82 43 Z" fill="${P.pink}" stroke="none"/>
    <path d="M136 50 L135 28 L118 43 Z" fill="${P.pink}" stroke="none"/>
    <path d="M88 40 L90 52"/><path d="M100 38 L100 52"/><path d="M112 40 L110 52"/>
    ${eye(82, 78)}${eye(118, 78)}
    <path d="M95 89 L105 89 L100 95 Z" fill="${P.pink}" stroke-width="3"/>
    ${wmouth(100, 97)}
    <path d="M58 88 L76 91" stroke-width="3"/><path d="M58 99 L76 96" stroke-width="3"/>
    <path d="M142 88 L124 91" stroke-width="3"/><path d="M142 99 L124 96" stroke-width="3"/>
    ${cheek(70, 94)}${cheek(130, 94)}
  `});

  D.define('dog', { svg: `
    <path d="M146 162 Q178 146 170 116" tube="${P.tan}" stroke-width="12"/>
    <ellipse cx="100" cy="152" rx="48" ry="38" fill="${P.tan}"/>
    <ellipse cx="80" cy="188" rx="15" ry="8" fill="${P.tan}"/>
    <ellipse cx="120" cy="188" rx="15" ry="8" fill="${P.tan}"/>
    <path d="M66 114 Q100 132 134 114" tube="${P.red}" stroke-width="8"/>
    <circle cx="100" cy="128" r="7" fill="${P.yellow}" stroke-width="3.5"/>
    <ellipse cx="100" cy="80" rx="46" ry="40" fill="${P.tan}"/>
    <ellipse cx="119" cy="72" rx="16" ry="14" fill="${P.brown}" stroke="none"/>
    <path d="M62 52 C38 60 40 108 62 112 C74 100 74 72 70 54 Z" fill="${P.brown}"/>
    <path d="M138 52 C162 60 160 108 138 112 C126 100 126 72 130 54 Z" fill="${P.brown}"/>
    ${eye(84, 76)}${eye(118, 74)}
    <ellipse cx="100" cy="98" rx="19" ry="13" fill="${P.cream}"/>
    <ellipse cx="100" cy="90" rx="8" ry="5.5" fill="${INK}" stroke="none"/>
    <path d="M96 103 Q100 120 107 103 Z" fill="${P.tongue}" stroke-width="3.5"/>
    <path d="M90 101 Q100 108 110 101" stroke-width="3.5"/>
    ${cheek(72, 96)}${cheek(128, 96)}
  `});

  D.define('cow', { svg: `
    <ellipse cx="100" cy="152" rx="56" ry="38" fill="${P.white}"/>
    <path d="M62 136 C54 128 56 152 70 154 C84 156 82 138 62 136 Z" fill="#4a4a52" stroke="none"/>
    <path d="M128 148 C120 140 118 166 134 168 C150 168 146 150 128 148 Z" fill="#4a4a52" stroke="none"/>
    <ellipse cx="76" cy="188" rx="14" ry="8" fill="#6b5b50"/>
    <ellipse cx="124" cy="188" rx="14" ry="8" fill="#6b5b50"/>
    <circle cx="100" cy="130" r="9" fill="${P.yellow}" stroke-width="3.5"/>
    <path d="M68 52 Q54 38 64 26" tube="#f2e2b0" stroke-width="8"/>
    <path d="M132 52 Q146 38 136 26" tube="#f2e2b0" stroke-width="8"/>
    <path d="M64 64 C46 54 30 64 36 76 C44 84 58 80 66 74 Z" fill="${P.white}"/>
    <path d="M136 64 C154 54 170 64 164 76 C156 84 142 80 134 74 Z" fill="${P.white}"/>
    <ellipse cx="100" cy="80" rx="42" ry="40" fill="${P.white}"/>
    <path d="M112 44 C126 40 136 56 128 66 C118 72 106 60 112 44 Z" fill="#4a4a52" stroke="none"/>
    <path d="M90 42 Q96 32 100 42 Q104 32 110 42" stroke-width="3.5"/>
    ${eye(84, 72)}${eye(116, 72)}
    <ellipse cx="100" cy="103" rx="30" ry="18" fill="#ffb3c1"/>
    <ellipse cx="90" cy="102" rx="4" ry="5" fill="${INK}" stroke="none"/>
    <ellipse cx="110" cy="102" rx="4" ry="5" fill="${INK}" stroke="none"/>
    ${cheek(66, 90)}${cheek(134, 90)}
  `});

  D.define('goat', { svg: `
    <ellipse cx="100" cy="154" rx="50" ry="34" fill="${P.goat}"/>
    <path d="M150 140 L166 128 L158 150 Z" fill="${P.goat}"/>
    <ellipse cx="78" cy="188" rx="12" ry="8" fill="#8a7a6a"/>
    <ellipse cx="122" cy="188" rx="12" ry="8" fill="#8a7a6a"/>
    <path d="M84 50 Q74 22 92 24" tube="#c9b79c" stroke-width="8"/>
    <path d="M116 50 Q126 22 108 24" tube="#c9b79c" stroke-width="8"/>
    <path d="M66 70 C44 64 30 78 40 86 C50 90 62 84 68 78 Z" fill="${P.goat}"/>
    <path d="M134 70 C156 64 170 78 160 86 C150 90 138 84 132 78 Z" fill="${P.goat}"/>
    <path d="M92 110 L100 138 L108 110 Z" fill="#e3dccb"/>
    <ellipse cx="100" cy="80" rx="36" ry="40" fill="${P.goat}"/>
    ${eye(86, 74)}${eye(114, 74)}
    <ellipse cx="94" cy="100" rx="2.5" ry="3.5" fill="${INK}" stroke="none"/>
    <ellipse cx="106" cy="100" rx="2.5" ry="3.5" fill="${INK}" stroke="none"/>
    ${smile(100, 106, 8)}
    ${cheek(76, 92, 7, 4.5)}${cheek(124, 92, 7, 4.5)}
  `});

  D.define('duck', { svg: `
    <path d="M150 136 L174 120 L164 150 Z" fill="${P.yellow}"/>
    <path d="M86 184 L76 194 L100 194 Z" fill="${P.beak}" stroke-width="3.5"/>
    <path d="M120 184 L110 194 L134 194 Z" fill="${P.beak}" stroke-width="3.5"/>
    <ellipse cx="106" cy="148" rx="54" ry="38" fill="${P.yellow}"/>
    <path d="M100 140 C114 126 146 130 146 150 C132 164 108 160 100 140 Z" fill="${P.dyellow}"/>
    <circle cx="80" cy="84" r="36" fill="${P.yellow}"/>
    <path d="M74 50 Q78 34 86 44 Q90 32 96 46" stroke-width="4"/>
    <path d="M52 90 C30 84 30 104 46 106 C56 106 60 98 56 90 Z" fill="${P.beak}"/>
    <path d="M38 97 L56 97" stroke-width="3"/>
    ${eye(76, 78)}
    ${cheek(98, 94)}
  `});

  D.define('rooster', { svg: `
    <path d="M118 132 C140 80 178 76 182 110 C166 106 148 116 132 146 Z" fill="${P.dgreen}"/>
    <path d="M124 140 C154 104 190 112 186 142 C170 134 152 140 136 156 Z" fill="${P.dblue}"/>
    <path d="M126 152 C156 136 184 150 174 172 C160 160 146 162 132 166 Z" fill="${P.orange}"/>
    <path d="M84 176 L82 192" tube="${P.beak}" stroke-width="5"/>
    <path d="M108 176 L110 192" tube="${P.beak}" stroke-width="5"/>
    <ellipse cx="96" cy="142" rx="44" ry="38" fill="#fbe3c4"/>
    <path d="M84 134 C98 118 128 126 124 148 C110 160 88 154 84 134 Z" fill="#e0955a"/>
    <path d="M60 60 C56 44 70 42 72 54 C70 38 84 38 84 52 C86 38 100 42 94 62 Z" fill="${P.red}"/>
    <circle cx="78" cy="86" r="29" fill="#fbe3c4"/>
    <path d="M52 84 L34 90 L52 96 Z" fill="${P.yellow}" stroke-width="3.5"/>
    <path d="M60 104 C54 116 66 122 70 108 Z" fill="${P.red}" stroke-width="3.5"/>
    ${eye(72, 80, 6)}
    ${cheek(88, 96, 7, 4.5)}
  `});

  D.define('fish', { svg: `
    <path d="M80 66 Q102 38 124 66 Z" fill="${P.dblue}"/>
    <path d="M144 100 L188 68 L180 100 L188 132 Z" fill="${P.orange}"/>
    <ellipse cx="96" cy="100" rx="58" ry="40" fill="${P.blue}"/>
    <path d="M104 78 Q114 100 104 122" stroke-width="3.5"/>
    <path d="M122 82 Q131 100 122 118" stroke-width="3.5"/>
    <path d="M90 118 Q100 130 110 120 L100 112 Z" fill="${P.dblue}" stroke-width="3.5"/>
    <circle cx="66" cy="92" r="13" fill="#fff"/>
    ${eye(68, 93, 6)}
    <path d="M42 108 Q48 114 54 106" stroke-width="3.5"/>
    ${cheek(64, 112, 7, 4.5)}
    <circle cx="26" cy="66" r="6" fill="none" stroke-width="3"/>
    <circle cx="18" cy="44" r="4" fill="none" stroke-width="3"/>
  `});

  D.define('elephant', { svg: `
    <ellipse cx="104" cy="150" rx="56" ry="40" fill="${P.gray}"/>
    <ellipse cx="76" cy="186" rx="16" ry="9" fill="${P.gray}"/>
    <ellipse cx="132" cy="186" rx="16" ry="9" fill="${P.gray}"/>
    <path d="M160 140 Q176 150 172 168" stroke-width="4"/>
    <ellipse cx="52" cy="82" rx="33" ry="37" fill="${P.lgray}"/>
    <ellipse cx="56" cy="84" rx="20" ry="24" fill="#f3c1d0" stroke="none"/>
    <ellipse cx="148" cy="82" rx="33" ry="37" fill="${P.lgray}"/>
    <ellipse cx="144" cy="84" rx="20" ry="24" fill="#f3c1d0" stroke="none"/>
    <circle cx="100" cy="82" r="40" fill="${P.gray}"/>
    <path d="M100 98 C100 132 122 142 136 120" tube="${P.gray}" stroke-width="18"/>
    <path d="M96 44 Q100 34 104 44" stroke-width="3.5"/>
    ${eye(84, 76)}${eye(116, 76)}
    ${cheek(76, 96)}${cheek(124, 96)}
  `});

  D.define('lion', { svg: `
    <path d="M148 164 Q184 156 176 124" tube="${P.lion}" stroke-width="9"/>
    <circle cx="176" cy="118" r="10" fill="${P.mane}"/>
    <ellipse cx="100" cy="156" rx="48" ry="34" fill="${P.lion}"/>
    <ellipse cx="78" cy="188" rx="15" ry="8" fill="${P.lion}"/>
    <ellipse cx="122" cy="188" rx="15" ry="8" fill="${P.lion}"/>
    <path d="${scallop(100, 82, 56, 54, 12, 0.13)}" fill="${P.mane}"/>
    <circle cx="70" cy="50" r="11" fill="${P.lion}"/>
    <circle cx="130" cy="50" r="11" fill="${P.lion}"/>
    <circle cx="100" cy="84" r="38" fill="${P.lion}"/>
    ${eye(86, 78)}${eye(114, 78)}
    <path d="M94 92 L106 92 L100 99 Z" fill="${P.dbrown}" stroke-width="3"/>
    ${wmouth(100, 101)}
    <circle cx="86" cy="104" r="1.8" fill="${INK}" stroke="none"/><circle cx="80" cy="99" r="1.8" fill="${INK}" stroke="none"/>
    <circle cx="114" cy="104" r="1.8" fill="${INK}" stroke="none"/><circle cx="120" cy="99" r="1.8" fill="${INK}" stroke="none"/>
    ${cheek(72, 94)}${cheek(128, 94)}
  `});

  D.define('frog', { svg: `
    <ellipse cx="50" cy="174" rx="25" ry="15" fill="${P.green}"/>
    <ellipse cx="150" cy="174" rx="25" ry="15" fill="${P.green}"/>
    <ellipse cx="100" cy="150" rx="56" ry="40" fill="${P.green}"/>
    <ellipse cx="100" cy="160" rx="33" ry="24" fill="#d8f0b0" stroke="none"/>
    <ellipse cx="80" cy="190" rx="13" ry="6" fill="${P.green}"/>
    <ellipse cx="120" cy="190" rx="13" ry="6" fill="${P.green}"/>
    <ellipse cx="100" cy="102" rx="54" ry="36" fill="${P.green}"/>
    <circle cx="70" cy="70" r="20" fill="${P.green}"/>
    <circle cx="130" cy="70" r="20" fill="${P.green}"/>
    <circle cx="70" cy="68" r="12" fill="#fff"/>
    <circle cx="130" cy="68" r="12" fill="#fff"/>
    ${eye(71, 69, 6)}${eye(129, 69, 6)}
    <path d="M68 108 Q100 132 132 108" stroke-width="4.5"/>
    ${cheek(64, 112)}${cheek(136, 112)}
  `});

  D.define('bird', { svg: `
    <path d="M150 122 L186 100 L182 136 Z" fill="${P.dblue}"/>
    <path d="M94 166 L92 188" tube="${P.beak}" stroke-width="4"/>
    <path d="M114 166 L116 188" tube="${P.beak}" stroke-width="4"/>
    <circle cx="104" cy="114" r="56" fill="${P.blue}"/>
    <ellipse cx="96" cy="136" rx="32" ry="27" fill="${P.cream}" stroke="none"/>
    <path d="M124 110 C144 98 164 120 148 142 C132 148 120 132 124 110 Z" fill="${P.dblue}"/>
    <path d="M98 60 Q92 42 106 44" stroke-width="4"/>
    ${eye(84, 96, 6)}${eye(112, 96, 6)}
    <path d="M90 108 L106 108 L98 121 Z" fill="${P.yellow}" stroke-width="3.5"/>
    ${cheek(72, 112, 7, 4.5)}${cheek(124, 112, 7, 4.5)}
  `});

  D.define('rabbit', { svg: `
    <path d="M78 72 C62 22 72 0 86 8 C98 22 96 50 94 70 Z" fill="${P.white}"/>
    <path d="M122 72 C138 22 128 0 114 8 C102 22 104 50 106 70 Z" fill="${P.white}"/>
    <path d="M81 60 C72 28 77 15 84 19 C90 30 90 46 88 60 Z" fill="${P.pink}" stroke="none"/>
    <path d="M119 60 C128 28 123 15 116 19 C110 30 110 46 112 60 Z" fill="${P.pink}" stroke="none"/>
    <circle cx="150" cy="166" r="14" fill="${P.white}"/>
    <ellipse cx="100" cy="156" rx="46" ry="34" fill="${P.white}"/>
    <ellipse cx="76" cy="188" rx="18" ry="8" fill="${P.white}"/>
    <ellipse cx="124" cy="188" rx="18" ry="8" fill="${P.white}"/>
    <ellipse cx="100" cy="94" rx="40" ry="36" fill="${P.white}"/>
    ${eye(86, 88)}${eye(114, 88)}
    <ellipse cx="100" cy="100" rx="5" ry="3.5" fill="${P.pink}" stroke-width="2.5"/>
    <path d="M96 106 L104 106 L104 114 L96 114 Z" fill="#fff" stroke-width="2.5"/>
    ${wmouth(100, 105)}
    ${cheek(74, 104)}${cheek(126, 104)}
  `});

  // ───────────────────────── balloons ─────────────────────────
  const BALLOONS = {
    red: '#ff6b5e', blue: '#5aa9f0', yellow: '#ffd34e', green: '#6cc66a', orange: '#ff9f43',
    pink: '#ff9ac1', purple: '#a98bf0', white: '#ffffff', black: '#4a4a55', brown: '#a8754a',
  };
  for (const [name, col] of Object.entries(BALLOONS)) {
    const dark = name === 'black' || name === 'brown';
    const faceInk = dark ? '#fff8ec' : INK;
    D.define('balloon-' + name, { w: 200, h: 300, svg: `
      <path d="M100 192 Q86 222 100 248 Q114 274 100 298" stroke-width="3"/>
      <path d="M90 198 L100 184 L110 198 Z" fill="${col}" stroke-width="4"/>
      <path d="M100 188 C58 186 30 150 30 102 C30 52 62 18 100 18 C138 18 170 52 170 102 C170 150 142 186 100 188 Z" fill="${col}"/>
      <path d="M58 96 C52 72 62 48 80 40 C74 58 70 76 68 98 Z" fill="#fff" stroke="none" opacity=".55"/>
      <circle cx="84" cy="104" r="6.5" fill="${faceInk}" stroke="none"/>
      <circle cx="116" cy="104" r="6.5" fill="${faceInk}" stroke="none"/>
      <path d="M88 120 Q100 132 112 120" stroke="${faceInk}" stroke-width="4"/>
      ${cheek(72, 120, 8, 5)}${cheek(128, 120, 8, 5)}
    `});
  }
  window.BALLOON_COLORS = BALLOONS;

  // ───────────────────────── scenery ─────────────────────────
  D.define('sun', { svg: `
    ${Array.from({ length: 10 }, (_, i) => {
      const a = (i / 10) * Math.PI * 2;
      const x1 = 100 + 66 * Math.cos(a), y1 = 100 + 66 * Math.sin(a);
      const x2 = 100 + 92 * Math.cos(a), y2 = 100 + 92 * Math.sin(a);
      return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}" tube="#ffb23e" stroke-width="8"/>`;
    }).join('')}
    <circle cx="100" cy="100" r="54" fill="${P.yellow}"/>
    <path d="M78 92 Q84 84 90 92" stroke-width="4.5"/><path d="M110 92 Q116 84 122 92" stroke-width="4.5"/>
    ${smile(100, 110, 14)}
    ${cheek(72, 110, 10, 6)}${cheek(128, 110, 10, 6)}
  `});

  D.define('cloud', { w: 240, h: 140, sw: 4.5, svg: `
    <path d="M42 112 C10 112 12 70 42 70 C40 38 82 26 100 50 C110 18 162 20 168 54 C198 40 228 66 210 90 C232 98 224 120 200 118 Z" fill="#ffffff"/>
  `});

  D.define('hill', { w: 1000, h: 260, sw: 5.5, amp: 3, svg: `
    <path d="M-20 140 C180 60 360 70 520 120 C680 166 820 76 1020 104 L1020 280 L-20 280 Z" fill="${P.green}"/>
    <path d="M-20 178 C200 128 400 156 560 176 C720 196 860 146 1020 166 L1020 280 L-20 280 Z" fill="#76c25e"/>
    ${[90, 230, 410, 640, 790, 930].map((x) => `<path d="M${x} 214 L${x - 4} 200 M${x + 8} 214 L${x + 10} 198 M${x + 16} 214 L${x + 22} 202" stroke="${P.grass}" stroke-width="4"/>`).join('')}
  `});

  D.define('flower-pink', { w: 60, h: 100, sw: 3.5, amp: 1.4, svg: `
    <path d="M30 98 Q26 70 30 40" stroke="${P.grass}" stroke-width="4"/>
    <path d="M28 76 C16 70 12 60 16 56 C24 58 28 66 28 76 Z" fill="${P.dgreen}" stroke-width="3"/>
    ${[0, 1, 2, 3, 4].map((i) => { const a = (i / 5) * Math.PI * 2 - Math.PI / 2; return `<circle cx="${(30 + 12 * Math.cos(a)).toFixed(1)}" cy="${(32 + 12 * Math.sin(a)).toFixed(1)}" r="9" fill="#ff9ac1"/>`; }).join('')}
    <circle cx="30" cy="32" r="7" fill="${P.yellow}"/>
  `});
  D.define('flower-blue', { w: 60, h: 100, sw: 3.5, amp: 1.4, svg: `
    <path d="M30 98 Q34 70 30 40" stroke="${P.grass}" stroke-width="4"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => { const a = (i / 6) * Math.PI * 2; return `<ellipse cx="${(30 + 11 * Math.cos(a)).toFixed(1)}" cy="${(32 + 11 * Math.sin(a)).toFixed(1)}" rx="8" ry="8" fill="${P.blue}"/>`; }).join('')}
    <circle cx="30" cy="32" r="7" fill="#fff4a8"/>
  `});

  D.define('house', { w: 160, h: 160, sw: 4.5, svg: `
    <path d="M30 72 L130 72 L130 156 L30 156 Z" fill="#ffe6b8"/>
    <path d="M16 78 L80 20 L144 78 Z" fill="${P.red}"/>
    <path d="M68 156 L68 116 Q80 104 92 116 L92 156" fill="#b77b4b"/>
    <path d="M40 92 L60 92 L60 112 L40 112 Z" fill="${P.blue}"/>
    <path d="M100 92 L120 92 L120 112 L100 112 Z" fill="${P.blue}"/>
  `});

  D.define('tree', { w: 400, h: 440, sw: 6, amp: 3, svg: `
    <path d="M168 440 C176 380 178 320 166 262 L234 262 C222 320 224 380 232 440 Z" fill="${P.brown}"/>
    <path d="M200 300 L200 360" stroke-width="4"/><path d="M186 340 L194 380" stroke-width="4"/>
    <path d="${scallop(200, 165, 178, 140, 14, 0.1)}" fill="${P.dgreen}"/>
    <path d="${scallop(196, 160, 120, 92, 10, 0.14, 0.3)}" fill="${P.green}" stroke="none"/>
    <path d="M150 432 L146 418 M160 434 L164 416 M246 434 L242 418 M256 432 L262 420" stroke="${P.grass}" stroke-width="4"/>
  `});

  D.define('apple', { w: 100, h: 100, sw: 4.5, amp: 1.6, svg: `
    <path d="M50 30 C30 14 6 30 9 56 C12 84 34 98 50 88 C66 98 88 84 91 56 C94 30 70 14 50 30 Z" fill="${P.red}"/>
    <path d="M24 46 C26 36 32 32 38 32" stroke="#fff" stroke-width="5" opacity=".7"/>
    <path d="M50 30 Q52 18 58 10" stroke-width="4"/>
    <path d="M55 22 C62 8 80 9 84 15 C76 26 64 27 55 22 Z" fill="${P.dgreen}" stroke-width="3.5"/>
    <circle cx="38" cy="58" r="4.5" fill="${INK}" stroke="none"/>
    <circle cx="62" cy="58" r="4.5" fill="${INK}" stroke="none"/>
    <path d="M42 68 Q50 75 58 68" stroke-width="3.5"/>
  `});

  D.define('star', { w: 100, h: 100, sw: 4.5, amp: 1.6, svg: `
    <path d="${starPath(50, 54, 46, 22)}" fill="${P.yellow}"/>
    <circle cx="41" cy="54" r="4" fill="${INK}" stroke="none"/>
    <circle cx="59" cy="54" r="4" fill="${INK}" stroke="none"/>
    <path d="M44 63 Q50 69 56 63" stroke-width="3.5"/>
    ${cheek(34, 62, 5, 3.5)}${cheek(66, 62, 5, 3.5)}
  `});

  D.define('moon', { svg: `
    <path d="M132 26 C70 26 36 78 46 128 C56 176 120 194 164 160 C112 162 84 122 92 84 C98 56 114 38 132 26 Z" fill="#fff1a8"/>
    <path d="M70 110 Q78 118 86 110" stroke-width="4"/>
    ${cheek(70, 126, 8, 5)}
  `});

  D.define('pond', { w: 1000, h: 520, sw: 6, amp: 3, svg: `
    <ellipse cx="500" cy="270" rx="488" ry="238" fill="${P.blue}"/>
    <ellipse cx="500" cy="285" rx="420" ry="185" fill="#93d0f4" stroke="none"/>
    <path d="M250 190 Q290 178 330 190" stroke="#fff" stroke-width="6"/>
    <path d="M660 380 Q700 368 740 380" stroke="#fff" stroke-width="6"/>
    <path d="M420 440 Q450 430 480 440" stroke="#fff" stroke-width="6"/>
  `});

  D.define('lilypad', { w: 100, h: 60, sw: 4, amp: 1.5, svg: `
    <path d="M50 30 L92 22 C96 40 76 54 50 54 C22 54 6 42 8 28 C12 12 32 6 50 8 Z" fill="${P.dgreen}"/>
    <circle cx="34" cy="22" r="7" fill="#ff9ac1" stroke-width="3"/>
  `});

  D.define('reeds', { w: 80, h: 200, sw: 4, amp: 1.6, svg: `
    <path d="M20 200 Q18 120 24 60" stroke="${P.grass}" stroke-width="5"/>
    <path d="M44 200 Q48 110 42 40" stroke="${P.grass}" stroke-width="5"/>
    <path d="M62 200 Q60 140 66 90" stroke="${P.grass}" stroke-width="5"/>
    <ellipse cx="24" cy="66" rx="8" ry="20" fill="${P.dbrown}"/>
    <ellipse cx="42" cy="48" rx="8" ry="22" fill="${P.dbrown}"/>
  `});

  D.define('bubble', { w: 720, h: 200, sw: 5, amp: 2.6, svg: `
    <path d="M46 26 C180 12 540 12 674 26 C712 34 714 166 674 174 C540 188 180 188 46 174 C8 166 8 34 46 26 Z" fill="#fffaf0"/>
  `});

  const CARD_FILLS = { a: '#ffe0b5', b: '#d6efff', c: '#dff5c9' };
  for (const [k, col] of Object.entries(CARD_FILLS)) {
    D.define('card-' + k, { w: 300, h: 340, sw: 5.5, amp: 2.6, svg: `
      <path d="M40 16 C120 8 180 8 260 16 C290 20 292 50 290 90 C288 170 290 250 286 310 C284 330 260 332 240 332 C160 336 120 336 60 332 C28 330 14 324 14 296 C10 220 12 140 14 60 C14 30 20 18 40 16 Z" fill="${col}"/>
    `});
  }

  // confetti bits
  const CONF = ['#ff6b5e', '#5aa9f0', '#ffd34e', '#6cc66a', '#ff9ac1', '#a98bf0'];
  CONF.forEach((c, i) => {
    D.define('cf-star-' + i, { w: 40, h: 40, sw: 3.5, amp: 1, svg: `<path d="${starPath(20, 21, 17, 8)}" fill="${c}"/>` });
    D.define('cf-dot-' + i, { w: 40, h: 40, sw: 3.5, amp: 1, svg: `<circle cx="20" cy="20" r="11" fill="${c}"/>` });
    D.define('cf-sq-' + i, { w: 40, h: 40, sw: 3.5, amp: 1, svg: `<path d="M4 26 Q12 8 20 22 T36 16" tube="${c}" stroke-width="5"/>` });
  });
  window.CONFETTI_COUNT = CONF.length;
})();
