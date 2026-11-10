import rough from 'https://unpkg.com/roughjs?module';
import {TextBox} from '../components.js?v=15';
import {onResize, mobileContentBottom} from '../utils.js?v=15';

// Two slides share the mixer: light (additive, red/green/blue light on black)
// and paint (subtractive, cyan/magenta/yellow pigment on white).

// ── Color definitions ──────────────────────────────────────────────────────

// text is the button label color; a few are darkened so they read on white
const RGB_COLORS = [
  { label: 'R', r: 255, g: 0,   b: 0,   text: 'rgb(255,0,0)'   },
  { label: 'G', r: 0,   g: 255, b: 0,   text: 'rgb(0,200,0)'   },
  { label: 'B', r: 0,   g: 0,   b: 255, text: 'rgb(0,0,255)'   },
];

const CMY_COLORS = [
  { label: 'C', r: 0,   g: 255, b: 255, text: 'rgb(0,190,210)' },
  { label: 'M', r: 255, g: 0,   b: 255, text: 'rgb(220,0,220)' },
  { label: 'Y', r: 255, g: 255, b: 0,   text: 'rgb(225,195,0)' },
];

const rgb = (c) => `rgb(${c.r},${c.g},${c.b})`;

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

function prefillVennDiagram(layers, canvasW, canvasH, brushSize) {
  // small enough to leave plenty of empty canvas to draw in, and a little
  // above the middle so the "draw here" hint fits underneath
  const r = Math.min(canvasW, canvasH) * 0.17;
  const d = r * 0.7;
  const cx = canvasW / 2;
  const cy = canvasH * 0.42 + d / 4;
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
    const strokeStyle = rgb(layer.color);
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

// Light layers are colored light on black, added together ('lighter').
// Paint layers are colored pigment on white, multiplied together, so cyan
// over magenta leaves only blue, the way stacked filters or paints would.
function makePanel(container, {title, colors, mode, canvasW, canvasH, brushSize, fontSize, clearInline}) {
  const isSubtractive = mode === 'subtractive';
  const bgColor = isSubtractive ? '#fff' : '#000';

  const wrapper = document.createElement('div');
  wrapper.style.cssText = `display:flex;flex-direction:column;align-items:center;gap:8px;`;

  // Title
  const titleEl = document.createElement('div');
  titleEl.className = 'object'; // fades in with the rest of the slide
  titleEl.innerHTML = title;
  titleEl.style.cssText = `font-family:Gaegu,cursive;font-size:${fontSize};font-weight:bold;color:#222;text-align:center;position:static;`;
  wrapper.appendChild(titleEl);

  // Display canvas
  const canvas = document.createElement('canvas');
  canvas.width  = canvasW;
  canvas.height = canvasH;
  canvas.style.cssText = `border:2px solid #aaa;border-radius:4px;background:${bgColor};display:block;cursor:crosshair;touch-action:none;`;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvasW, canvasH);
  const canvasBox = document.createElement('div');
  canvasBox.style.cssText = 'position:relative;';
  canvasBox.appendChild(canvas);
  wrapper.appendChild(canvasBox);

  // A pencil and "draw here!" tell people they can paint here. They go
  // away as soon as they start.
  let hint = makeDrawHint(canvasBox, isSubtractive ? '#444' : '#eee');

  // One offscreen layer per color
  const layers = colors.map(color => {
    const oc = document.createElement('canvas');
    oc.width = canvasW;
    oc.height = canvasH;
    const octx = oc.getContext('2d');
    octx.fillStyle = bgColor;
    octx.fillRect(0, 0, canvasW, canvasH);
    return { canvas: oc, ctx: octx, color };
  });

  function composite() {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.save();
    ctx.globalCompositeOperation = isSubtractive ? 'multiply' : 'lighter';
    for (const layer of layers) ctx.drawImage(layer.canvas, 0, 0);
    ctx.restore();
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
    paintBristleLine(layer.ctx, lastX ?? x, lastY ?? y, x, y, rgb(layer.color), brushSize);
    lastX = x;
    lastY = y;
    composite();
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (hint) {
      const h = hint;
      hint = null;
      h.style.animation = 'fadeout 0.3s forwards';
      setTimeout(() => h.remove(), 300);
    }
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
  const swatch = document.createElement('div');
  swatch.className = 'object'; // fades in with the rest of the slide
  swatch.style.cssText = `position:static;width:16px;height:16px;border-radius:50%;border:2px solid #666;flex-shrink:0;background:${rgb(colors[0])};`;
  btnRow.appendChild(swatch);

  colors.forEach((color, i) => {
    const btn = document.createElement('wired-button');
    btn.className = 'object';
    btn.innerHTML = color.label;
    btn.style.cssText = `font-family:Gaegu,cursive;font-size:${fontSize};color:${color.text};position:static;`;
    btn.addEventListener('click', () => {
      currentLayerIdx = i;
      swatch.style.background = rgb(color);
      swatch.style.borderColor = `rgb(${Math.round(color.r*0.6)},${Math.round(color.g*0.6)},${Math.round(color.b*0.6)})`;
    });
    btnRow.appendChild(btn);
  });

  wrapper.appendChild(btnRow);

  // Clear button, beside the colors where there's room, otherwise below them
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
  (clearInline ? btnRow : wrapper).appendChild(clearBtn);

  prefillVennDiagram(layers, canvasW, canvasH, brushSize);
  composite();

  container.appendChild(wrapper);
  return wrapper;
}

// ── Draw hint ──────────────────────────────────────────────────────────────

// A still pencil over "draw here!", near the bottom of the canvas.
function makeDrawHint(container, color) {
  const hint = document.createElement('div');
  hint.className = 'object draw-hint'; // fades in with the rest of the slide
  hint.style.color = color;
  hint.innerHTML =
    `<svg width="30" height="30" viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">` +
      `<path d="M3 23 L6 15 L11 20 Z M6 15 L19 2 L24 7 L11 20 M16.5 4.5 L21.5 9.5"/>` +
    `</svg>` +
    `<div class="draw-hint-text">draw here!</div>`;
  container.appendChild(hint);
  return hint;
}

// ── Opposites diagram ──────────────────────────────────────────────────────

// Red, green and blue light on the left, each paired by a two-headed arrow
// with its opposite paint primary on the right. Drawn on its own small canvas
// so it can sit in a flex row beside the mixer.
const PAIRS = [
  { light: 'red',   lightFill: 'rgb(255,0,0)', paint: 'cyan',    paintFill: 'rgb(0,255,255)' },
  { light: 'green', lightFill: 'rgb(0,128,0)', paint: 'magenta', paintFill: 'rgb(255,0,255)' },
  { light: 'blue',  lightFill: 'rgb(0,0,255)', paint: 'yellow',  paintFill: 'rgb(255,255,0)' },
];
const DIAGRAM_W = 180, DIAGRAM_H = 250;

function makeOppositesDiagram(container) {
  const dpr = window.devicePixelRatio || 1;
  const canvas = document.createElement('canvas');
  canvas.className = 'object';
  canvas.width  = DIAGRAM_W * dpr;
  canvas.height = DIAGRAM_H * dpr;
  canvas.style.cssText = `position:static;width:${DIAGRAM_W}px;height:${DIAGRAM_H}px;flex-shrink:0;`;
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const rc = rough.canvas(canvas);

  const leftX = 40, rightX = 140, d = 40;
  const rowY = (i) => 58 + i * 72;

  function draw() {
    ctx.clearRect(0, 0, DIAGRAM_W, DIAGRAM_H);
    ctx.fillStyle = '#222';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = 'bold 20px Gaegu, cursive';
    ctx.fillText('light', leftX, 20);
    ctx.fillText('paint', rightX, 20);

    ctx.font = '17px Gaegu, cursive';
    PAIRS.forEach((p, i) => {
      const y = rowY(i);
      const opts = {fillStyle: 'solid', strokeWidth: 2, seed: i + 1};
      rc.circle(leftX,  y, d, {...opts, fill: p.lightFill});
      rc.circle(rightX, y, d, {...opts, fill: p.paintFill});
      ctx.fillText(p.light, leftX,  y + d / 2 + 17);
      ctx.fillText(p.paint, rightX, y + d / 2 + 17);

      // two-headed arrow between the circles
      const x1 = leftX + d / 2 + 8, x2 = rightX - d / 2 - 8;
      const line = {strokeWidth: 2, roughness: 1, seed: i + 10};
      rc.line(x1, y, x2, y, line);
      rc.line(x1, y, x1 + 9, y - 6, line);
      rc.line(x1, y, x1 + 9, y + 6, line);
      rc.line(x2, y, x2 - 9, y - 6, line);
      rc.line(x2, y, x2 - 9, y + 6, line);
    });
  }

  // draw now, and again once the handwriting font has loaded
  draw();
  document.fonts.load('17px Gaegu').then(draw, () => {});
  return canvas;
}

// ── Text ───────────────────────────────────────────────────────────────────

// color words styled like the RYB and cones slides
const word = (color, text = color) => `<b style='color:${color}'>${text}</b>`;
const RED = word('red'), GREEN = word('green'), BLUE = word('blue'), YELLOW = word('yellow');
const MAGENTA = word('magenta');
const BLACK = '<b>black</b>';
const WHITE = "<b style='color:white; background-color:black; padding: 0 4px; border-radius: 3px;'>white</b>";

// same text on phones and desktop
const LIGHT_TEXT =
  "Ah, our first conundrum. Let's clear it up.<br><br>" +
  `<b>The true primary colors of human vision are ${RED}, ${GREEN} and ${BLUE}</b>. ` +
  "They're the three axes our brain uses to read color.<br><br>" +
  `With no light at all, we see ${BLACK}. Turn the lights on and we get our different colors.`;

const PAINT_TEXT =
  `Paint works the other way around. A ${WHITE} canvas reflects every wavelength of visible light, ` +
  "and each layer of paint blocks some of those wavelengths from reaching your eyes.<br><br>" +
  `For example, if we block ${GREEN} light, only our ${RED} and ${BLUE} cones are left firing ` +
  `and together they read as ${MAGENTA}.`;

// sits under the opposites diagram, between it and the mixer
const PAINT_CLOSING = `In school, we learned ${RED}, ${YELLOW} and ${BLUE} because it was simpler.`;

const LIGHT_TITLE = 'Light mixing (additive)';
const PAINT_TITLE = 'Paint mixing (subtractive)';

// ── Light slide ────────────────────────────────────────────────────────────

export function LightMixingDesktop() {
  TextBox({text: LIGHT_TEXT, x: 50, y: 110, w: 400, size: '25px', align: 'left', lineHeight: '1.35'});

  const row = rightColumn();
  makePanel(row, {title: LIGHT_TITLE, colors: RGB_COLORS, mode: 'additive',
    canvasW: 330, canvasH: 330, brushSize: 50, fontSize: '22px', clearInline: true});
}

export function LightMixingMobile() {
  const W = window.innerWidth;
  const side = Math.min(300, W - 40);
  layoutMobile(LIGHT_TEXT, 21, (row) => {
    makePanel(row, {title: LIGHT_TITLE, colors: RGB_COLORS, mode: 'additive',
      canvasW: side, canvasH: side, brushSize: 40, fontSize: '20px', clearInline: true});
  });
}

// ── Paint slide ────────────────────────────────────────────────────────────

export function PaintMixingDesktop() {
  TextBox({text: PAINT_TEXT, x: 50, y: 65, w: 400, size: '21px', align: 'left', lineHeight: '1.35'});

  const row = rightColumn();
  row.style.gap = '20px';
  row.style.alignItems = 'center';
  diagramWithClosing(row, '19px');
  makePanel(row, {title: PAINT_TITLE, colors: CMY_COLORS, mode: 'subtractive',
    canvasW: 250, canvasH: 280, brushSize: 42, fontSize: '20px', clearInline: false});
}

export function PaintMixingMobile() {
  const W = window.innerWidth;
  const panelW = Math.min(190, W - DIAGRAM_W - 25);
  layoutMobile(PAINT_TEXT, 19, (row) => {
    row.style.alignItems = 'center';
    diagramWithClosing(row, '16px');
    makePanel(row, {title: 'Paint mixing<br>(subtractive)', colors: CMY_COLORS, mode: 'subtractive',
      canvasW: panelW, canvasH: 190, brushSize: 28, fontSize: '18px', clearInline: false});
  });
}

// ── Layout helpers ─────────────────────────────────────────────────────────

// the opposites diagram with the closing line under it, as one column
function diagramWithClosing(row, fontSize) {
  const col = document.createElement('div');
  col.style.cssText = `display:flex;flex-direction:column;align-items:center;gap:6px;width:${DIAGRAM_W}px;flex-shrink:0;`;
  makeOppositesDiagram(col);
  const closing = document.createElement('div');
  closing.className = 'object textbox'; // fades in with the rest of the slide
  closing.innerHTML = PAINT_CLOSING;
  closing.style.cssText = `position:static;font-size:${fontSize};line-height:1.25;text-align:center;`;
  col.appendChild(closing);
  row.appendChild(col);
  return col;
}

// desktop: the mixer (and diagram) centered in the space right of the text,
// above the BACK/NEXT buttons
function rightColumn() {
  const row = document.createElement('div');
  row.style.cssText = `position:absolute;left:470px;width:500px;top:50px;height:440px;display:flex;gap:10px;justify-content:center;align-items:center;`;
  document.getElementById('sandbox').appendChild(row);
  return row;
}

// phones: text at the top, then a row of content below wherever the text
// actually ends. On short screens the text shrinks a little first, then the
// row shrinks to fit above the buttons.
function layoutMobile(textHtml, startSize, fill) {
  const sandbox = document.getElementById('sandbox');
  const W = window.innerWidth;

  let fontSize = startSize;
  const text = TextBox({text: textHtml, x: 15, y: 20, w: W - 30,
    size: fontSize + 'px', align: 'left', lineHeight: '1.25'});

  const row = document.createElement('div');
  row.style.cssText = `position:absolute;left:0;right:0;display:flex;gap:10px;justify-content:center;align-items:flex-start;transform-origin:top center;`;
  sandbox.appendChild(row);
  fill(row);

  onResize([text, row], () => {
    const top = text.offsetTop + text.offsetHeight + 14;
    const room = mobileContentBottom() - top;
    // the row can also be wider than a narrow phone
    const kids = Array.from(row.children);
    const rowW = kids.reduce((w, k) => w + k.offsetWidth, 0) + 10 * (kids.length - 1);
    const fit = Math.min(room / row.offsetHeight, (W - 10) / rowW);
    if (fit < 0.85 && fontSize > 16) {
      fontSize -= 1;
      text.style.fontSize = fontSize + 'px';
      return;
    }
    const scale = Math.max(0.5, Math.min(1, fit));
    // center the row in the space left below the text
    row.style.top = Math.round(top + Math.max(0, (room - row.offsetHeight * scale) / 2)) + 'px';
    row.style.transform = scale < 1 ? `scale(${scale})` : '';
  });
}
