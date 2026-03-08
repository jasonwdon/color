import {Slider} from '../components.js';
import {clearCanvas} from '../utils.js';

// RYB → RGB via trilinear interpolation on a cube.
// Each index is a bitmask: bit2=R, bit1=Y, bit0=B (all 0→1 range).
const RYB_CUBE = [
  [1.000, 1.000, 1.000], // (0,0,0) → white
  [1.000, 0.000, 0.000], // (1,0,0) → red
  [1.000, 1.000, 0.000], // (0,1,0) → yellow
  [1.000, 0.500, 0.000], // (1,1,0) → orange
  [0.163, 0.373, 0.600], // (0,0,1) → blue
  [0.500, 0.000, 0.500], // (1,0,1) → purple
  [0.000, 0.660, 0.200], // (0,1,1) → green
  [0.100, 0.094, 0.000], // (1,1,1) → dark brown
];

function rybToRgb(r, y, b) {
  const w = [
    (1-r)*(1-y)*(1-b), r*(1-y)*(1-b),
    (1-r)*y*(1-b),     r*y*(1-b),
    (1-r)*(1-y)*b,     r*(1-y)*b,
    (1-r)*y*b,         r*y*b,
  ];
  let R = 0, G = 0, B = 0;
  for (let i = 0; i < 8; i++) {
    R += w[i] * RYB_CUBE[i][0];
    G += w[i] * RYB_CUBE[i][1];
    B += w[i] * RYB_CUBE[i][2];
  }
  return [Math.round(R * 255), Math.round(G * 255), Math.round(B * 255)];
}

function contrastColor(r, g, b) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#333' : '#eee';
}

// Desktop: two side-by-side panels separated by a vertical divider.
// All canvas coords (subtract 50 from sandbox x and y on desktop).
const DESKTOP_L = {
  isMobile: false,
  // canvas x extents per panel
  cLeft: 15,
  cRight: 465,
  cPanelW: 415,
  cDivX: 450,
  // y positions (canvas)
  cTitleY: 38,
  cRY: 88,  cGY: 143, cBY: 198,
  cSwatchY: 268, cSwatchH: 180,
  // sandbox positions for DOM sliders (canvas + 50).
  // labels drawn at canvas cLeft/cRight; sliders start 35px to the right.
  sLX: 100,  sRX: 550,
  sRY: 110, sGY: 165, sBY: 220,
  sSliderW: 380,
  labelSize: 22,
  titleSize: 22,
};

// Mobile: two stacked panels separated by a horizontal divider.
// On mobile: canvas x = sandbox x (no horizontal offset); canvas y = sandbox y − 50.
export function ColorMixerDesktop(rc, ctx, interval) {
  setupMixer(rc, ctx, DESKTOP_L);
}

export function ColorMixerMobile(rc, ctx, interval) {
  const W = window.innerWidth;
  const H = window.innerHeight - 100;
  const panelH = Math.floor(H / 2) - 10;
  const divY   = panelH + 5;

  // sandbox y = canvas y + 50
  const L = {
    isMobile: true,
    cW: W, cH: H,
    cLeft: 5, cRight: 5, cPanelW: W - 10,
    cDivY: divY,
    // top panel (RGB) — canvas y values
    cTitleY:  22,
    cRY:  60, cGY: 105, cBY: 150,
    cSwatchY: 193, cSwatchH: panelH - 200,
    // bottom panel (RYB) — canvas y values (offset by divY + gap)
    cBotBase: divY + 10,
    cBotTitleY: divY + 22,
    cBotRY:  divY + 60, cBotGY: divY + 105, cBotBY: divY + 150,
    cBotSwatchY: divY + 193, cBotSwatchH: H - (divY + 200),
    // sandbox y for DOM sliders (canvas y + 50)
    sLX: 35, sRX: 35, sSliderW: W - 45,
    sRY:  60 + 50, sGY: 105 + 50, sBY: 150 + 50,
    sBotRY: divY + 60 + 50, sBotGY: divY + 105 + 50, sBotBY: divY + 150 + 50,
    labelSize: 19,
    titleSize: 19,
  };
  setupMixer(rc, ctx, L);
}

function setupMixer(rc, ctx, L) {
  const onChange = () => draw(rc, ctx, L);
  Slider({id: 'mix-rgb-r', min: 0, max: 255, value: 128, x: L.sLX, y: L.sRY, w: L.sSliderW, onChange});
  Slider({id: 'mix-rgb-g', min: 0, max: 255, value: 128, x: L.sLX, y: L.sGY, w: L.sSliderW, onChange});
  Slider({id: 'mix-rgb-b', min: 0, max: 255, value: 128, x: L.sLX, y: L.sBY, w: L.sSliderW, onChange});

  const rybY = L.isMobile ? L.sBotRY : L.sRY;
  const rybGY = L.isMobile ? L.sBotGY : L.sGY;
  const rybBY = L.isMobile ? L.sBotBY : L.sBY;
  const rybX  = L.isMobile ? L.sRX    : L.sRX;
  Slider({id: 'mix-ryb-r', min: 0, max: 100, value: 0, x: rybX, y: rybY,  w: L.sSliderW, onChange});
  Slider({id: 'mix-ryb-y', min: 0, max: 100, value: 0, x: rybX, y: rybGY, w: L.sSliderW, onChange});
  Slider({id: 'mix-ryb-b', min: 0, max: 100, value: 0, x: rybX, y: rybBY, w: L.sSliderW, onChange});

  draw(rc, ctx, L);
}

function draw(rc, ctx, L) {
  clearCanvas(ctx);

  const rgbR = +document.getElementById('mix-rgb-r').value;
  const rgbG = +document.getElementById('mix-rgb-g').value;
  const rgbB = +document.getElementById('mix-rgb-b').value;
  const rybR = document.getElementById('mix-ryb-r').value / 100;
  const rybY = document.getElementById('mix-ryb-y').value / 100;
  const rybBv = document.getElementById('mix-ryb-b').value / 100;
  const [rR, rG, rB] = rybToRgb(rybR, rybY, rybBv);

  if (L.isMobile) {
    drawMobile(rc, ctx, L, rgbR, rgbG, rgbB, rR, rG, rB);
  } else {
    drawDesktop(rc, ctx, L, rgbR, rgbG, rgbB, rR, rG, rB);
  }
}

function drawDesktop(rc, ctx, L, rgbR, rgbG, rgbB, rR, rG, rB) {
  const {cLeft, cRight, cPanelW, cDivX, labelSize, titleSize} = L;

  // Titles
  ctx.font = `bold ${titleSize}px Gaegu`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#222';
  ctx.fillText('Light mixing (RGB)', cLeft + cPanelW / 2, L.cTitleY);
  ctx.fillText('Paint mixing (RYB)', cRight + cPanelW / 2, L.cTitleY);

  // Slider labels
  ctx.textAlign = 'left';
  ctx.font = `${labelSize}px Gaegu`;
  ctx.fillStyle = '#cc2200'; ctx.fillText('R', cLeft + 4, L.cRY);
  ctx.fillStyle = '#228822'; ctx.fillText('G', cLeft + 4, L.cGY);
  ctx.fillStyle = '#0033cc'; ctx.fillText('B', cLeft + 4, L.cBY);

  ctx.fillStyle = '#cc2200'; ctx.fillText('R', cRight + 4, L.cRY);
  ctx.fillStyle = '#998800'; ctx.fillText('Y', cRight + 4, L.cGY);
  ctx.fillStyle = '#0033cc'; ctx.fillText('B', cRight + 4, L.cBY);

  // Vertical divider
  ctx.save();
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(cDivX, 8);
  ctx.lineTo(cDivX, ctx.canvas.height - 8);
  ctx.strokeStyle = '#bbb';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // RGB swatch
  ctx.fillStyle = `rgb(${rgbR},${rgbG},${rgbB})`;
  ctx.fillRect(cLeft, L.cSwatchY, cPanelW, L.cSwatchH);
  rc.rectangle(cLeft, L.cSwatchY, cPanelW, L.cSwatchH, {roughness: 1.2, seed: 1});
  ctx.font = `${labelSize - 2}px Gaegu`;
  ctx.textAlign = 'center';
  ctx.fillStyle = contrastColor(rgbR, rgbG, rgbB);
  ctx.fillText(`rgb(${rgbR}, ${rgbG}, ${rgbB})`, cLeft + cPanelW / 2, L.cSwatchY + L.cSwatchH / 2 + 7);

  // RYB swatch
  ctx.fillStyle = `rgb(${rR},${rG},${rB})`;
  ctx.fillRect(cRight, L.cSwatchY, cPanelW, L.cSwatchH);
  rc.rectangle(cRight, L.cSwatchY, cPanelW, L.cSwatchH, {roughness: 1.2, seed: 2});
  ctx.fillStyle = contrastColor(rR, rG, rB);
  ctx.fillText(`rgb(${rR}, ${rG}, ${rB})`, cRight + cPanelW / 2, L.cSwatchY + L.cSwatchH / 2 + 7);
}

function drawMobile(rc, ctx, L, rgbR, rgbG, rgbB, rR, rG, rB) {
  const {cLeft, cPanelW, labelSize, titleSize} = L;

  // ── Top panel: RGB ──
  ctx.font = `bold ${titleSize}px Gaegu`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#222';
  ctx.fillText('Light mixing (RGB)', cLeft + cPanelW / 2, L.cTitleY);

  ctx.textAlign = 'left';
  ctx.font = `${labelSize}px Gaegu`;
  ctx.fillStyle = '#cc2200'; ctx.fillText('R', cLeft + 4, L.cRY);
  ctx.fillStyle = '#228822'; ctx.fillText('G', cLeft + 4, L.cGY);
  ctx.fillStyle = '#0033cc'; ctx.fillText('B', cLeft + 4, L.cBY);

  ctx.fillStyle = `rgb(${rgbR},${rgbG},${rgbB})`;
  ctx.fillRect(cLeft, L.cSwatchY, cPanelW, L.cSwatchH);
  rc.rectangle(cLeft, L.cSwatchY, cPanelW, L.cSwatchH, {roughness: 1.2, seed: 1});
  ctx.font = `${labelSize - 2}px Gaegu`;
  ctx.textAlign = 'center';
  ctx.fillStyle = contrastColor(rgbR, rgbG, rgbB);
  ctx.fillText(`rgb(${rgbR}, ${rgbG}, ${rgbB})`, cLeft + cPanelW / 2, L.cSwatchY + L.cSwatchH / 2 + 7);

  // Horizontal divider
  ctx.save();
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(8, L.cDivY);
  ctx.lineTo(L.cW - 8, L.cDivY);
  ctx.strokeStyle = '#bbb';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // ── Bottom panel: RYB ──
  ctx.font = `bold ${titleSize}px Gaegu`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#222';
  ctx.fillText('Paint mixing (RYB)', cLeft + cPanelW / 2, L.cBotTitleY);

  ctx.textAlign = 'left';
  ctx.font = `${labelSize}px Gaegu`;
  ctx.fillStyle = '#cc2200'; ctx.fillText('R', cLeft + 4, L.cBotRY);
  ctx.fillStyle = '#998800'; ctx.fillText('Y', cLeft + 4, L.cBotGY);
  ctx.fillStyle = '#0033cc'; ctx.fillText('B', cLeft + 4, L.cBotBY);

  ctx.fillStyle = `rgb(${rR},${rG},${rB})`;
  ctx.fillRect(cLeft, L.cBotSwatchY, cPanelW, L.cBotSwatchH);
  rc.rectangle(cLeft, L.cBotSwatchY, cPanelW, L.cBotSwatchH, {roughness: 1.2, seed: 2});
  ctx.font = `${labelSize - 2}px Gaegu`;
  ctx.textAlign = 'center';
  ctx.fillStyle = contrastColor(rR, rG, rB);
  ctx.fillText(`rgb(${rR}, ${rG}, ${rB})`, cLeft + cPanelW / 2, L.cBotSwatchY + L.cBotSwatchH / 2 + 7);
}
