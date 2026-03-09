import {TextBox} from '../components.js';

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

// ── Blob rendering ────────────────────────────────────────────────────────

const SPLOTCH_DURATION = 400; // ms
const MAX_RADIUS = 38;
const SPLOTCH_ALPHA = 0.55;

function easeOut(t) { return 1 - (1 - t) * (1 - t); }

function drawBlob(ctx, blob) {
  ctx.fillStyle = `rgb(${blob.color.r},${blob.color.g},${blob.color.b})`;
  ctx.beginPath();
  const steps = blob.bumps.length;
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const radius = blob.r * blob.bumps[i % steps];
    const px = blob.x + Math.cos(angle) * radius;
    const py = blob.y + Math.sin(angle) * radius;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function redraw(ctx, blobs, blendMode, bgColor, canvasW, canvasH) {
  ctx.clearRect(0, 0, canvasW, canvasH);
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvasW, canvasH);

  ctx.save();
  ctx.globalCompositeOperation = blendMode;
  ctx.globalAlpha = SPLOTCH_ALPHA;
  for (const blob of blobs) drawBlob(ctx, blob);
  ctx.restore();
}

function hitTest(blobs, x, y) {
  for (let i = blobs.length - 1; i >= 0; i--) {
    const b = blobs[i];
    const hitR = b.r * 1.2;
    const dx = x - b.x, dy = y - b.y;
    if (dx * dx + dy * dy < hitR * hitR) return i;
  }
  return -1;
}

// ── Panel setup ────────────────────────────────────────────────────────────

function makePanel(container, title, colors, blendMode, canvasW, canvasH, fontSize) {
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
  canvas.style.cssText = `border:2px solid #aaa;border-radius:4px;background:${bgColor};display:block;cursor:default;touch-action:none;`;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvasW, canvasH);
  wrapper.appendChild(canvas);

  // Blob state
  const blobs = [];
  const draw = () => redraw(ctx, blobs, blendMode, bgColor, canvasW, canvasH);

  function addBlob(color) {
    const blob = {
      x: 50 + Math.random() * (canvasW - 100),
      y: 40 + Math.random() * (canvasH - 80),
      r: 0,
      color,
      bumps: Array.from({length: 8}, () => 0.82 + Math.random() * 0.36),
    };
    blobs.push(blob);

    const start = performance.now();
    function grow(now) {
      const t = Math.min((now - start) / SPLOTCH_DURATION, 1);
      blob.r = easeOut(t) * MAX_RADIUS;
      draw();
      if (t < 1) requestAnimationFrame(grow);
    }
    requestAnimationFrame(grow);
  }

  // Drag state
  let dragging = -1, dragOffX = 0, dragOffY = 0;

  function canvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return [
      (e.clientX - rect.left) * scaleX,
      (e.clientY - rect.top)  * scaleY,
    ];
  }

  canvas.addEventListener('pointerdown', (e) => {
    const [cx, cy] = canvasCoords(e);
    const idx = hitTest(blobs, cx, cy);
    if (idx !== -1) {
      // Bring to top
      blobs.push(blobs.splice(idx, 1)[0]);
      dragging = blobs.length - 1;
      dragOffX = cx - blobs[dragging].x;
      dragOffY = cy - blobs[dragging].y;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
      e.preventDefault();
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    const [cx, cy] = canvasCoords(e);
    if (dragging !== -1) {
      blobs[dragging].x = cx - dragOffX;
      blobs[dragging].y = cy - dragOffY;
      draw();
    } else {
      canvas.style.cursor = hitTest(blobs, cx, cy) !== -1 ? 'grab' : 'default';
    }
  });

  canvas.addEventListener('pointerup',     () => { dragging = -1; canvas.style.cursor = 'default'; });
  canvas.addEventListener('pointercancel', () => { dragging = -1; canvas.style.cursor = 'default'; });

  // Buttons row
  const btnRow = document.createElement('div');
  btnRow.style.cssText = `display:flex;gap:12px;justify-content:center;`;

  colors.forEach(color => {
    const btn = document.createElement('wired-button');
    btn.className = 'object';
    btn.innerHTML = color.label;
    btn.style.cssText = `font-family:Gaegu,cursive;font-size:${fontSize};color:rgb(${color.r},${color.g},${color.b});position:static;`;
    btn.addEventListener('click', () => addBlob(color));
    btnRow.appendChild(btn);
  });

  wrapper.appendChild(btnRow);

  // Reset button
  const reset = document.createElement('wired-button');
  reset.className = 'object';
  reset.innerHTML = 'reset';
  reset.style.cssText = `font-family:Gaegu,cursive;font-size:16px;color:#888;position:static;`;
  reset.addEventListener('click', () => {
    blobs.length = 0;
    draw();
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

  const row = document.createElement('div');
  row.style.cssText = `position:absolute;left:460px;top:50px;display:flex;gap:40px;align-items:flex-start;`;
  sandbox.appendChild(row);

  makePanel(row, 'Light mixing (additive)',    RGB_COLORS, 'lighter',  180, 200, '20px');
  makePanel(row, 'Paint mixing (subtractive)', RYB_COLORS, 'multiply', 180, 200, '20px');
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

  makePanel(row, 'Light<br>(additive)',    RGB_COLORS, 'lighter',  panelW, 160, '18px');
  makePanel(row, 'Paint<br>(subtractive)', RYB_COLORS, 'multiply', panelW, 160, '18px');
}
