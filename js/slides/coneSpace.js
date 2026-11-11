import {TextBox} from '../components.js?v=41';
import {wavelengthToColor, onResize, mobileContentBottom, revealAfterFonts} from '../utils.js?v=41';

// Every color is three numbers, how hard the L, M and S cones fire, so every
// color is a point in a 3D box. This slide draws that box and lets you turn it.

// Stockman & Sharpe (2000) 2 degree cone fundamentals, linear energy units,
// each cone scaled to a peak of 1: [wavelength nm, L, M, S]
const CONE_DATA = [
  [390,0.0004,0.0004,0.0095], [395,0.0011,0.001,0.0238], [400,0.0024,0.0023,0.0566],
  [405,0.0048,0.0047,0.1225], [410,0.0087,0.0088,0.233], [415,0.0134,0.0145,0.3814],
  [420,0.0184,0.0217,0.5436], [425,0.0229,0.0296,0.6745], [430,0.0282,0.0395,0.8026],
  [435,0.0341,0.0518,0.9036], [440,0.0403,0.0648,0.991], [445,0.0449,0.0759,0.9915],
  [450,0.0499,0.0871,0.9554], [455,0.0553,0.0982,0.8602], [460,0.0647,0.1163,0.7867],
  [465,0.0807,0.1445,0.7383], [470,0.0995,0.1759,0.6464], [475,0.1188,0.2054,0.5164],
  [480,0.1401,0.2358,0.3903], [485,0.164,0.2681,0.2903], [490,0.1916,0.3036,0.2119],
  [495,0.2329,0.3571,0.1605], [500,0.289,0.4278,0.1228], [505,0.3597,0.5156,0.0889],
  [510,0.4437,0.6155,0.0608], [515,0.5365,0.7192,0.0428], [520,0.6286,0.8166,0.0292],
  [525,0.7047,0.8855,0.0194], [530,0.7706,0.9357,0.0126], [535,0.8257,0.9689,0.0081],
  [540,0.881,0.9952,0.0051], [545,0.9191,0.9972,0.0032], [550,0.9402,0.9772,0.002],
  [555,0.9657,0.9566,0.0012], [560,0.9814,0.9178,0.0007], [565,0.9945,0.8732,0.0005],
  [570,1,0.8135,0.0003], [575,0.9923,0.7403,0.0002], [580,0.9694,0.6533,0.0001],
  [585,0.9556,0.5726,0.0001], [590,0.9277,0.4926,0], [595,0.886,0.4112,0],
  [600,0.834,0.3344,0], [605,0.7751,0.2649,0], [610,0.7057,0.2053,0],
  [615,0.6308,0.1562,0], [620,0.5542,0.1166,0], [625,0.4799,0.0856,0],
  [630,0.4007,0.0621,0], [635,0.3279,0.0445,0], [640,0.2658,0.0314,0],
  [645,0.2133,0.0218,0], [650,0.1651,0.0154,0], [655,0.1247,0.0107,0],
  [660,0.093,0.0073,0], [665,0.0685,0.005,0], [670,0.0499,0.0034,0],
  [675,0.0358,0.0024,0], [680,0.0254,0.0016,0], [685,0.0177,0.0011,0],
  [690,0.0122,0.0008,0], [695,0.0085,0.0005,0], [700,0.0059,0.0004,0],
];

// what a screen's red, green and blue light each do to the cones
const SCREEN_PRIMARIES = [
  {lms: [0.26794, 0.07987, 0.00999], color: 'rgb(255,0,0)'},
  {lms: [0.68209, 0.70216, 0.0616],  color: 'rgb(0,200,0)'},
  {lms: [0.06199, 0.08443, 0.49115], color: 'rgb(0,0,255)'},
];

// cone colors from the cones slide
const L_COLOR = 'rgb(230,60,60)', M_COLOR = 'rgb(60,160,60)', S_COLOR = 'rgb(70,70,240)';

const TEXT =
  "Hold that thought. First, let's map out every color.<br><br>" +
  "Every color you've ever seen comes down to 3 numbers: how hard your " +
  "<b style='color:red'>L</b>, <b style='color:green'>M</b>, and <b style='color:blue'>S</b> cones fire. " +
  "So every color is a point in this box.<br><br>" +
  "Each single wavelength lands on the curve, and every mix of light lands inside the shape it makes. " +
  "The rest of the box is empty, because our cones overlap and no light can fire them in those combinations.";

// ── Geometry ───────────────────────────────────────────────────────────────

const maxOf = (v) => Math.max(v[0], v[1], v[2]);

// the deck's own rainbow colors, as [r, g, b] 0-255
function spectrumRgb(nm) {
  return wavelengthToColor(nm).match(/[\d.]+(?=%)/g).map(p => Math.round(parseFloat(p) * 2.55));
}

// the spectral locus: the cone responses to equal amounts of each wavelength
const LOCUS = CONE_DATA.map(([nm, l, m, s]) => ({nm, lms: [l, m, s], rgb: spectrumRgb(nm)}));

// The edge of the solid of real colors, where it meets the walls of the box:
// each wavelength's ray from black pushed out until one cone is at 1, then
// the purples (mixes of the two ends of the spectrum) to close the loop.
const EDGE = (() => {
  const edge = LOCUS.map(p => ({lms: p.lms.map(c => c / maxOf(p.lms)), rgb: p.rgb}));
  const first = edge[0], last = edge[edge.length - 1];
  const PURPLES = 14;
  const mix = (a, b, t) => a.map((c, i) => (1 - t) * c + t * b[i]);
  for (let k = 1; k < PURPLES; k++) {
    const v = mix(last.lms, first.lms, k / PURPLES);
    edge.push({lms: v.map(c => c / maxOf(v)), rgb: mix(last.rgb, first.rgb, k / PURPLES).map(Math.round)});
  }
  return edge;
})();

// the colors a screen can make: every mix of its red, green and blue, scaled
// so that white sits inside the box
const SCREEN = (() => {
  const white = [0, 1, 2].map(i => SCREEN_PRIMARIES.reduce((s, p) => s + p.lms[i], 0));
  const k = 0.85 / maxOf(white);
  const corner = (r, g, b) => [0, 1, 2].map(i =>
    k * (r * SCREEN_PRIMARIES[0].lms[i] + g * SCREEN_PRIMARIES[1].lms[i] + b * SCREEN_PRIMARIES[2].lms[i]));
  const corners = [];
  for (let n = 0; n < 8; n++) {
    const r = n & 1, g = (n >> 1) & 1, b = (n >> 2) & 1;
    corners.push({lms: corner(r, g, b), color: `rgb(${255 * r},${255 * g},${255 * b})`});
  }
  // edges join corners that differ in one primary
  const edges = [];
  for (let a = 0; a < 8; a++) for (const bit of [1, 2, 4]) if (!(a & bit)) edges.push([a, a | bit]);
  return {corners, edges};
})();

// cone space (L, M, S) to world (x right, y up, z out of the screen), with
// the middle of the box at the origin: L along x, S up, M along z
const toWorld = ([l, m, s]) => [l - 0.5, s - 0.5, m - 0.5];

// ── Rotation ───────────────────────────────────────────────────────────────

function matMul(a, b) {
  return a.map(row => [0, 1, 2].map(j => row[0] * b[0][j] + row[1] * b[1][j] + row[2] * b[2][j]));
}
function rotX(a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [[1, 0, 0], [0, c, -s], [0, s, c]];
}
function rotY(a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [[c, 0, s], [0, 1, 0], [-s, 0, c]];
}
// keeps the rotation a clean rotation after many small turns
function orthonormalize(m) {
  const norm = (v) => { const l = Math.hypot(...v); return v.map(c => c / l); };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const x = norm(m[0]);
  const y = norm(m[1].map((c, i) => c - dot(m[1], x) * x[i]));
  const z = [x[1] * y[2] - x[2] * y[1], x[2] * y[0] - x[0] * y[2], x[0] * y[1] - x[1] * y[0]];
  return [x, y, z];
}

// ── Slide ──────────────────────────────────────────────────────────────────

export function ConeSpaceDesktop(rc, ctx, interval) {
  TextBox({text: TEXT, x: 50, y: 60, w: 400, size: '24px', align: 'left', lineHeight: '1.35'});

  // the plot gets the right side to itself, above BACK/NEXT
  const col = document.createElement('div');
  col.style.cssText = 'position:absolute;left:470px;width:500px;top:50px;height:440px;' +
    'display:flex;flex-direction:column;justify-content:center;align-items:center;gap:4px;';
  document.getElementById('sandbox').appendChild(col);
  const plot = makePlot(col, interval);
  plot.setSize(400);
  revealAfterFonts(col);
}

export function ConeSpaceMobile(rc, ctx, interval) {
  const sandbox = document.getElementById('sandbox');
  const W = window.innerWidth;
  let fontSize = 19;
  const text = TextBox({text: TEXT, x: 15, y: 20, w: W - 30,
    size: fontSize + 'px', align: 'left', lineHeight: '1.25'});

  const col = document.createElement('div');
  col.style.cssText = 'position:absolute;left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:2px;';
  sandbox.appendChild(col);
  const plot = makePlot(col, interval);
  revealAfterFonts(col);

  // the plot is a square that fills the room left between the text and the
  // buttons; on a short screen the text shrinks a little first
  onResize([text], () => {
    const top = text.offsetTop + text.offsetHeight + 6;
    const room = mobileContentBottom() - top;
    const toggleH = plot.toggle.offsetHeight + 2;
    const side = Math.floor(Math.min(W - 16, room - toggleH, 420));
    if (side < 240 && fontSize > 15) {
      fontSize -= 1;
      text.style.fontSize = fontSize + 'px';
      return;
    }
    plot.setSize(Math.max(160, side));
    col.style.top = Math.round(top + Math.max(0, (room - side - toggleH) / 2)) + 'px';
  });
}

// The 3D plot: a canvas you can drag to turn (and scroll or pinch to zoom),
// with a button under it that shows the colors a screen can make.
function makePlot(container, interval) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:relative;';
  container.appendChild(wrap);

  const canvas = document.createElement('canvas');
  // every touch on the plot turns it, so the page doesn't scroll or refresh
  canvas.style.cssText = 'display:block;touch-action:none;cursor:grab;';
  wrap.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const hint = document.createElement('div');
  hint.textContent = 'drag to spin it around';
  hint.style.cssText = 'position:absolute;left:0;right:0;bottom:2px;text-align:center;pointer-events:none;' +
    'font-family:Gaegu,cursive;font-size:18px;font-weight:bold;color:#777;';
  wrap.appendChild(hint);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.style.cssText = 'border:none;background:none;padding:2px 4px;cursor:pointer;color:#777;' +
    'font-family:Gaegu,cursive;font-size:18px;text-decoration:underline dotted;text-underline-offset:3px;' +
    'touch-action:manipulation;';
  container.appendChild(toggle);

  let side = 300;
  let showScreen = false;
  const setToggleText = () => {
    toggle.textContent = showScreen ? 'hide the screen colors' : 'show the colors a screen can make';
  };
  setToggleText();
  toggle.addEventListener('click', () => { showScreen = !showScreen; setToggleText(); dirty = true; });

  // start turned so all three axes show, then spin slowly until touched
  let rot = matMul(rotX(0.42), rotY(-0.75));
  let zoom = 1;
  let spinning = true;
  let dirty = true;

  // ── dragging and zooming ──
  const pointers = new Map();
  let pinchDist = 0;
  const stopSpin = () => {
    spinning = false;
    hint.remove();
  };
  canvas.addEventListener('pointerdown', (e) => {
    stopSpin();
    pointers.set(e.pointerId, {x: e.clientX, y: e.clientY});
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
    if (pointers.size === 2) pinchDist = twoFingerDist();
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    if (pointers.size === 1) {
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      const k = 2.8 / side; // a full drag across the plot is about half a turn
      rot = orthonormalize(matMul(rotX(dy * k), matMul(rotY(dx * k), rot)));
      dirty = true;
    }
    p.x = e.clientX;
    p.y = e.clientY;
    if (pointers.size === 2) {
      const d = twoFingerDist();
      if (pinchDist > 0 && d > 0) setZoom(zoom * d / pinchDist);
      pinchDist = d;
    }
  });
  const release = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchDist = 0;
    if (pointers.size === 0) canvas.style.cursor = 'grab';
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    stopSpin();
    setZoom(zoom * Math.exp(-e.deltaY * 0.0015));
  }, {passive: false});
  function twoFingerDist() {
    const [a, b] = Array.from(pointers.values());
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
  function setZoom(z) {
    zoom = Math.min(2.5, Math.max(0.6, z));
    dirty = true;
  }

  // ── drawing ──
  function setSize(s) {
    side = s;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(s * dpr);
    canvas.height = Math.round(s * dpr);
    canvas.style.width = s + 'px';
    canvas.style.height = s + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dirty = true;
    draw();
  }

  // project a point in cone space to the canvas: [x, y, depth], with a
  // gentle perspective (larger depth is nearer)
  const CAMERA = 3.2;
  function project(lms) {
    const w = toWorld(lms);
    const r = rot.map(row => row[0] * w[0] + row[1] * w[1] + row[2] * w[2]);
    const f = CAMERA / (CAMERA - r[2]);
    const scale = side * 0.36 * zoom;
    return [side / 2 + r[0] * scale * f, side / 2 - r[1] * scale * f, r[2]];
  }
  // fainter the farther back it is, so the front reads as the front
  const fade = (depth) => 0.45 + 0.55 * Math.min(1, Math.max(0, (depth + 0.9) / 1.8));

  function draw() {
    if (!dirty) return;
    dirty = false;
    ctx.clearRect(0, 0, side, side);
    const fontPx = Math.max(14, Math.round(side / 22));

    // the box: light edges, except the three from black, which are the axes
    const O = [0, 0, 0];
    const corners = [];
    for (let n = 0; n < 8; n++) corners.push([n & 1, (n >> 1) & 1, (n >> 2) & 1]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#ccc';
    ctx.beginPath();
    for (let a = 1; a < 8; a++) for (const bit of [1, 2, 4]) {
      if (a & bit) continue;
      const pa = project(corners[a]), pb = project(corners[a | bit]);
      ctx.moveTo(pa[0], pa[1]);
      ctx.lineTo(pb[0], pb[1]);
    }
    ctx.stroke();

    // the solid of real colors: a fan of triangles from black out to its
    // edge on the walls of the box, sorted back to front, each shading from
    // black to its color
    const o = project(O);
    const edge = EDGE.map(e => ({...e, p: project(e.lms)}));
    const tris = edge.map((e, i) => {
      const n = edge[(i + 1) % edge.length];
      return {a: e, b: n, depth: (o[2] + e.p[2] + n.p[2]) / 3};
    }).sort((t, u) => t.depth - u.depth);
    for (const {a, b} of tris) {
      const mx = (a.p[0] + b.p[0]) / 2, my = (a.p[1] + b.p[1]) / 2;
      const grad = ctx.createLinearGradient(o[0], o[1], mx, my);
      grad.addColorStop(0, 'rgba(0,0,0,0.3)');
      grad.addColorStop(1, `rgba(${a.rgb.join(',')},0.38)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(o[0], o[1]);
      ctx.lineTo(a.p[0], a.p[1]);
      ctx.lineTo(b.p[0], b.p[1]);
      ctx.closePath();
      ctx.fill();
    }

    // where the solid meets the walls
    ctx.lineWidth = 2;
    edge.forEach((e, i) => {
      const n = edge[(i + 1) % edge.length];
      ctx.globalAlpha = fade((e.p[2] + n.p[2]) / 2) * 0.8;
      ctx.strokeStyle = `rgb(${e.rgb.join(',')})`;
      ctx.beginPath();
      ctx.moveTo(e.p[0], e.p[1]);
      ctx.lineTo(n.p[0], n.p[1]);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    // axes from black along each cone, labeled at the far end
    const axes = [
      {to: [1, 0, 0], label: 'L cone', color: L_COLOR},
      {to: [0, 1, 0], label: 'M cone', color: M_COLOR},
      {to: [0, 0, 1], label: 'S cone', color: S_COLOR},
    ];
    ctx.lineWidth = 2.5;
    for (const ax of axes) {
      const p = project(ax.to);
      ctx.strokeStyle = ax.color;
      ctx.beginPath();
      ctx.moveTo(o[0], o[1]);
      ctx.lineTo(p[0], p[1]);
      ctx.stroke();
    }

    if (showScreen) drawScreen();

    // the spectral locus: one dot per wavelength, joined into the curve
    const locus = LOCUS.map(pt => ({...pt, p: project(pt.lms)}));
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let i = 0; i < locus.length - 1; i++) {
      const a = locus[i], b = locus[i + 1];
      ctx.globalAlpha = fade((a.p[2] + b.p[2]) / 2);
      ctx.strokeStyle = `rgb(${a.rgb.join(',')})`;
      ctx.beginPath();
      ctx.moveTo(a.p[0], a.p[1]);
      ctx.lineTo(b.p[0], b.p[1]);
      ctx.stroke();
    }
    const dotR = Math.max(2.5, side / 130);
    locus.filter(pt => pt.nm % 10 === 0).sort((a, b) => a.p[2] - b.p[2]).forEach(pt => {
      ctx.globalAlpha = fade(pt.p[2]);
      ctx.fillStyle = `rgb(${pt.rgb.join(',')})`;
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(pt.p[0], pt.p[1], dotR, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    // labels last, so nothing covers them
    ctx.lineJoin = 'round';
    const label = (txt, x, y, color, size, align = 'center') => {
      ctx.font = `bold ${size}px Gaegu`;
      ctx.textAlign = align;
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 4;
      ctx.strokeText(txt, x, y);
      ctx.fillStyle = color;
      ctx.fillText(txt, x, y);
    };
    for (const nm of [450, 500, 550, 600, 650]) {
      const pt = locus.find(q => q.nm === nm);
      // nudge the label away from the middle of the box
      const dx = pt.p[0] - side / 2, dy = pt.p[1] - side / 2;
      const len = Math.hypot(dx, dy) || 1;
      label(nm + 'nm', pt.p[0] + dx / len * fontPx * 1.6, pt.p[1] + dy / len * fontPx * 0.9,
        '#555', Math.round(fontPx * 0.8));
    }
    for (const ax of axes) {
      const p = project(ax.to.map(c => c * 1.13));
      label(ax.label, p[0], p[1], ax.color, fontPx);
    }
    label('black', o[0], o[1] + fontPx * 0.9, '#333', Math.round(fontPx * 0.85));
    ctx.textBaseline = 'alphabetic';
  }

  // the screen's colors: a slanted box spanned by its red, green and blue
  function drawScreen() {
    const pts = SCREEN.corners.map(c => ({...c, p: project(c.lms)}));
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(40,40,40,0.75)';
    ctx.beginPath();
    for (const [a, b] of SCREEN.edges) {
      ctx.moveTo(pts[a].p[0], pts[a].p[1]);
      ctx.lineTo(pts[b].p[0], pts[b].p[1]);
    }
    ctx.stroke();
    ctx.restore();
    const r = Math.max(3, side / 100);
    pts.slice(1).forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(pt.p[0], pt.p[1], r, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    });
    const w = pts[7].p;
    ctx.font = `bold ${Math.max(13, Math.round(side / 26))}px Gaegu`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.strokeText('screen white', w[0] + r + 4, w[1]);
    ctx.fillStyle = '#333';
    ctx.fillText('screen white', w[0] + r + 4, w[1]);
  }

  // spin slowly about the S axis until someone grabs it (clearSandbox stops
  // this when the slide changes)
  interval.id = setInterval(() => {
    if (spinning) {
      rot = matMul(rot, rotY(0.006));
      dirty = true;
    }
    draw();
  }, 16);
  // redraw once the handwritten font is in, for the labels
  if (document.fonts) document.fonts.load('bold 16px Gaegu').then(() => { dirty = true; }, () => {});

  return {setSize, toggle};
}
