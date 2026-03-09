import {TextBox, Slider} from '../components.js';
import {wavelengthToColor, clearCanvas} from '../utils.js';

const DELAY = 50;
const GRAPH_MIN = 400, GRAPH_MAX = 650;

const CONES = [
  { name: 'S cone', peak: 445, sigma: 38, color: [80,  80,  255] },
  { name: 'M cone', peak: 535, sigma: 55, color: [80,  180, 80]  },
  { name: 'L cone', peak: 575, sigma: 65, color: [255, 80,  80]  },
];

function sensitivity(wl, peak, sigma) {
  return Math.exp(-((wl - peak) ** 2) / (2 * sigma * sigma));
}

// all x/y values are sandbox coords; canvas coords = sandbox - 50
const DESKTOP_L = {
  textX: 50,  textY: 140, textW: 400, textSize: '24px',
  graphX: 490, graphY: 70, graphW: 400, graphH: 90,  graphGap: 115,
  sliderX: 490, sliderY: 455, sliderW: 400,
  rainbowH: 18,
  labelSize: 20,
  waitText: "But wait — red, green, blue?<br>Isn't that supposed to be red, <b>yellow</b>, blue?",
};

const MOBILE_L = {
  textX: 15,  textY: 20,  textW: 360, textSize: '22px',
  graphX: 60,  graphY: 210, graphW: 310, graphH: 75, graphGap: 100,
  sliderX: 15, sliderY: 545, sliderW: 360,
  rainbowH: 14,
  labelSize: 18,
  waitText: "But wait... isn't it red, yellow, blue?",
};

export function ConesDesktop(rc, ctx, interval) {
  setupCones(rc, ctx, interval, DESKTOP_L);
}

export function ConesMobile(rc, ctx, interval) {
  const { graphW } = MOBILE_L;
  const graphX  = Math.round((window.innerWidth - graphW) / 2) + 50;
  const sliderX = Math.round((window.innerWidth - graphW) / 2);
  setupCones(rc, ctx, interval, {...MOBILE_L, graphX, sliderX, sliderW: graphW});
}

function setupCones(rc, ctx, interval, L) {
  interval.id = setInterval(drawCones.bind(null, ctx, rc, L), DELAY);

  TextBox({text:
    "We also learn that our eyes have three types of cone cells.<br><br>" +
    "Each responds to a different range of wavelengths, and together they create our perception of color.<br><br>" +
    L.waitText,
    x: L.textX, y: L.textY, w: L.textW, size: L.textSize, align: 'left'});

  Slider({id: 'cone-slider', value: 580, min: 400, max: 650,
    x: L.sliderX, y: L.sliderY, w: L.sliderW, onChange: () => {}});
}

function drawCones(ctx, rc, L) {
  clearCanvas(ctx);
  const wl = parseFloat(document.getElementById('cone-slider').value);
  drawRainbow(ctx, L, wl);
  CONES.forEach((cone, i) => {
    drawConeGraph(ctx, cone,
      L.graphX - 50, L.graphY - 50 + i * L.graphGap,
      L.graphW, L.graphH, wl, L.labelSize);
  });
}

function drawRainbow(ctx, L, selectedWl) {
  const barH = L.rainbowH;
  const x = L.graphX - 50;                         // canvas coords
  const y = L.sliderY - 50 - barH - 8;             // 8px gap above slider
  const w = L.graphW;

  // Draw pixel-by-pixel rainbow across the visible spectrum range
  for (let px = 0; px <= w; px++) {
    const wl = GRAPH_MIN + (px / w) * (GRAPH_MAX - GRAPH_MIN);
    ctx.fillStyle = wavelengthToColor(wl);
    ctx.fillRect(x + px, y, 1, barH);
  }

  // Thin border
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, barH);

  // Vertical marker at selected wavelength
  const selX = x + (selectedWl - GRAPH_MIN) / (GRAPH_MAX - GRAPH_MIN) * w;
  ctx.save();
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(selX, y);
  ctx.lineTo(selX, y + barH);
  ctx.strokeStyle = 'rgba(0,0,0,0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawConeGraph(ctx, cone, x, y, w, h, selectedWl, labelSize) {
  const [r, g, b] = cone.color;
  const sens = sensitivity(selectedWl, cone.peak, cone.sigma);

  // Fill under curve
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  for (let px = 0; px <= w; px++) {
    const wl = GRAPH_MIN + (px / w) * (GRAPH_MAX - GRAPH_MIN);
    ctx.lineTo(x + px, y + h - sensitivity(wl, cone.peak, cone.sigma) * h * 0.85);
  }
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fillStyle = `rgba(${r},${g},${b},${0.05 + sens})`;
  ctx.fill();

  // Curve outline
  ctx.beginPath();
  for (let px = 0; px <= w; px++) {
    const wl = GRAPH_MIN + (px / w) * (GRAPH_MAX - GRAPH_MIN);
    const py = y + h - sensitivity(wl, cone.peak, cone.sigma) * h * 0.85;
    px === 0 ? ctx.moveTo(x, py) : ctx.lineTo(x + px, py);
  }
  ctx.strokeStyle = `rgb(${r},${g},${b})`;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Dashed vertical at selected wavelength
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  const selX = x + (selectedWl - GRAPH_MIN) / (GRAPH_MAX - GRAPH_MIN) * w;
  ctx.moveTo(selX, y);
  ctx.lineTo(selX, y + h);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // Axes
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + h);
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Cone label (top-right inside graph)
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.font = `${labelSize}px Gaegu`;
  ctx.textAlign = 'right';
  ctx.fillText(cone.name, x + w - 4, y + labelSize + 4);
  ctx.textAlign = 'left';
}
