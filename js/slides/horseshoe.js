import {TextBox} from '../components.js?v=47';
import {onResize, mobileContentBottom, revealAfterFonts} from '../utils.js?v=47';
import {makePlot, lastView, LOCUS, EDGE, maxOf} from './coneSpace.js?v=47';

// From the cone space to the horseshoe. The slide opens on the 3D plot just
// as the last slide left it, then:
//  1. lines from black show that each one is a single color getting brighter
//  2. a flat slice sweeps out from black, crossing every line once
//  3. the plot fades and the camera turns to look at the slice face on
//  4. the slice slides flat into the familiar chromaticity diagram (CIE xy)
//
// The slice is the plane X+Y+Z = constant, which is what CIE xy is: x and y
// are X and Y on that plane. So the morph is exact, just a change of view.

// ── Geometry ───────────────────────────────────────────────────────────────

// CIE 2012 XYZ from the cone responses (same as the screens on the last slide)
const LMS_TO_XYZ = [[1.94735469, -1.41445123, 0.36476327], [0.68990272, 0.34832189, 0], [0, 0, 1.93485343]];
const toXyz = (l) => LMS_TO_XYZ.map(r => r[0] * l[0] + r[1] * l[1] + r[2] * l[2]);
// X+Y+Z as a sum of the cone responses
const PLANE = [0, 1, 2].map(j => LMS_TO_XYZ[0][j] + LMS_TO_XYZ[1][j] + LMS_TO_XYZ[2][j]);
const total = (l) => PLANE[0] * l[0] + PLANE[1] * l[1] + PLANE[2] * l[2];
// how far out the slice sits: as far as it can while still fitting in the box
const CUT = 0.9 * Math.min(...LOCUS.map(p => total(p.lms) / maxOf(p.lms)));

// where each wavelength's line crosses the slice, and where that is on the chart
const SLICE = LOCUS.map(p => {
  const X = toXyz(p.lms), sum = X[0] + X[1] + X[2];
  return {nm: p.nm, rgb: p.rgb, lms: p.lms.map(c => c * CUT / total(p.lms)), xy: [X[0] / sum, X[1] / sum]};
});

// a few lines from black, out to where they meet the walls of the box
const RAYS = [460, 490, 520, 560, 610].map(nm => {
  const i = LOCUS.findIndex(p => p.nm === nm);
  return {nm, rgb: LOCUS[i].rgb, end: EDGE[i].lms, cross: SLICE[i].lms};
});

// The view that looks at the slice face on, from the black side, so the
// slice isn't mirrored compared with the chart.
const FACE = (() => {
  // the slice's normal, in the plot's world (x = L, y = S, z = M), pointing
  // back toward black
  const n = [-PLANE[0], -PLANE[2], -PLANE[1]];
  return {yaw: Math.atan2(-n[0], n[2]), pitch: Math.atan2(n[1], Math.hypot(n[0], n[2]))};
})();

// The chart's colors: each point's chromaticity shown on an ordinary screen,
// washed out toward white where a screen can't reach it. Drawn once.
const CHART_X = 0.8, CHART_Y = 0.9;
let chartImage = null;
function getChartImage() {
  if (chartImage) return chartImage;
  const W = 240, H = 270;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  const img = g.createImageData(W, H);
  const gamma = (v) => v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const x = (i + 0.5) / W * CHART_X, y = Math.max(0.005, CHART_Y - (j + 0.5) / H * CHART_Y);
    const X = x / y, Z = (1 - x - y) / y;
    let rgb = [3.2406 * X - 1.5372 - 0.4986 * Z, -0.9689 * X + 1.8758 + 0.0415 * Z, 0.0557 * X - 0.204 + 1.057 * Z];
    const lo = Math.min(...rgb);
    if (lo < 0) rgb = rgb.map(v => v - lo);
    const hi = Math.max(...rgb) || 1;
    const k = (j * W + i) * 4;
    rgb.forEach((v, n) => { img.data[k + n] = Math.round(255 * gamma(v / hi)); });
    img.data[k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  chartImage = c;
  return c;
}

// ── 2D affine maps, [a, b, c, d, e, f] as in canvas: (x, y) to
//    (a x + c y + e, b x + d y + f) ──────────────────────────────────────────

const applyAff = (m, [x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

// the affine map that best takes points xy[i] to pts[i] (least squares)
function fitAff(xy, pts) {
  const G = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], bx = [0, 0, 0], by = [0, 0, 0];
  xy.forEach(([x, y], i) => {
    const v = [x, y, 1];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) G[r][c] += v[r] * v[c];
      bx[r] += v[r] * pts[i][0];
      by[r] += v[r] * pts[i][1];
    }
  });
  const det3 = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const D = det3(G);
  const solve = (b) => [0, 1, 2].map(k => det3(G.map((row, r) => row.map((v, c) => c === k ? b[r] : v))) / D);
  const [a, c, e] = solve(bx), [b, d, f] = solve(by);
  return [a, b, c, d, e, f];
}

// Blend two affine maps that both mirror (as a chart drawn with y up on a
// screen with y down does): turn, stretch and shift each part of the way,
// so the shape turns and straightens without collapsing on the way.
function blendAff(m0, m1, t) {
  const parts = (m) => {
    // un-mirror, then split into a turn and a symmetric stretch
    const a = m[0], b = m[1], c = -m[2], d = -m[3];
    const th = Math.atan2(b - c, a + d);
    const cs = Math.cos(th), sn = Math.sin(th);
    return {th, s: [cs * a + sn * b, cs * c + sn * d, -sn * a + cs * b, -sn * c + cs * d]};
  };
  const p0 = parts(m0), p1 = parts(m1);
  let dth = p1.th - p0.th;
  while (dth > Math.PI) dth -= 2 * Math.PI;
  while (dth < -Math.PI) dth += 2 * Math.PI;
  const th = p0.th + dth * t, cs = Math.cos(th), sn = Math.sin(th);
  const s = p0.s.map((v, i) => v + (p1.s[i] - v) * t);
  // turn back: [a c; b d] = R(th) S, then mirror again
  const a = cs * s[0] - sn * s[2], c = cs * s[1] - sn * s[3];
  const b = sn * s[0] + cs * s[2], d = sn * s[1] + cs * s[3];
  return [a, b, -c, -d, m0[4] + (m1[4] - m0[4]) * t, m0[5] + (m1[5] - m0[5]) * t];
}

// ── Timing ─────────────────────────────────────────────────────────────────

const ease = (t) => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
const span = (t, a, b) => ease((t - a) / (b - a));
// the camera swings round (still from above) while the slice sweeps out, so
// the slice opens up instead of being seen edge on, then tips down to face
// it as the 3D fades
const T = {raysIn: [0.3, 0.9], sweep: [0.9, 3.0], turn1: [0.9, 3.0], turn2: [3.5, 4.9], fade: [3.5, 4.4],
  flat: [4.9, 6.3], chart: [5.9, 6.7], end: 6.7};

const TEXT = [
  "Every line out from black is one color getting brighter.",
  "Cut through all those lines with one flat slice, and each color shows up once, " +
    "with its brightness thrown away.",
  "Lay the slice flat and you get the famous horseshoe: single wavelengths around the curve, " +
    "purples along the bottom, and every color you can see inside. " +
    "<span style='font-size:0.8em;color:#666'>(Its x and y are a standard remix of your L, M and S numbers.)</span>",
];
const PARA_AT = [0, T.sweep[0], T.chart[0]];

function slideText() {
  return TEXT.map((t, i) => `<span class="hs-p" style="display:block;transition:opacity 0.8s;` +
    `opacity:${i ? 0 : 1};margin-bottom:0.7em">${t}</span>`).join('');
}

// ── Slide ──────────────────────────────────────────────────────────────────

export function HorseshoeDesktop(rc, ctx, interval) {
  const text = TextBox({text: slideText(), x: 50, y: 60, w: 400, size: '24px', align: 'left', lineHeight: '1.35'});
  // the same row as the cone space slide, so the plot starts exactly where it was
  const row = document.createElement('div');
  row.style.cssText = 'position:absolute;left:455px;width:540px;top:50px;height:440px;' +
    'display:flex;flex-direction:row;justify-content:center;align-items:center;gap:6px;';
  document.getElementById('sandbox').appendChild(row);
  const plot = startHorseshoe(row, interval, false, text);
  plot.list.style.visibility = 'hidden';
  plot.setSize(390, 420);
  if (!fontsReady()) revealAfterFonts(row);
}

export function HorseshoeMobile(rc, ctx, interval) {
  const sandbox = document.getElementById('sandbox');
  const W = window.innerWidth;
  let fontSize = 19;
  const text = TextBox({text: slideText(), x: 15, y: 20, w: W - 30,
    size: fontSize + 'px', align: 'left', lineHeight: '1.25'});
  const col = document.createElement('div');
  col.style.cssText = 'position:absolute;left:0;right:0;display:flex;flex-direction:column;align-items:center;';
  sandbox.appendChild(col);
  const plot = startHorseshoe(col, interval, true, text);
  plot.list.style.display = 'none';
  if (!fontsReady()) revealAfterFonts(col);

  onResize([text], () => {
    const top = text.offsetTop + text.offsetHeight;
    const room = mobileContentBottom() - top;
    const side = Math.floor(Math.min(W, room, 440));
    if (side < 260 && fontSize > 15) {
      fontSize -= 1;
      text.style.fontSize = fontSize + 'px';
      return;
    }
    plot.setSize(W, Math.max(180, side));
    col.style.top = Math.round(top + Math.max(0, (room - side) / 2)) + 'px';
  });
}

const fontsReady = () => document.fonts && document.fonts.check('bold 20px Gaegu') && document.fonts.check('20px Gaegu');

function startHorseshoe(container, interval, phone, text) {
  const paras = Array.from(text.querySelectorAll('.hs-p'));
  const from = {...lastView};
  // turn the short way round to the face-on view
  let toYaw = FACE.yaw;
  while (toYaw - from.yaw > Math.PI) toYaw -= 2 * Math.PI;
  while (toYaw - from.yaw < -Math.PI) toYaw += 2 * Math.PI;
  // part way round, still looking from above, where the slice shows well
  const mid = {yaw: toYaw - 0.29, pitch: Math.min(0.6, Math.max(0.25, from.pitch))};

  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let start = null;
  let t = reduced ? T.end : 0;
  let done = false;

  const plot = makePlot(container, interval, phone, {still: true, view: from, tick, overlay});
  plot.hint.textContent = '';
  plot.hint.style.transition = 'opacity 0.6s';
  plot.canvas.addEventListener('click', () => {
    if (!done) return;
    done = false;
    start = null;
    t = 0;
    plot.hint.style.opacity = '0';
  });

  function tick() {
    if (done) return;
    const now = performance.now() / 1000;
    if (reduced) start = now - T.end;
    if (start === null) start = now;
    t = now - start;
    const DBG = new URLSearchParams(location.search).get('hst'); if (DBG) t = parseFloat(DBG); // DEBUG-REMOVE
    paras.forEach((p, i) => { p.style.opacity = t >= PARA_AT[i] ? '1' : '0'; });
    const a = span(t, ...T.turn1), b = span(t, ...T.turn2);
    const y1 = from.yaw + (mid.yaw - from.yaw) * a, p1 = from.pitch + (mid.pitch - from.pitch) * a;
    plot.setView(y1 + (toYaw - y1) * b, p1 + (FACE.pitch - p1) * b);
    plot.setSceneAlpha(1 - span(t, ...T.fade));
    plot.redraw();
    if (t >= T.end) {
      done = true;
      plot.hint.textContent = phone ? 'tap to play it again' : 'click to play it again';
      plot.hint.style.opacity = '1';
      plot.canvas.style.cursor = 'pointer';
    }
  }

  function overlay(ctx) {
    const W = plot.width(), H = plot.height();
    const fontPx = Math.max(14, Math.round(plot.side() / 22));
    const dotR = Math.max(2.5, plot.side() / 130);

    // where the chart ends up
    const ml = fontPx * 1.3, mb = fontPx * 2.4, mt = fontPx * 0.6, mr = fontPx * 0.6;
    const s = Math.min((W - ml - mr) / CHART_X, (H - mt - mb) / CHART_Y);
    const ox = ml + (W - ml - mr - CHART_X * s) / 2, oy = H - mb - (H - mt - mb - CHART_Y * s) / 2;
    const chartAff = [s, 0, 0, -s, ox, oy];

    // the slice, moving out from black during the sweep
    const out = 0.06 + 0.94 * span(t, ...T.sweep);
    const sliceIn = span(t, T.sweep[0], T.sweep[0] + 0.3);
    const xy = SLICE.map(p => p.xy);
    const proj = SLICE.map(p => plot.project(p.lms.map(c => c * out)));
    let pts = proj.map(p => [p[0], p[1]]);
    const flat = span(t, ...T.flat);
    if (flat > 0) {
      // from the face-on view to the chart: blend the maps, and let what
      // perspective adds fade away
      const faceAff = fitAff(xy, pts);
      const aff = blendAff(faceAff, chartAff, flat);
      pts = pts.map((p, i) => {
        const f = applyAff(faceAff, xy[i]), g = applyAff(aff, xy[i]);
        return [g[0] + (1 - flat) * (p[0] - f[0]), g[1] + (1 - flat) * (p[1] - f[1])];
      });
    }
    const aff = fitAff(xy, pts);

    // the lines from black, and the see-through plane of the slice
    const sceneFade = 1 - span(t, ...T.fade);
    const raysA = span(t, ...T.raysIn) * sceneFade;
    if (raysA > 0) {
      ctx.save();
      ctx.globalAlpha = raysA;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      const o = plot.project([0, 0, 0]);
      for (const r of RAYS) {
        const e = plot.project(r.end);
        ctx.strokeStyle = `rgb(${r.rgb.join(',')})`;
        ctx.beginPath();
        ctx.moveTo(o[0], o[1]);
        ctx.lineTo(e[0], e[1]);
        ctx.stroke();
      }
      ctx.restore();
    }
    if (sliceIn * sceneFade > 0) drawPlane(ctx, out * CUT, sliceIn * sceneFade);

    if (sliceIn > 0) {
      // the slice itself, colored like the chart
      ctx.save();
      ctx.globalAlpha = sliceIn * (0.85 + 0.15 * flat);
      ctx.beginPath();
      pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      ctx.closePath();
      ctx.save();
      ctx.clip();
      ctx.transform(...aff);
      ctx.transform(CHART_X / 240, 0, 0, -CHART_Y / 270, 0, CHART_Y);
      ctx.drawImage(getChartImage(), 0, 0);
      ctx.restore();
      ctx.strokeStyle = 'rgba(20,20,20,0.85)';
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.stroke();
      // where the lines cross it
      SLICE.forEach((p, i) => {
        if (p.nm % 10) return;
        ctx.fillStyle = `rgb(${p.rgb.join(',')})`;
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(pts[i][0], pts[i][1], dotR, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      });
      ctx.restore();
    }

    const chartA = span(t, ...T.chart);
    if (chartA > 0) drawChart(ctx, chartA, chartAff, pts, fontPx, dotR);
  }

  // the plane of the slice where it's inside the box, see-through
  function drawPlane(ctx, cut, alpha) {
    const hits = [];
    for (let a = 0; a < 8; a++) for (const axis of [0, 1, 2]) {
      if (a & (1 << axis)) continue;
      const p0 = [a & 1, (a >> 1) & 1, (a >> 2) & 1];
      const p1 = p0.slice();
      p1[axis] = 1;
      const v0 = total(p0) - cut, v1 = total(p1) - cut;
      if ((v0 < 0) === (v1 < 0)) continue;
      const k = v0 / (v0 - v1);
      hits.push(plot.project(p0.map((c, i) => c + (p1[i] - c) * k)));
    }
    if (hits.length < 3) return;
    const cx = hits.reduce((s, p) => s + p[0], 0) / hits.length, cy = hits.reduce((s, p) => s + p[1], 0) / hits.length;
    hits.sort((p, q) => Math.atan2(p[1] - cy, p[0] - cx) - Math.atan2(q[1] - cy, q[0] - cx));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(120,120,120,0.12)';
    ctx.strokeStyle = 'rgba(80,80,80,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    hits.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // axes, ticks and labels around the flat horseshoe
  function drawChart(ctx, alpha, m, pts, fontPx, dotR) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const at = (x, y) => applyAff(m, [x, y]);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    let p = at(0, CHART_Y);
    ctx.moveTo(p[0], p[1]);
    p = at(0, 0);
    ctx.lineTo(p[0], p[1]);
    p = at(CHART_X, 0);
    ctx.lineTo(p[0], p[1]);
    ctx.stroke();
    // ticks every 0.2, without numbers, which would crowd the wavelengths
    ctx.beginPath();
    for (let v = 0.2; v <= 0.81; v += 0.2) {
      const a = at(v, 0), b = at(0, v);
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(a[0], a[1] + 4);
      ctx.moveTo(b[0], b[1]);
      ctx.lineTo(b[0] - 4, b[1]);
    }
    ctx.stroke();
    ctx.font = `bold ${fontPx}px Gaegu`;
    ctx.fillStyle = '#555';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let q = at(CHART_X / 2, 0);
    ctx.fillText('x', q[0], q[1] + fontPx * 0.75);
    q = at(0, CHART_Y / 2);
    ctx.fillText('y', q[0] - fontPx * 0.7, q[1]);

    // white in the middle
    q = at(1 / 3, 1 / 3);
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(q[0], q[1], dotR, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    label(ctx, 'white', q[0] + dotR + 3, q[1] + fontPx * 0.1, '#333', Math.round(fontPx * 0.8), 'left');

    // wavelengths around the edge, pushed out from the middle
    const mid = at(0.33, 0.33);
    for (const nm of [460, 480, 490, 500, 510, 520, 540, 560, 580, 600, 620]) {
      const i = SLICE.findIndex(sp => sp.nm === nm);
      const [x, y] = pts[i];
      let dx = x - mid[0], dy = y - mid[1];
      const len = Math.hypot(dx, dy) || 1;
      dx /= len;
      dy /= len;
      label(ctx, String(nm), x + dx * (dotR + fontPx * 0.9), y + dy * (dotR + fontPx * 0.6), '#555',
        Math.round(fontPx * 0.72), 'center');
    }
    label(ctx, 'purples', ...applyAff(m, [0.5, 0.115]), '#7a3f9a',
      Math.round(fontPx * 0.8), 'center');
    ctx.restore();
  }

  function label(ctx, txt, x, y, color, size, align) {
    ctx.font = `bold ${size}px Gaegu`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 4;
    ctx.strokeText(txt, x, y);
    ctx.fillStyle = color;
    ctx.fillText(txt, x, y);
  }

  return plot;
}
