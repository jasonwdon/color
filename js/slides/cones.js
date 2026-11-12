import {TextBox, Slider} from '../components.js?v=51';
import {wavelengthToColor, clearCanvas, onResize, mobileContentBottom} from '../utils.js?v=51';

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

// color words styled like the RYB and title slides
const RED    = "<b style='color:red'>red</b>";
const GREEN  = "<b style='color:green'>green</b>";
const BLUE   = "<b style='color:blue'>blue</b>";
const YELLOW = "<b style='color:yellow'>yellow</b>";

// same text on phones and desktop
const TEXT =
  "The eyes turn light into brain signals using 3 types of cone cells.<br><br>" +
  "Each responds to a different range of wavelengths, and together they create our perception of color.<br><br>" +
  `But wait: ${RED}, ${GREEN}, ${BLUE}?<br>Isn't that supposed to be ${RED}, ${YELLOW}, ${BLUE}?`;

// all x/y values are sandbox coords; the draw code converts them to canvas coords
const DESKTOP_L = {
  textX: 50,  textY: 60, textW: 400, textSize: '24px',
  graphX: 490, graphY: 70, graphW: 400, graphH: 90,  graphGap: 115,
  sliderX: 490, sliderY: 455, sliderW: 400,
  rainbowH: 18,
  labelSize: 20,
};

const MOBILE_L = {
  textX: 15,  textY: 20, textSize: 22,
  graphH: 75, graphGap: 100,
  rainbowH: 14,
  labelSize: 18,
};

export function ConesDesktop(rc, ctx, interval) {
  const L = {...DESKTOP_L};
  setupCones(rc, ctx, interval, L);
}

// On phones the text wraps differently from screen to screen, so the graphs,
// spectrum and slider are stacked below wherever the text actually ends.
export function ConesMobile(rc, ctx, interval) {
  const W = window.innerWidth;
  const graphW = Math.min(340, W - 50);
  const L = {...MOBILE_L,
    textW: W - 2 * MOBILE_L.textX,
    graphX: Math.round((W - graphW) / 2), graphW,
    sliderX: Math.round((W - graphW) / 2), sliderW: graphW,
    graphY: 0, sliderY: 0,
  };
  const {text, slider} = setupCones(rc, ctx, interval, {...L, textSize: L.textSize + 'px'}, L);

  let fontSize = MOBILE_L.textSize;
  onResize([text, slider], () => {
    const sliderH = slider.offsetHeight || 30;
    const top = text.offsetTop + text.offsetHeight + 12;
    const bottom = mobileContentBottom();
    // block = three graphs, then the spectrum bar 8px above the slider
    const fixed = L.rainbowH + 8 + sliderH;
    const gap = Math.min(MOBILE_L.graphGap, Math.floor((bottom - top - fixed) / 3));
    if (gap < 55 && fontSize > 16) {
      // not enough room on a short screen: shrink the text and lay out again
      fontSize -= 1;
      text.style.fontSize = fontSize + 'px';
      return;
    }
    L.graphGap = gap;
    L.graphH = Math.max(20, Math.min(MOBILE_L.graphH, gap - 22));
    const blockH = 2 * gap + L.graphH + 22 + fixed;
    L.graphY = Math.round(top + Math.max(0, (bottom - top - blockH) / 2));
    L.sliderY = L.graphY + blockH - sliderH;
    slider.style.top = L.sliderY + 'px';
  });
}

function setupCones(rc, ctx, interval, config, L = config) {
  const text = TextBox({text: TEXT,
    x: config.textX, y: config.textY, w: config.textW, size: config.textSize, align: 'left'});

  const slider = Slider({id: 'cone-slider', value: 580, min: 400, max: 650,
    x: config.sliderX, y: config.sliderY, w: config.sliderW, onChange: () => {}});

  interval.id = setInterval(drawCones.bind(null, ctx, rc, L), DELAY);
  return {text, slider};
}

function drawCones(ctx, rc, L) {
  clearCanvas(ctx);
  const wl = parseFloat(document.getElementById('cone-slider').value);
  // sandbox coords to canvas coords
  const offX = ctx.canvas.offsetLeft, offY = ctx.canvas.offsetTop;
  drawRainbow(ctx, L, wl, offX, offY);
  CONES.forEach((cone, i) => {
    drawConeGraph(ctx, cone,
      L.graphX - offX, L.graphY - offY + i * L.graphGap,
      L.graphW, L.graphH, wl, L.labelSize);
  });
}

function drawRainbow(ctx, L, selectedWl, offX, offY) {
  const barH = L.rainbowH;
  const x = L.graphX - offX;                       // canvas coords
  const y = L.sliderY - offY - barH - 8;           // 8px gap above slider
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
  // white outline keeps the label readable where the curve's fill runs under it
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.strokeText(cone.name, x + w - 4, y + labelSize + 4);
  ctx.fillText(cone.name, x + w - 4, y + labelSize + 4);
  ctx.textAlign = 'left';
}
