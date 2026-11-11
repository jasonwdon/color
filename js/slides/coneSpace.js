import {TextBox} from '../components.js?v=42';
import {wavelengthToColor, onResize, mobileContentBottom, revealAfterFonts} from '../utils.js?v=42';

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
  "One last thing: here's every color at once.<br><br>" +
  "Every color you've ever seen comes down to 3 numbers: how hard your " +
  "<b style='color:red'>L</b>, <b style='color:green'>M</b>, and <b style='color:blue'>S</b> cones fire. " +
  "So every color is a point in this box.<br><br>" +
  "Single wavelengths trace the dark curve, and every mix of light lands inside the shape. " +
  "The rest is empty, because our cones overlap and no light can make those combinations.";

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

  // the plot gets the right side to itself, above BACK/NEXT
  const col = document.createElement('div');
  col.style.cssText = 'position:absolute;left:470px;width:500px;top:50px;height:440px;' +
    'display:flex;flex-direction:column;justify-content:center;align-items:center;gap:4px;';
  document.getElementById('sandbox').appendChild(col);
  const plot = makePlot(col, interval);
  plot.setSize(490, 410);
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
  // the solid is drawn on its own layer first, so it can be laid over the
  // rest see-through in one piece without the seams between quads showing
  const layer = document.createElement('canvas');
  const lctx = layer.getContext('2d');

  const hint = document.createElement('div');
  hint.textContent = 'drag to turn it';
  hint.style.cssText = 'position:absolute;left:0;right:0;bottom:2px;text-align:center;pointer-events:none;' +
    'font-family:Gaegu,cursive;font-size:18px;font-weight:bold;color:#777;';
  wrap.appendChild(hint);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.style.cssText = 'border:none;background:none;padding:2px 4px;cursor:pointer;color:#777;' +
    'font-family:Gaegu,cursive;font-size:18px;text-decoration:underline dotted;text-underline-offset:3px;' +
    'touch-action:manipulation;';
  container.appendChild(toggle);

  let width = 300, height = 300;
  const side = () => Math.min(width, height);
  let showScreen = false;
  const setToggleText = () => {
    toggle.textContent = showScreen ? 'hide the screen colors' : 'show the colors a screen can make';
  };
  setToggleText();
  toggle.addEventListener('click', () => { showScreen = !showScreen; setToggleText(); dirty = true; });

  // Turns like a globe on a stand: side to side spins it around the S axis,
  // up and down tilts it toward or away from you, never past straight
  // above or below, so it can't end up upside down. Starts turned so all
  // three axes show, looking at the side with the rainbow curve on it.
  let yaw = 0.45, pitch = 0.38;
  const MAX_PITCH = Math.PI / 2 - 0.05;
  let rot = matMul(rotX(pitch), rotY(yaw));
  let zoom = 1;
  let dirty = true;

  // ── dragging and zooming ──
  const pointers = new Map();
  let pinchDist = 0;
  canvas.addEventListener('pointerdown', (e) => {
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
    const fontPx = Math.max(14, Math.round(side() / 22));

    // where each point sits relative to the camera, for working out which
    // way things face
    const view = (w) => rot.map(row => row[0] * w[0] + row[1] * w[1] + row[2] * w[2]);
    const facing = (q) => {
      const n = view(q.normal), m = view(q.mid);
      return n[0] * -m[0] + n[1] * -m[1] + n[2] * (CAMERA - m[2]) > 0;
    };

    // the box's edges and the axes (three of its edges): one in front of
    // the solid when either of the box's faces beside it faces you
    const O = [0, 0, 0];
    const o = project(O);
    const corners = [];
    for (let n = 0; n < 8; n++) corners.push([n & 1, (n >> 1) & 1, (n >> 2) & 1]);
    const faceFacing = (axis, val) => {
      const n = [0, 0, 0];
      n[axis] = val ? 1 : -1;
      const c = [0.5, 0.5, 0.5];
      c[axis] = val;
      return facing({normal: toWorld(n.map(x => x + 0.5)), mid: toWorld(c)});
    };
    const axisColors = [L_COLOR, M_COLOR, S_COLOR];
    const boxEdges = [];
    for (let a = 0; a < 8; a++) for (const [bit, axis] of [[1, 0], [2, 1], [4, 2]]) {
      if (a & bit) continue;
      const others = [0, 1, 2].filter(x => x !== axis);
      // with the solid see-through, everything shows
      const front = showScreen || others.some(x => faceFacing(x, corners[a][x]));
      boxEdges.push({from: corners[a], to: corners[a | bit], front, axis: a === 0 ? axis : -1});
    }
    const drawEdges = (front) => {
      for (const e of boxEdges) {
        if (e.front !== front) continue;
        const pa = project(e.from), pb = project(e.to);
        ctx.strokeStyle = e.axis >= 0 ? axisColors[e.axis] : '#ccc';
        ctx.lineWidth = e.axis >= 0 ? 2.5 : 1;
        ctx.beginPath();
        ctx.moveTo(pa[0], pa[1]);
        ctx.lineTo(pb[0], pb[1]);
        ctx.stroke();
      }
    };
    drawEdges(false);

    // the solid: only the quads facing you, shaded by a light from the upper
    // left. With the screen colors showing it turns see-through so the
    // screen's box inside shows.
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
    ctx.globalAlpha = showScreen ? 0.45 : 1;
    ctx.drawImage(layer, 0, 0, width, height);
    ctx.globalAlpha = 1;

    if (showScreen) drawScreen();

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

    drawEdges(true);

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
    // an axis hidden behind the solid gets a fainter label
    axes.forEach((ax, i) => {
      const p = project(ax.to.map(c => c * 1.13));
      const e = boxEdges.find(b => b.axis === i);
      ctx.globalAlpha = e.front ? 1 : 0.5;
      label(ax.label, p[0], p[1], ax.color, fontPx);
    });
    ctx.globalAlpha = 1;
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
    const r = Math.max(3, side() / 100);
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
    ctx.font = `bold ${Math.max(13, Math.round(side() / 26))}px Gaegu`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.strokeText('screen white', w[0] + r + 4, w[1]);
    ctx.fillStyle = '#333';
    ctx.fillText('screen white', w[0] + r + 4, w[1]);
  }

  // redraws after a drag or zoom (clearSandbox stops this when the slide
  // changes)
  interval.id = setInterval(draw, 16);
  // redraw once the handwritten font is in, for the labels
  if (document.fonts) document.fonts.load('bold 16px Gaegu').then(() => { dirty = true; }, () => {});

  return {setSize, toggle};
}
