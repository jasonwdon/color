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
    const lctx = layer.ctx;
    lctx.save();
    lctx.globalAlpha = 0.3;
    if (isSubtractive) {
      lctx.strokeStyle = '#000';  // darkness = pigment amount
    } else {
      lctx.strokeStyle = `rgb(${layer.color.r},${layer.color.g},${layer.color.b})`;
    }
    lctx.lineWidth = brushSize;
    lctx.lineCap = 'round';
    lctx.lineJoin = 'round';
    lctx.beginPath();
    if (lastX !== null) {
      lctx.moveTo(lastX, lastY);
      lctx.lineTo(x, y);
    } else {
      lctx.moveTo(x, y);
      lctx.lineTo(x + 0.1, y);
    }
    lctx.stroke();
    lctx.restore();
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

  makePanel(row, 'Light mixing (additive)',    RGB_COLORS, 'additive',    190, 210, 38, '20px');
  makePanel(row, 'Paint mixing (subtractive)', RYB_COLORS, 'subtractive', 190, 210, 38, '20px');
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

  makePanel(row, 'Light<br>(additive)',    RGB_COLORS, 'additive',    panelW, 170, 25, '18px');
  makePanel(row, 'Paint<br>(subtractive)', RYB_COLORS, 'subtractive', panelW, 170, 25, '18px');
}
