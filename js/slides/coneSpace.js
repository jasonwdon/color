import {TextBox} from '../components.js?v=47';
import {wavelengthToColor, onResize, mobileContentBottom, revealAfterFonts} from '../utils.js?v=47';

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

// Common kinds of screen, by what their red, green and blue light each do to
// the cones (from each standard's primaries and D65 white, through CIE 2012
// XYZ). share is how much of the solid of real colors each one fills, by
// volume in this plot, with the screen's white as bright as the box allows
// (computed from the SOLID mesh below; it checks out against random sampling).
// This is far less than the usual flat-chart figures (sRGB about 38% of the
// u'v' horseshoe), because those ignore brightness.
const SCREENS = [
  {name: 'sRGB', note: 'most screens', share: 10, line: '#222', dash: [6, 4],
    primaries: [[0.2679, 0.07985, 0.00999], [0.68211, 0.70217, 0.0616], [0.062, 0.08445, 0.49127]]},
  {name: 'Adobe RGB', note: 'photo editing', share: 14, line: '#6a3fc9', dash: [2, 3],
    primaries: [[0.37462, 0.11166, 0.01397], [0.57272, 0.66674, 0.03653], [0.06466, 0.08808, 0.51236]]},
  {name: 'Display P3', note: 'newer phones', share: 14, line: '#c2410c', dash: [10, 4],
    primaries: [[0.29826, 0.06663, 0], [0.64566, 0.7071, 0.02332], [0.0681, 0.09275, 0.53955]]},
  {name: 'Rec. 2020', note: 'future TVs', share: 20, line: '#0b7285', dash: [8, 3, 2, 3],
    primaries: [[0.35876, 0.04361, 0], [0.60909, 0.74007, 0.01451], [0.04415, 0.0828, 0.54835]]},
];

// cone colors from the cones slide
const L_COLOR = 'rgb(230,60,60)', M_COLOR = 'rgb(60,160,60)', S_COLOR = 'rgb(70,70,240)';

const TEXT =
  "Now back to physics and biology. We can graph the colors we can see on 3 axes, to show where " +
  "each color sits based on how much each cone is stimulated.<br><br>" +
  "Note that there's lots of empty space, because it's impossible to reach. Since the cones have " +
  "overlapping ranges, it's impossible to stimulate one without stimulating the others.<br><br>" +
  "Then we can trace the visible spectrum on the 3D shape as a line.";

// ── Geometry ───────────────────────────────────────────────────────────────

export const maxOf = (v) => Math.max(v[0], v[1], v[2]);

// the deck's own rainbow colors, as [r, g, b] 0-255
function spectrumRgb(nm) {
  return wavelengthToColor(nm).match(/[\d.]+(?=%)/g).map(p => Math.round(parseFloat(p) * 2.55));
}

// the spectral locus: the cone responses to equal amounts of each wavelength
export const LOCUS = CONE_DATA.map(([nm, l, m, s]) => ({nm, lms: [l, m, s], rgb: spectrumRgb(nm)}));

// The edge of the solid of real colors, where it meets the walls of the box:
// each wavelength's ray from black pushed out until one cone is at 1, then
// the purples (mixes of the two ends of the spectrum) to close the loop.
export const EDGE = (() => {
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

// The colors each screen can make: every mix of its red, green and blue, a
// slanted box. All share the same white (D65), as bright as the box allows,
// so the boxes can be compared and their volumes match the shares above.
const GAMUT_EDGES = [];
for (let a = 0; a < 8; a++) for (const bit of [1, 2, 4]) if (!(a & bit)) GAMUT_EDGES.push([a, a | bit]);
(() => {
  const white = [0, 1, 2].map(i => SCREENS[0].primaries.reduce((s, p) => s + p[i], 0));
  const k = 1 / maxOf(white);
  for (const scr of SCREENS) {
    scr.corners = [];
    for (let n = 0; n < 8; n++) {
      const mix = [n & 1, (n >> 1) & 1, (n >> 2) & 1];
      scr.corners.push({lms: [0, 1, 2].map(i => k * mix.reduce((s, on, j) => s + on * scr.primaries[j][i], 0)),
        color: `rgb(${mix.map(on => 255 * on).join(',')})`});
    }
  }
})();

// cone space (L, M, S) to world (x right, y up, z out of the screen), with
// the middle of the box at the origin: L along x, S up, M along z
const toWorld = ([l, m, s]) => [l - 0.5, s - 0.5, m - 0.5];

// The solid of real colors as a mesh of quads with outward normals. It's
// convex (every mix of two real colors is real too), so drawing only the
// quads that face the camera is enough to hide the back.
//  - the sides: each pair of neighboring rays from black out to the walls,
//    in bands that go from black to the ray's color
//  - the cap: where the solid meets the walls of the box, from white in the
//    middle out to the edge colors, bent to lie on the walls
const SOLID = (() => {
  const BANDS = 8, RINGS = 8;
  const n = EDGE.length;
  const quads = [];
  const scale = (v, t) => v.map(c => c * t);
  const onWall = (v) => v.map(c => c / maxOf(v));
  const mixV = (a, b, t) => a.map((c, i) => (1 - t) * c + t * b[i]);
  const avgRgb = (a, b) => a.map((c, i) => (c + b[i]) / 2);
  for (let i = 0; i < n; i++) {
    const a = EDGE[i], b = EDGE[(i + 1) % n];
    const rgb = avgRgb(a.rgb, b.rgb);
    for (let k = 0; k < BANDS; k++) {
      const t0 = k / BANDS, t1 = (k + 1) / BANDS;
      // brightness along the ray, gamma encoded like a screen would
      const bright = Math.pow((t0 + t1) / 2, 1 / 2.2);
      quads.push({side: i, pts: [scale(a.lms, t0), scale(b.lms, t0), scale(b.lms, t1), scale(a.lms, t1)],
        rgb: rgb.map(c => c * bright)});
    }
    const WHITE = [1, 1, 1];
    for (let k = 0; k < RINGS; k++) {
      const t0 = k / RINGS, t1 = (k + 1) / RINGS;
      const tm = (t0 + t1) / 2;
      quads.push({cap: i, pts: [onWall(mixV(WHITE, a.lms, t0)), onWall(mixV(WHITE, b.lms, t0)),
        onWall(mixV(WHITE, b.lms, t1)), onWall(mixV(WHITE, a.lms, t1))],
        rgb: [255, 255, 255].map((c, j) => (1 - tm) * c + tm * rgb[j]), outer: k === RINGS - 1});
    }
  }
  // outward normals, from a point inside the solid
  const inside = [0.4, 0.4, 0.4];
  const sub = (a, b) => a.map((c, i) => c - b[i]);
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  for (const q of quads) {
    const [p0, p1, p2, p3] = q.pts.map(toWorld);
    let nrm = cross(sub(p2, p0), sub(p3, p1));
    const mid = [0, 1, 2].map(j => (p0[j] + p1[j] + p2[j] + p3[j]) / 4);
    if (nrm.reduce((d, c, j) => d + c * (mid[j] - toWorld(inside)[j]), 0) < 0) nrm = nrm.map(c => -c);
    const len = Math.hypot(...nrm) || 1;
    q.normal = nrm.map(c => c / len);
    q.mid = mid;
  }
  return quads;
})();


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
// ── Slide ──────────────────────────────────────────────────────────────────

export function ConeSpaceDesktop(rc, ctx, interval) {
  TextBox({text: TEXT, x: 50, y: 60, w: 400, size: '24px', align: 'left', lineHeight: '1.35'});

  // the plot and the list of screens share the right side, above BACK/NEXT
  const row = document.createElement('div');
  row.style.cssText = 'position:absolute;left:455px;width:540px;top:50px;height:440px;' +
    'display:flex;flex-direction:row;justify-content:center;align-items:center;gap:6px;';
  document.getElementById('sandbox').appendChild(row);
  const plot = makePlot(row, interval, false);
  plot.setSize(390, 420);
  revealAfterFonts(row);
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
  const plot = makePlot(col, interval, true);
  revealAfterFonts(col);

  // the plot fills the room left between the text and the list of screens
  // under it; on a short screen the text shrinks a little first
  onResize([text, plot.list], () => {
    const top = text.offsetTop + text.offsetHeight + 6;
    const room = mobileContentBottom() - top;
    const toggleH = plot.list.offsetHeight + 2;
    const side = Math.floor(Math.min(W, room - toggleH, 440));
    if (side < 240 && fontSize > 15) {
      fontSize -= 1;
      text.style.fontSize = fontSize + 'px';
      return;
    }
    plot.setSize(W, Math.max(160, side));
    col.style.top = Math.round(top + Math.max(0, (room - side - toggleH) / 2)) + 'px';
  });
}

// The view the cone space plot was last left at, so the next slide can pick
// up from exactly there.
export const lastView = {yaw: -0.29, pitch: 0.33, zoom: 1};

// The 3D plot: a canvas you can drag to turn (and scroll or pinch to zoom),
// with a list of kinds of screen beside it (under it on phones), each
// showing the colors it can make as a dashed box inside the shape.
//  opts.still: no dragging or zooming (the next slide moves it itself)
//  opts.view: {yaw, pitch, zoom} to start from
//  opts.tick(): called every frame before drawing
//  opts.overlay(ctx): called after the plot is drawn, to draw on top
export function makePlot(container, interval, phone, opts = {}) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:relative;';
  container.appendChild(wrap);

  const canvas = document.createElement('canvas');
  // every touch on the plot turns it, so the page doesn't scroll or refresh
  canvas.style.cssText = opts.still ? 'display:block;touch-action:manipulation;'
    : 'display:block;touch-action:none;cursor:grab;';
  wrap.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  // the solid is drawn on its own layer first, so it can be laid over the
  // rest see-through in one piece without the seams between quads showing
  const layer = document.createElement('canvas');
  const lctx = layer.getContext('2d');

  const hint = document.createElement('div');
  hint.textContent = 'drag to turn it';
  hint.style.cssText = 'position:absolute;left:0;right:0;bottom:2px;text-align:center;pointer-events:none;' +
    'font-family:Gaegu,cursive;font-size:18px;font-weight:bold;color:#777;';
  wrap.appendChild(hint);

  // the list of screens, all off to start
  const picked = new Set();
  const list = document.createElement('div');
  list.style.cssText = 'font-family:Gaegu,cursive;color:#333;' + (phone
    ? 'display:flex;flex-wrap:wrap;justify-content:center;gap:0 12px;font-size:17px;padding:0 6px;'
    : 'display:flex;flex-direction:column;gap:8px;width:140px;font-size:19px;');
  if (!phone) {
    const head = document.createElement('div');
    head.innerHTML = '<b style="text-shadow:none">Screens</b><br>' +
      '<span style="font-size:15px;color:#777">what each can show, and how much of the shape that fills</span>';
    head.style.lineHeight = '1.1';
    list.appendChild(head);
  }
  for (const scr of SCREENS) {
    const item = document.createElement('label');
    item.style.cssText = 'display:flex;align-items:center;gap:4px;cursor:pointer;line-height:1.05;' +
      'touch-action:manipulation;-webkit-user-select:none;user-select:none;';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.style.cssText = `margin:0;width:16px;height:16px;flex:none;accent-color:${scr.line};cursor:pointer;`;
    box.addEventListener('change', () => {
      box.checked ? picked.add(scr) : picked.delete(scr);
      dirty = true;
    });
    // a short stretch of the screen's dashed line, so the list doubles as a key
    const dash = scr.dash.join(' ');
    const swatch = `<svg width="18" height="6" style="flex:none"><line x1="0" y1="3" x2="18" y2="3" ` +
      `stroke="${scr.line}" stroke-width="2" stroke-dasharray="${dash}"/></svg>`;
    const words = phone
      ? `<span>${scr.name} <span style="color:#777">${scr.share}%</span></span>`
      : `<span>${scr.name} <span style="color:#777">${scr.share}%</span><br>` +
        `<span style="font-size:15px;color:#777">${scr.note}</span></span>`;
    item.appendChild(box);
    item.insertAdjacentHTML('beforeend', swatch + words);
    list.appendChild(item);
  }
  if (phone) {
    const note = document.createElement('div');
    note.textContent = 'screens: what each can show, and how much of the shape that fills';
    note.style.cssText = 'flex-basis:100%;text-align:center;font-size:14px;color:#777;line-height:1.1;';
    list.prepend(note);
  }
  container.appendChild(list);

  let width = 300, height = 300;
  const side = () => Math.min(width, height);

  // Turns like a globe on a stand: side to side spins it around the S axis,
  // up and down tilts it toward or away from you, never past straight
  // above or below, so it can't end up upside down. Starts turned so all
  // three axes show, looking at the side with the rainbow curve on it.
  let yaw = opts.view ? opts.view.yaw : -0.29, pitch = opts.view ? opts.view.pitch : 0.33;
  const MAX_PITCH = Math.PI / 2 - 0.05;
  let rot = matMul(rotX(pitch), rotY(yaw));
  let zoom = opts.view ? opts.view.zoom : 1;
  let dirty = true;
  let sceneAlpha = 1; // the whole 3D plot fades out on the next slide
  const remember = () => { if (!opts.still) Object.assign(lastView, {yaw, pitch, zoom}); };
  remember();

  // ── dragging and zooming ──
  const pointers = new Map();
  let pinchDist = 0;
  if (!opts.still) canvas.addEventListener('pointerdown', (e) => {
    hint.remove();
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
      // the side facing you follows the finger: drag right and it turns
      // right, drag down and it tips down so you see more of the top
      const k = Math.PI / side(); // a drag across the plot is about half a turn
      yaw += (e.clientX - p.x) * k;
      pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch + (e.clientY - p.y) * k));
      rot = matMul(rotX(pitch), rotY(yaw));
      remember();
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
  if (!opts.still) canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    setZoom(zoom * Math.exp(-e.deltaY * 0.0015));
  }, {passive: false});
  function twoFingerDist() {
    const [a, b] = Array.from(pointers.values());
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
  function setZoom(z) {
    zoom = Math.min(2.5, Math.max(0.6, z));
    remember();
    dirty = true;
  }

  // ── drawing ──
  function setSize(w, h) {
    width = w;
    height = h;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layer.width = canvas.width;
    layer.height = canvas.height;
    lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
    const scale = side() * 0.42 * zoom;
    return [width / 2 + r[0] * scale * f, height / 2 - r[1] * scale * f, r[2]];
  }

  function draw() {
    if (!dirty) return;
    dirty = false;
    ctx.clearRect(0, 0, width, height);
    if (sceneAlpha > 0) drawScene();
    ctx.globalAlpha = 1;
    if (opts.overlay) opts.overlay(ctx);
  }

  function drawScene() {
    const fontPx = Math.max(14, Math.round(side() / 22));

    // where each point sits relative to the camera, for working out which
    // way things face
    const view = (w) => rot.map(row => row[0] * w[0] + row[1] * w[1] + row[2] * w[2]);
    const facing = (q) => {
      const n = view(q.normal), m = view(q.mid);
      return n[0] * -m[0] + n[1] * -m[1] + n[2] * (CAMERA - m[2]) > 0;
    };

    // the box's edges and the axes (three of its edges), drawn over the
    // see-through solid
    const O = [0, 0, 0];
    const o = project(O);
    const corners = [];
    for (let n = 0; n < 8; n++) corners.push([n & 1, (n >> 1) & 1, (n >> 2) & 1]);
    const axisColors = [L_COLOR, M_COLOR, S_COLOR];
    const boxEdges = [];
    for (let a = 0; a < 8; a++) for (const [bit, axis] of [[1, 0], [2, 1], [4, 2]]) {
      if (a & bit) continue;
      boxEdges.push({from: corners[a], to: corners[a | bit], axis: a === 0 ? axis : -1});
    }
    const drawEdges = () => {
      for (const e of boxEdges) {
        const pa = project(e.from), pb = project(e.to);
        ctx.strokeStyle = e.axis >= 0 ? axisColors[e.axis] : '#ccc';
        ctx.lineWidth = e.axis >= 0 ? 2.5 : 1;
        ctx.beginPath();
        ctx.moveTo(pa[0], pa[1]);
        ctx.lineTo(pb[0], pb[1]);
        ctx.stroke();
      }
    };

    // the solid: only the quads facing you, shaded by a light from the upper
    // left. It's drawn see-through so the screen's box inside shows.
    const LIGHT = [-0.45, 0.65, 0.62];
    const sideFront = new Set(), capFront = new Set();
    const shown = [];
    for (const q of SOLID) {
      if (!facing(q)) continue;
      if (q.side !== undefined) sideFront.add(q.side);
      else if (q.outer) capFront.add(q.cap);
      const n = view(q.normal);
      const shade = 0.6 + 0.45 * Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
      const pts = q.pts.map(project);
      shown.push({pts, depth: pts.reduce((d, p) => d + p[2], 0) / 4,
        color: `rgb(${q.rgb.map(c => Math.round(Math.min(255, c * shade))).join(',')})`});
    }
    shown.sort((a, b) => a.depth - b.depth);
    lctx.clearRect(0, 0, width, height);
    lctx.lineJoin = 'round';
    for (const q of shown) {
      lctx.fillStyle = q.color;
      lctx.strokeStyle = q.color; // covers the hairline gaps between quads
      lctx.lineWidth = 0.8;
      lctx.beginPath();
      lctx.moveTo(q.pts[0][0], q.pts[0][1]);
      for (let j = 1; j < 4; j++) lctx.lineTo(q.pts[j][0], q.pts[j][1]);
      lctx.closePath();
      lctx.fill();
      lctx.stroke();
    }
    // see-through, so the screens' colors show inside
    ctx.globalAlpha = 0.45 * sceneAlpha;
    ctx.drawImage(layer, 0, 0, width, height);
    ctx.globalAlpha = sceneAlpha;

    for (const scr of SCREENS) if (picked.has(scr)) drawScreen(scr);

    // the rim where the solid meets the walls
    const edge = EDGE.map(e => project(e.lms));
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    edge.forEach((p, i) => {
      if (!sideFront.has(i) && !capFront.has(i)) return;
      const q = edge[(i + 1) % edge.length];
      ctx.moveTo(p[0], p[1]);
      ctx.lineTo(q[0], q[1]);
    });
    ctx.stroke();

    drawEdges();

    // the spectral locus, which runs along the side of the solid: a dark
    // line with a dot every 10nm, only where that side faces you
    const locus = LOCUS.map(pt => ({...pt, p: project(pt.lms)}));
    ctx.strokeStyle = 'rgba(20,20,20,0.85)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < locus.length - 1; i++) {
      if (!sideFront.has(i)) continue;
      ctx.moveTo(locus[i].p[0], locus[i].p[1]);
      ctx.lineTo(locus[i + 1].p[0], locus[i + 1].p[1]);
    }
    ctx.stroke();
    const dotR = Math.max(2.5, side() / 130);
    const dotShown = (i) => sideFront.has(i) || sideFront.has(i - 1);
    locus.forEach((pt, i) => {
      if (pt.nm % 10 !== 0 || !dotShown(i)) return;
      ctx.fillStyle = `rgb(${pt.rgb.join(',')})`;
      ctx.strokeStyle = 'rgba(0,0,0,0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(pt.p[0], pt.p[1], dotR, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    });

    const axes = [
      {to: [1, 0, 0], label: 'L cone', color: L_COLOR},
      {to: [0, 1, 0], label: 'M cone', color: M_COLOR},
      {to: [0, 0, 1], label: 'S cone', color: S_COLOR},
    ];

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
    for (const nm of [450, 500, 550, 600]) {
      const i = locus.findIndex(q => q.nm === nm);
      if (!dotShown(i)) continue;
      const pt = locus[i];
      // beside the dot, on the side away from the middle, so it stays clear
      // of the axis labels at the top and bottom
      const side = pt.p[0] < width / 2 ? -1 : 1;
      label(nm + 'nm', pt.p[0] + side * (dotR + 3), pt.p[1], '#555', Math.round(fontPx * 0.8),
        side < 0 ? 'right' : 'left');
    }
    for (const ax of axes) {
      const p = project(ax.to.map(c => c * 1.13));
      label(ax.label, p[0], p[1], ax.color, fontPx);
    }
    label('black', o[0], o[1] + fontPx * 0.9, '#333', Math.round(fontPx * 0.85));
    ctx.textBaseline = 'alphabetic';
  }

  // a screen's colors: a slanted box spanned by its red, green and blue,
  // with a dot of each mix at its corners
  function drawScreen(scr) {
    const pts = scr.corners.map(c => ({...c, p: project(c.lms)}));
    ctx.save();
    ctx.setLineDash(scr.dash);
    ctx.lineWidth = 2;
    ctx.strokeStyle = scr.line;
    ctx.beginPath();
    for (const [a, b] of GAMUT_EDGES) {
      ctx.moveTo(pts[a].p[0], pts[a].p[1]);
      ctx.lineTo(pts[b].p[0], pts[b].p[1]);
    }
    ctx.stroke();
    ctx.restore();
    const r = Math.max(2.5, side() / 120);
    pts.slice(1).forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.strokeStyle = scr.line;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(pt.p[0], pt.p[1], r, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    });
  }

  // redraws after a drag or zoom (clearSandbox stops this when the slide
  // changes)
  interval.id = setInterval(() => {
    if (opts.tick) opts.tick();
    draw();
  }, 16);
  // redraw once the handwritten font is in, for the labels
  if (document.fonts) document.fonts.load('bold 16px Gaegu').then(() => { dirty = true; }, () => {});

  return {
    setSize, list, hint, canvas, project,
    width: () => width, height: () => height, side,
    view: () => ({yaw, pitch, zoom}),
    setView(y, p) { yaw = y; pitch = p; rot = matMul(rotX(pitch), rotY(yaw)); dirty = true; },
    setSceneAlpha(a) { sceneAlpha = a; dirty = true; },
    redraw() { dirty = true; },
  };
}
