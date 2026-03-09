import {TextBox} from '../components.js';

// ── Color definitions ──────────────────────────────────────────────────────

const RGB_COLORS = [
  { label: 'R', r: 255, g: 0,   b: 0   },
  { label: 'G', r: 0,   g: 255, b: 0   },
  { label: 'B', r: 0,   g: 0,   b: 255 },
];

const RYB_COLORS = [
  { label: 'R', r: 255, g: 0,   b: 0   },
  { label: 'Y', r: 245, g: 210, b: 40  },
  { label: 'B', r: 0,   g: 0,   b: 255 },
];

// ── RYB → RGB trilinear interpolation ────────────────────────────────────

// Corners of the RYB cube mapped to RGB (Gossett & Chen approach)
const C000 = [255, 255, 255]; // white  (no pigment)
const C100 = [255, 0,   0  ]; // red
const C010 = [245, 210, 40 ]; // yellow
const C001 = [0,   0,   255]; // blue
const C110 = [255, 128, 0  ]; // red+yellow  = orange
const C101 = [128, 0,   128]; // red+blue    = purple
const C011 = [0,   130, 0  ]; // yellow+blue = green
const C111 = [20,  20,  20 ]; // all three   ≈ black

function rybToRgb(r, y, b) {
  const result = new Array(3);
  for (let ch = 0; ch < 3; ch++) {
    result[ch] = Math.round(
      C000[ch] * (1-r) * (1-y) * (1-b) +
      C100[ch] * r     * (1-y) * (1-b) +
      C010[ch] * (1-r) * y     * (1-b) +
      C001[ch] * (1-r) * (1-y) * b     +
      C110[ch] * r     * y     * (1-b) +
      C101[ch] * r     * (1-y) * b     +
      C011[ch] * (1-r) * y     * b     +
      C111[ch] * r     * y     * b
    );
  }
  return result;
}

// ── Brush helpers (also used for pre-fill) ─────────────────────────────────

function paintBristleLine(lctx, x1, y1, x2, y2, strokeStyle, bSize) {
  const dx = x2 - x1, dy = y2 - y1;
  const dist = Math.sqrt(dx*dx + dy*dy);
  if (dist < 0.5) return;
  // normalized perpendicular
  const perpX = -dy / dist, perpY = dx / dist;
  const halfBrush = bSize / 4;
  lctx.save();
  lctx.lineCap = 'round';
  lctx.strokeStyle = strokeStyle;
  for (let i = 0; i < 18; i++) {
    const t = (i / 17 - 0.5) * 2;
    // slightly uneven spread — not perfectly uniform
    const spread = t * halfBrush * (0.75 + Math.random() * 0.5);
    const ox = perpX * spread, oy = perpY * spread;

    // trim each bristle slightly at start/end so lengths vary
    const s = Math.random() * 0.06, e = 1 - Math.random() * 0.06;
    const bx1 = x1 + dx*s + ox, by1 = y1 + dy*s + oy;
    const bx2 = x1 + dx*e + ox, by2 = y1 + dy*e + oy;

    // quadratic bezier: control point wobbles perpendicular → curved bristle
    const wobble = (Math.random() - 0.5) * bSize * 0.35;
    const cpx = (bx1+bx2)/2 + perpX * wobble;
    const cpy = (by1+by2)/2 + perpY * wobble;

    lctx.globalAlpha = 0.07 + Math.random() * 0.22;
    lctx.lineWidth = 0.5 + Math.random() * 2;
    lctx.beginPath();
    lctx.moveTo(bx1, by1);
    lctx.quadraticCurveTo(cpx, cpy, bx2, by2);
    lctx.stroke();
  }
  lctx.restore();
}

function prefillVennDiagram(layers, isSubtractive, canvasW, canvasH, brushSize) {
  const r = Math.min(canvasW, canvasH) * 0.26;
  const d = r * 0.7;
  const cx = canvasW / 2;
  const cy = canvasH / 2 + d / 4;
  const centers = [
    { x: cx,           y: cy - d },
    { x: cx - d*0.866, y: cy + d*0.5 },
    { x: cx + d*0.866, y: cy + d*0.5 },
  ];
  // all strokes go diagonally (top-left → bottom-right)
  const strokeAngle = Math.PI * 0.75;
  const cos = Math.cos(strokeAngle), sin = Math.sin(strokeAngle);
  for (let li = 0; li < layers.length; li++) {
    const layer = layers[li];
    const strokeStyle = isSubtractive
      ? '#000'
      : `rgb(${layer.color.r},${layer.color.g},${layer.color.b})`;
    const { x: ccx, y: ccy } = centers[li];
    for (let u = -r; u <= r; u += 2.5 + Math.random() * 0.5) {
      const jitter = (Math.random() - 0.5) * 0.3;
      const jcos = Math.cos(strokeAngle + jitter), jsin = Math.sin(strokeAngle + jitter);
      const hw = Math.sqrt(Math.max(0, r*r - u*u));
      const ax = ccx - jcos*hw - jsin*u, ay = ccy - jsin*hw + jcos*u;
      const bx = ccx + jcos*hw - jsin*u, by = ccy + jsin*hw + jcos*u;
      paintBristleLine(layer.ctx, ax, ay, bx, by, strokeStyle, brushSize);
    }
  }
}

// ── Panel setup ────────────────────────────────────────────────────────────

function makePanel(container, title, colors, mode, canvasW, canvasH, brushSize, fontSize) {
  const isSubtractive = mode === 'subtractive';
  const bgColor = isSubtractive ? '#fff' : '#000';

  const wrapper = document.createElement('div');
  wrapper.style.cssText = `display:flex;flex-direction:column;align-items:center;gap:8px;`;

  // Title
  const titleEl = document.createElement('div');
  titleEl.innerHTML = title;
  titleEl.style.cssText = `font-family:Gaegu,cursive;font-size:${fontSize};font-weight:bold;color:#222;text-align:center;`;
  wrapper.appendChild(titleEl);

  // Display canvas
  const canvas = document.createElement('canvas');
  canvas.width  = canvasW;
  canvas.height = canvasH;
  canvas.style.cssText = `border:2px solid #aaa;border-radius:4px;background:${bgColor};display:block;cursor:crosshair;touch-action:none;`;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvasW, canvasH);
  wrapper.appendChild(canvas);

  // One offscreen layer per color.
  // Subtractive layers: white bg, paint black → darkness = pigment amount.
  // Additive layers:    black bg, paint the RGB color → brightness = light amount.
  const layers = colors.map(color => {
    const oc = document.createElement('canvas');
    oc.width = canvasW;
    oc.height = canvasH;
    const octx = oc.getContext('2d');
    octx.fillStyle = bgColor;
    octx.fillRect(0, 0, canvasW, canvasH);
    return { canvas: oc, ctx: octx, color };
  });

  // ── Compositing ──────────────────────────────────────────────────────────

  function compositeAdditive() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const layer of layers) ctx.drawImage(layer.canvas, 0, 0);
    ctx.restore();
  }

  function compositeSubtractive() {
    // Read pigment amount from each layer (darkness = amount) and convert RYB→RGB
    const layerData = layers.map(l => l.ctx.getImageData(0, 0, canvasW, canvasH).data);
    const imgData = ctx.createImageData(canvasW, canvasH);
    const out = imgData.data;
    const n = canvasW * canvasH;
    for (let i = 0; i < n; i++) {
      const pi = i * 4;
      // Layer pixels are painted black-on-white, so red channel = brightness.
      // Pigment amount = 1 − brightness.
      const rAmt = 1 - layerData[0][pi] / 255;
      const yAmt = 1 - layerData[1][pi] / 255;
      const bAmt = 1 - layerData[2][pi] / 255;
      const [cr, cg, cb] = rybToRgb(rAmt, yAmt, bAmt);
      out[pi]     = cr;
      out[pi + 1] = cg;
      out[pi + 2] = cb;
      out[pi + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
  }

  function composite() {
    if (isSubtractive) compositeSubtractive();
    else compositeAdditive();
  }

  // ── Brush ────────────────────────────────────────────────────────────────

  let currentLayerIdx = 0;
  let isPainting = false;
  let lastX = null, lastY = null;

  function canvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return [
      (e.clientX - rect.left) * scaleX,
      (e.clientY - rect.top)  * scaleY,
    ];
  }

  function paintStroke(x, y) {
    const layer = layers[currentLayerIdx];
    const strokeStyle = isSubtractive
      ? '#000'
      : `rgb(${layer.color.r},${layer.color.g},${layer.color.b})`;
    paintBristleLine(layer.ctx, lastX ?? x, lastY ?? y, x, y, strokeStyle, brushSize);
    lastX = x;
    lastY = y;
    composite();
  }

  canvas.addEventListener('pointerdown', (e) => {
    const [cx, cy] = canvasCoords(e);
    isPainting = true;
    lastX = null;
    paintStroke(cx, cy);
    canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!isPainting) return;
    const [cx, cy] = canvasCoords(e);
    paintStroke(cx, cy);
  });

  canvas.addEventListener('pointerup',     () => { isPainting = false; lastX = null; lastY = null; });
  canvas.addEventListener('pointercancel', () => { isPainting = false; lastX = null; lastY = null; });

  // ── Color buttons ────────────────────────────────────────────────────────

  const btnRow = document.createElement('div');
  btnRow.style.cssText = `display:flex;gap:10px;justify-content:center;align-items:center;`;

  // Small swatch showing active color
  const displayColors = isSubtractive ? RYB_COLORS : colors;
  const swatch = document.createElement('div');
  swatch.style.cssText = `width:16px;height:16px;border-radius:50%;border:2px solid #666;flex-shrink:0;background:rgb(${displayColors[0].r},${displayColors[0].g},${displayColors[0].b});`;
  btnRow.appendChild(swatch);

  colors.forEach((color, i) => {
    const dc = displayColors[i];
    const btn = document.createElement('wired-button');
    btn.className = 'object';
    btn.innerHTML = color.label;
    btn.style.cssText = `font-family:Gaegu,cursive;font-size:${fontSize};color:rgb(${dc.r},${dc.g},${dc.b});position:static;`;
    btn.addEventListener('click', () => {
      currentLayerIdx = i;
      swatch.style.background = `rgb(${dc.r},${dc.g},${dc.b})`;
      swatch.style.borderColor = `rgb(${Math.round(dc.r*0.6)},${Math.round(dc.g*0.6)},${Math.round(dc.b*0.6)})`;
    });
    btnRow.appendChild(btn);
  });

  wrapper.appendChild(btnRow);

  // Clear button
  const clearBtn = document.createElement('wired-button');
  clearBtn.className = 'object';
  clearBtn.innerHTML = 'clear';
  clearBtn.style.cssText = `font-family:Gaegu,cursive;font-size:16px;color:#888;position:static;`;
  clearBtn.addEventListener('click', () => {
    for (const layer of layers) {
      layer.ctx.fillStyle = bgColor;
      layer.ctx.fillRect(0, 0, canvasW, canvasH);
    }
    composite();
  });
  wrapper.appendChild(clearBtn);

  prefillVennDiagram(layers, isSubtractive, canvasW, canvasH, brushSize);
  composite();

  container.appendChild(wrapper);
  return wrapper;
}

// ── Desktop ────────────────────────────────────────────────────────────────

export function ColorMixerDesktop(rc, ctx, interval) {
  const sandbox = document.getElementById('sandbox');

  TextBox({
    text: 'Both systems are consistent with your cone biology — the difference is the medium.<br><br>' +
          '<b>Screens</b> start with black and emit light. Adding R, G, B together makes white.<br><br>' +
          '<b>Paint</b> starts with white and absorbs wavelengths. Each pigment blocks certain frequencies — so mixing darkens, and the primaries are different.',
    x: 50, y: 50, w: 390, size: '21px', align: 'left', lineHeight: '1.35',
  });

  const row = document.createElement('div');
  row.style.cssText = `position:absolute;left:460px;top:50px;display:flex;gap:40px;align-items:flex-start;`;
  sandbox.appendChild(row);

  makePanel(row, 'Light mixing (additive)',    RGB_COLORS, 'additive',    190, 210, 38, '20px');
  makePanel(row, 'Paint mixing (subtractive)', RYB_COLORS, 'subtractive', 190, 210, 38, '20px');
}

// ── Mobile ─────────────────────────────────────────────────────────────────

export function ColorMixerMobile(rc, ctx, interval) {
  const sandbox = document.getElementById('sandbox');
  const W = window.innerWidth;

  TextBox({
    text: 'Same cones, different medium.<br>' +
          '<b>Screens</b> emit light on black — R+G+B → white.<br>' +
          '<b>Paint</b> absorbs wavelengths from white — mixing blocks frequencies.',
    x: 10, y: 55, w: W - 20, size: '20px', align: 'left', lineHeight: '1.3',
  });

  const panelW = Math.min(Math.floor((W - 30) / 2), 160);

  const row = document.createElement('div');
  row.style.cssText = `position:absolute;left:0;right:0;top:160px;display:flex;gap:10px;justify-content:center;align-items:flex-start;`;
  sandbox.appendChild(row);

  makePanel(row, 'Light<br>(additive)',    RGB_COLORS, 'additive',    panelW, 170, 25, '18px');
  makePanel(row, 'Paint<br>(subtractive)', RYB_COLORS, 'subtractive', panelW, 170, 25, '18px');
}
