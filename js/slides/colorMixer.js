import {TextBox, Button} from '../components.js';

// ── Color definitions ──────────────────────────────────────────────────────

const RGB_COLORS = [
  { label: 'R', r: 255, g: 0,   b: 0   },
  { label: 'G', r: 0,   g: 255, b: 0   },
  { label: 'B', r: 0,   g: 0,   b: 255 },
];

// RYB primaries rendered as their approximate RGB display values
const RYB_COLORS = [
  { label: 'R', r: 220, g: 20,  b: 20  },
  { label: 'Y', r: 240, g: 200, b: 0   },
  { label: 'B', r: 20,  g: 60,  b: 180 },
];

// ── Splotch animation ──────────────────────────────────────────────────────

const SPLOTCH_DURATION = 400; // ms
const MAX_RADIUS = 17;
const SPLOTCH_ALPHA = 0.55;

function easeOut(t) { return 1 - (1 - t) * (1 - t); }

// Returns a cleanup function
function animateSplotch(canvas, color, blendMode, onDone) {
  const ctx = canvas.getContext('2d');
  const x = 40 + Math.random() * (canvas.width - 80);
  const y = 30 + Math.random() * (canvas.height - 60);
  const start = performance.now();

  // Snapshot canvas before animation so each frame restores to this state,
  // preventing repeated blend operations from accumulating (e.g. multiply → black).
  const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Slightly irregular shape via a few random offsets
  const bumps = Array.from({length: 8}, () => 0.82 + Math.random() * 0.36);

  let raf;
  function frame(now) {
    const t = Math.min((now - start) / SPLOTCH_DURATION, 1);
    const r = easeOut(t) * MAX_RADIUS;

    ctx.putImageData(snapshot, 0, 0);

    ctx.save();
    ctx.globalCompositeOperation = blendMode;
    ctx.globalAlpha = SPLOTCH_ALPHA;
    ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`;

    ctx.beginPath();
    const steps = bumps.length;
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const radius = r * bumps[i % steps];
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    if (t < 1) {
      raf = requestAnimationFrame(frame);
    } else {
      onDone();
    }
  }
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}

// ── Panel setup ────────────────────────────────────────────────────────────

function makePanel(container, title, colors, blendMode, canvasW, canvasH, btnY, titleY, fontSize) {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `display:flex;flex-direction:column;align-items:center;gap:10px;`;

  // Title
  const titleEl = document.createElement('div');
  titleEl.innerHTML = title;
  titleEl.style.cssText = `font-family:Gaegu,cursive;font-size:${fontSize};font-weight:bold;color:#222;text-align:center;`;
  wrapper.appendChild(titleEl);

  // Canvas
  const canvas = document.createElement('canvas');
  canvas.width  = canvasW;
  canvas.height = canvasH;
  const bgColor = blendMode === 'lighter' ? '#000' : '#fff';
  canvas.style.cssText = `border:2px solid #aaa;border-radius:4px;background:${bgColor};display:block;`;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvasW, canvasH);
  wrapper.appendChild(canvas);

  // Buttons row
  const btnRow = document.createElement('div');
  btnRow.style.cssText = `display:flex;gap:12px;justify-content:center;`;

  let cancelAnim = null;
  colors.forEach(color => {
    const btn = document.createElement('wired-button');
    btn.className = 'object';
    btn.innerHTML = color.label;
    btn.style.cssText = `font-family:Gaegu,cursive;font-size:${fontSize};color:rgb(${color.r},${color.g},${color.b});position:static;`;
    btn.addEventListener('click', () => {
      if (cancelAnim) cancelAnim();
      cancelAnim = animateSplotch(canvas, color, blendMode, () => { cancelAnim = null; });
    });
    btnRow.appendChild(btn);
  });

  wrapper.appendChild(btnRow);

  // Reset button
  const reset = document.createElement('wired-button');
  reset.className = 'object';
  reset.innerHTML = 'reset';
  reset.style.cssText = `font-family:Gaegu,cursive;font-size:16px;color:#888;position:static;`;
  reset.addEventListener('click', () => {
    if (cancelAnim) { cancelAnim(); cancelAnim = null; }
    ctx.clearRect(0, 0, canvasW, canvasH);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasW, canvasH);
  });
  wrapper.appendChild(reset);

  container.appendChild(wrapper);
  return wrapper;
}

// ── Desktop ────────────────────────────────────────────────────────────────

export function ColorMixerDesktop(rc, ctx, interval) {
  const sandbox = document.getElementById('sandbox');

  TextBox({
    text: 'There are two ways to mix color.<br><br>' +
          '<b>Additive</b> mixing (light): start with black, add colored light — R+G+B = white.<br><br>' +
          '<b>Subtractive</b> mixing (paint): start with white, add pigment — each pigment absorbs light.',
    x: 50, y: 60, w: 380, size: '22px', align: 'left', lineHeight: '1.35',
  });

  // Flex row to hold both panels, positioned in sandbox
  const row = document.createElement('div');
  row.style.cssText = `position:absolute;left:460px;top:50px;display:flex;gap:40px;align-items:flex-start;`;
  sandbox.appendChild(row);

  makePanel(row, 'Light mixing (additive)', RGB_COLORS, 'lighter',  180, 200, 0, 0, '20px');
  makePanel(row, 'Paint mixing (subtractive)', RYB_COLORS, 'multiply', 180, 200, 0, 0, '20px');
}

// ── Mobile ─────────────────────────────────────────────────────────────────

export function ColorMixerMobile(rc, ctx, interval) {
  const sandbox = document.getElementById('sandbox');
  const W = window.innerWidth;

  TextBox({
    text: '<b>Additive</b> (light): start black, add R+G+B → white.<br>' +
          '<b>Subtractive</b> (paint): start white, add pigment → absorbs light.',
    x: 10, y: 55, w: W - 20, size: '20px', align: 'left', lineHeight: '1.3',
  });

  const panelW = Math.min(Math.floor((W - 30) / 2), 160);

  const row = document.createElement('div');
  row.style.cssText = `position:absolute;left:0;right:0;top:160px;display:flex;gap:10px;justify-content:center;align-items:flex-start;`;
  sandbox.appendChild(row);

  makePanel(row, 'Light<br>(additive)',    RGB_COLORS, 'lighter',  panelW, 160, 0, 0, '18px');
  makePanel(row, 'Paint<br>(subtractive)', RYB_COLORS, 'multiply', panelW, 160, 0, 0, '18px');
}
