import rough from 'https://unpkg.com/roughjs?module';
import {TextBox} from '../components.js?v=51';
import {onResize, mobileContentBottom} from '../utils.js?v=51';

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
function makePanel(container, {colors, mode, canvasW, canvasH, brushSize, fontSize, clearInline}) {
  const isSubtractive = mode === 'subtractive';
  const bgColor = isSubtractive ? '#fff' : '#000';

  const wrapper = document.createElement('div');
  wrapper.style.cssText = `display:flex;flex-direction:column;align-items:center;gap:8px;`;

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

// Red, green and blue light across the top, cyan, magenta and yellow paint
// underneath, with an arrow from each light primary to the two paint
// primaries it's part of. The bottom row is in the order (yellow, magenta,
// cyan) that keeps the arrows shortest and crossing least.
const LIGHTS = [
  { name: 'red',   fill: 'rgb(255,0,0)' },
  { name: 'green', fill: 'rgb(0,128,0)' },
  { name: 'blue',  fill: 'rgb(0,0,255)' },
];
const PAINTS = [
  { name: 'yellow',  fill: 'rgb(255,255,0)' }, // red + green
  { name: 'magenta', fill: 'rgb(255,0,255)' }, // red + blue
  { name: 'cyan',    fill: 'rgb(0,255,255)' }, // green + blue
];
// [light index, paint index]
const ARROWS = [[0, 0], [0, 1], [1, 0], [1, 2], [2, 1], [2, 2]];
const DIAGRAM_W = 205, DIAGRAM_H = 92;

function makeOppositesDiagram(container) {
  const dpr = window.devicePixelRatio || 1;
  const canvas = document.createElement('canvas');
  canvas.className = 'object';
  canvas.width  = DIAGRAM_W * dpr;
  canvas.height = DIAGRAM_H * dpr;
  canvas.style.cssText = `position:static;display:block;width:${DIAGRAM_W}px;height:${DIAGRAM_H}px;flex-shrink:0;`;
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const rc = rough.canvas(canvas);

  const colX = (i) => 74 + i * 54;
  const topY = 24, bottomY = 66, d = 20;

  function draw() {
    ctx.clearRect(0, 0, DIAGRAM_W, DIAGRAM_H);
    ctx.fillStyle = '#222';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.font = 'bold 16px Gaegu, cursive';
    ctx.fillText('light', 4, topY);
    ctx.fillText('paint', 4, bottomY);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '13px Gaegu, cursive';
    const circle = {fillStyle: 'solid', strokeWidth: 2};
    LIGHTS.forEach((c, i) => {
      rc.circle(colX(i), topY, d, {...circle, fill: c.fill, seed: i + 1});
      ctx.fillText(c.name, colX(i), topY - d / 2 - 4);
    });
    PAINTS.forEach((c, i) => {
      rc.circle(colX(i), bottomY, d, {...circle, fill: c.fill, seed: i + 4});
      ctx.fillText(c.name, colX(i), bottomY + d / 2 + 12);
    });

    // arrows from each light down to the paints it makes, in the light's color
    ARROWS.forEach(([li, pi], k) => {
      const x1 = colX(li), y1 = topY, x2 = colX(pi), y2 = bottomY;
      const len = Math.hypot(x2 - x1, y2 - y1);
      const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
      const gap = d / 2 + 3;
      const sx = x1 + ux * gap, sy = y1 + uy * gap;
      const ex = x2 - ux * gap, ey = y2 - uy * gap;
      const line = {stroke: LIGHTS[li].fill, strokeWidth: 2, roughness: 1, seed: k + 10};
      rc.line(sx, sy, ex, ey, line);
      // arrowhead: two short strokes back from the tip, 28 degrees either side
      for (const a of [0.5, -0.5]) {
        const cos = Math.cos(a), sin = Math.sin(a);
        const bx = -(ux * cos - uy * sin), by = -(ux * sin + uy * cos);
        rc.line(ex, ey, ex + bx * 6, ey + by * 6, line);
      }
    });
  }

  // draw now, and again once the handwriting font has loaded
  draw();
  document.fonts.load('13px Gaegu').then(draw, () => {});
  return canvas;
}

// The diagram with its caption centered underneath. The caption opens a
// note, so the pair is wired up with setupNote.
function makeCaptionedDiagram(container) {
  makeOppositesDiagram(container);
  const caption = document.createElement('div');
  caption.className = 'object note-anchor diagram-caption';
  caption.style.cssText = `position:relative;width:${DIAGRAM_W}px;`;
  caption.innerHTML = CAPTION;
  container.appendChild(caption);
  setupNote(caption);
}

// ── Text ───────────────────────────────────────────────────────────────────

// color words styled like the RYB and cones slides
const word = (color, text = color) => `<b style='color:${color}'>${text}</b>`;
const RED = word('red'), GREEN = word('green'), BLUE = word('blue'), YELLOW = word('yellow');
const MAGENTA = word('magenta');
const BLACK = '<b>black</b>';
// acronyms colored letter by letter
const letters = (...pairs) => '<b>' + pairs.map(([c, l]) => `<span style='color:${c}'>${l}</span>`).join('') + '</b>';
const RYB = letters(['red', 'R'], ['yellow', 'Y'], ['blue', 'B']);
const CMY = letters(['cyan', 'C'], ['magenta', 'M'], ['yellow', 'Y']);
const RGB = letters(['red', 'R'], ['green', 'G'], ['blue', 'B']);
const WHITE = "<b style='color:white; background-color:black; padding: 0 4px; border-radius: 3px;'>white</b>";

// a phrase that opens a note when tapped, inside a sentence
const term = (text, note) =>
  `<span class='note-anchor'><button type='button' class='note-link inline-term' aria-expanded='false'>${text}</button>` +
  `<span class='note-popup' hidden>${note}</span></span>`;

const PRIMARIES_NOTE =
  '"Primary colors" are actually made up. ' +
  "No three base light sources can trigger every combination of cone responses because each of our cones " +
  `reacts to an overlapping range of frequencies. ${RGB} just happens to cover the widest area of our visual range ` +
  "with only three lights.";

// same text on phones and desktop
const LIGHT_TEXT =
  "Ah, our first conundrum. Let's clear it up.<br><br>" +
  `<b>The primary colors of human vision are ${RED}, ${GREEN}, and ${BLUE}</b> (${term('sort of', PRIMARIES_NOTE)}). ` +
  `These 3 colors stimulate each distinct cone (again ${term('sort of', 'See the previous "sort of"')}), ` +
  "and that combination of signals forms our perception of color.<br><br>" +
  `With no light at all, we see ${BLACK}. Turn the lights on and we get our different colors.`;

const PAINT_TEXT =
  `Paint works the other way around. A ${WHITE} canvas reflects every wavelength of visible light, ` +
  "and each layer of paint blocks some of those wavelengths from reaching your eyes. " +
  `For example, if we block ${GREEN} light, only our ${RED} and ${BLUE} cones are left firing ` +
  `and together they read as ${MAGENTA}.`;

// caption under the arrows diagram, which opens a note about school
const CAPTION =
  `<button type='button' class='note-link' aria-expanded='false'>Not red, yellow, blue?</button>` +
  `<span class='note-popup' hidden>The ${RYB} model dates back to 18th-century art theory, before light absorption ` +
  "and human vision were fully understood. Because early painters relied on naturally occurring minerals and dyes, " +
  `${RYB} became the standard teaching model for generations. Modern color science eventually replaced it with ${CMY} and ${RGB}, ` +
  "but the traditional model simply stuck around in early education.</span>";


// ── Light slide ────────────────────────────────────────────────────────────

export function LightMixingDesktop() {
  const text = TextBox({text: LIGHT_TEXT, x: 50, y: 60, w: 400, size: '24px', align: 'left', lineHeight: '1.35'});
  setupNote(text);

  const row = rightColumn();
  makePanel(row, {colors: RGB_COLORS, mode: 'additive',
    canvasW: 400, canvasH: 370, brushSize: 50, fontSize: '22px', clearInline: true});
}

export function LightMixingMobile() {
  const W = window.innerWidth;
  const side = Math.min(320, W - 40);
  const text = layoutMobile(LIGHT_TEXT, 21, (row) => {
    makePanel(row, {colors: RGB_COLORS, mode: 'additive',
      canvasW: side, canvasH: side, brushSize: 40, fontSize: '20px', clearInline: true});
  });
  setupNote(text);
}

// ── Paint slide ────────────────────────────────────────────────────────────

export function PaintMixingDesktop() {
  const text = TextBox({text: PAINT_TEXT, x: 50, y: 60, w: 400, size: '24px', align: 'left', lineHeight: '1.35'});

  // the arrows diagram and its caption sit under the paragraph, centered to
  // it, and follow it down as the font loads and the text rewraps
  const group = document.createElement('div');
  group.style.cssText = 'position:absolute;left:50px;width:400px;display:flex;flex-direction:column;align-items:center;';
  document.getElementById('sandbox').appendChild(group);
  makeCaptionedDiagram(group);
  revealAfterFonts(group);
  // a little more air between the diagram and its caption than on phones
  group.querySelector('.diagram-caption').style.marginTop = '6px';
  onResize([text], () => {
    group.style.top = (text.offsetTop + text.offsetHeight + 2) + 'px';
  });

  // the mixer gets the right side to itself
  const row = rightColumn();
  makePanel(row, {colors: CMY_COLORS, mode: 'subtractive',
    canvasW: 400, canvasH: 370, brushSize: 50, fontSize: '22px', clearInline: true});
}

export function PaintMixingMobile() {
  const W = window.innerWidth;
  const canvasW = Math.min(300, W - 40);
  // spare room goes between the caption and the mixer, not above the diagram
  const spacer = document.createElement('div');
  layoutMobile(PAINT_TEXT, 19, (row) => {
    // one column: the arrows diagram right above the mixer
    const col = document.createElement('div');
    col.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;';
    row.appendChild(col);
    makeCaptionedDiagram(col);
    col.appendChild(spacer);
    makePanel(col, {colors: CMY_COLORS, mode: 'subtractive',
      canvasW, canvasH: 220, brushSize: 28, fontSize: '18px', clearInline: true});
  }, spacer);
}

// ── Layout helpers ─────────────────────────────────────────────────────────

// Wires up a clickable link (.note-link) in el: it opens and closes its
// .note-popup, and a tap anywhere else closes it. The popup floats, so
// nothing moves, and it shifts left if it would run off the slide.
function setupNote(el) {
  // the text box fades in, which makes it its own layer, so lift the whole
  // box above BACK/NEXT for the popup to show over them
  el.style.zIndex = '5';
  const pairs = Array.from(el.querySelectorAll('.note-link'))
    .map(link => ({link, note: link.nextElementSibling}));
  const setOpen = ({link, note}, open) => {
    note.hidden = !open;
    link.setAttribute('aria-expanded', String(open));
    if (!open) return;
    // only one note open at a time
    pairs.forEach(p => { if (p.note !== note && !p.note.hidden) setOpen(p, false); });
    // as wide as its text, up to what reads well, never wider than the screen
    const sandbox = document.getElementById('sandbox').getBoundingClientRect();
    const maxW = Math.min(340, sandbox.width - 24);
    note.style.width = 'max-content';
    // (rounded up, since a width a fraction too small wraps the last word)
    note.style.width = Math.min(maxW, Math.ceil(note.getBoundingClientRect().width) + 1) + 'px';
    // centered on the slide (left is measured from the element that
    // positions the popup)
    note.style.top = '';
    const anchor = (note.offsetParent || el).getBoundingClientRect();
    const left = sandbox.left + (sandbox.width - note.offsetWidth) / 2 - anchor.left;
    note.style.left = Math.round(left) + 'px';
    // open upward if it would run off the bottom
    const box = note.getBoundingClientRect();
    if (box.bottom > sandbox.bottom - 8) note.style.top = `${-note.offsetHeight - 4}px`;
  };
  pairs.forEach(p => p.link.addEventListener('click', () => setOpen(p, p.note.hidden)));
  const closeOutside = (e) => {
    if (!el.isConnected) return document.removeEventListener('pointerdown', closeOutside);
    pairs.forEach(p => {
      if (!p.note.hidden && !p.link.contains(e.target) && !p.note.contains(e.target)) setOpen(p, false);
    });
  };
  document.addEventListener('pointerdown', closeOutside);
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
// The handwritten font loads after the first layout on a fresh visit, and
// the paragraph rewraps when it arrives, which moves whatever sits under the
// text. Keep that content hidden until the font is in and the layout has
// settled, then fade it in.
function revealAfterFonts(el) {
  el.style.opacity = '0';
  const show = () => {
    if (el.style.opacity !== '0') return;
    el.style.transition = 'opacity 0.4s ease-in';
    el.style.opacity = '1';
  };
  const fonts = document.fonts
    ? Promise.all([document.fonts.load('20px Gaegu'), document.fonts.load('bold 20px Gaegu')])
    : Promise.resolve();
  // two frames so the resize handlers have placed everything
  fonts.catch(() => {}).then(() => requestAnimationFrame(() => requestAnimationFrame(show)));
  setTimeout(show, 2000); // never leave it hidden if the font is slow
}

// the gap under the paint slide's caption on phones
const SPACER_MIN = 6, SPACER_MAX = 20;

function layoutMobile(textHtml, startSize, fill, spacer = null) {
  const sandbox = document.getElementById('sandbox');
  const W = window.innerWidth;

  let fontSize = startSize;
  const text = TextBox({text: textHtml, x: 15, y: 20, w: W - 30,
    size: fontSize + 'px', align: 'left', lineHeight: '1.25'});

  const row = document.createElement('div');
  row.style.cssText = `position:absolute;left:0;right:0;display:flex;gap:10px;justify-content:center;align-items:flex-start;transform-origin:top center;`;
  sandbox.appendChild(row);
  fill(row);
  revealAfterFonts(row);

  onResize([text, row], () => {
    // with a spacer, the row sits right under the text and spare room goes
    // into the spacer instead, so start from its smallest height
    if (spacer) spacer.style.height = SPACER_MIN + 'px';
    const top = text.offsetTop + text.offsetHeight + (spacer ? 2 : 14);
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
    const spare = Math.max(0, room - row.offsetHeight * scale);
    if (spacer) {
      spacer.style.height = Math.round(SPACER_MIN + Math.min(SPACER_MAX - SPACER_MIN, spare / scale)) + 'px';
      row.style.top = top + 'px';
    } else {
      // center the row in the space left below the text
      row.style.top = Math.round(top + spare / 2) + 'px';
    }
    row.style.transform = scale < 1 ? `scale(${scale})` : '';
  });
  return text;
}
