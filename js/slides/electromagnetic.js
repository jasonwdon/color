import {TextBox, Slider} from '../components.js?v=14';
import {wavelengthToColor, clearCanvas, onResize, mobileContentBottom} from '../utils.js?v=14';

const DELAY = 100;

const DESKTOP_L = {
  textX: 50,  textY: 110, textW: 430, textSize: '26px',
  w1LabelX: 710, w1LabelY: 179, w1LabelSize: '22px',
  slider1X: 535, slider1Y: 330, slider1W: 410,
  rectX: 540,  rectY: 90,  rectW: 300, rectH: 100,
  gradX: 490,  gradY: 225, gradW: 400, gradH: 50,
  noteX: 535, noteY: 390, noteW: 410, noteSize: '14px',
};

// rect and grad are canvas coords; everything else is sandbox coords.
// On mobile the y values are filled in by layoutMobile once the text is measured.
const MOBILE_L = {
  textX: 15,  textY: 20,  textSize: '22px',
  w1LabelSize: '22px',
  rectW: 130, rectH: 75,
  gradH: 40,
  noteSize: '14px',
};

export function ElectromagneticDesktop(rc, ctx, interval) {
  setupEM(rc, ctx, interval, DESKTOP_L);
}

export function ElectromagneticMobile(rc, ctx, interval) {
  const W = window.innerWidth;
  const L = {...MOBILE_L,
    textW: W - 30,
    rectX: Math.round((W - MOBILE_L.rectW) / 2), rectY: 0,
    w1LabelX: Math.round((W - MOBILE_L.rectW) / 2), w1LabelW: MOBILE_L.rectW, w1LabelY: 0,
    gradX: 15, gradW: W - 30, gradY: 0,
    slider1X: 15, slider1W: W - 30, slider1Y: 0,
    noteX: 15, noteW: W - 30, noteY: 0,
  };
  const els = setupEM(rc, ctx, interval, L);
  layoutMobile(ctx, L, els);
}

// Stacks the color swatch, spectrum, slider and note below wherever the text
// ends, since the text wraps differently from phone to phone.
function layoutMobile(ctx, L, {text, label, slider, note}) {
  let fontSize = parseInt(MOBILE_L.textSize);
  onResize([text], () => {
    const offY = ctx.canvas.offsetTop;
    const top = text.offsetTop + text.offsetHeight + 20;
    const bottom = mobileContentBottom();
    // swatch, 30px gap, spectrum, slider thumb on its bottom edge, then the note
    const blockH = L.rectH + 30 + L.gradH + 70;
    if (bottom - top < blockH && fontSize > 16) {
      fontSize -= 1;
      text.style.fontSize = fontSize + 'px';
      return;
    }
    const rectTop = Math.round(top + Math.max(0, (bottom - top - blockH) / 3));
    L.rectY = rectTop - offY;
    L.gradY = L.rectY + L.rectH + 30;
    L.slider1Y = L.gradY + offY + 25;
    L.noteY = L.slider1Y + 45;
    label.style.top = (rectTop + L.rectH / 2 - label.offsetHeight / 2) + 'px';
    slider.style.top = L.slider1Y + 'px';
    note.style.top = L.noteY + 'px';
  });
}

function setupEM(rc, ctx, interval, L) {
  interval.id = setInterval(drawElectromagnetic.bind(null, ctx, rc, L), DELAY);

  const text = TextBox({id: 'electromagnetic-text', text:
    "Later on, we learn that color is <span class='rays'>light</span> reflecting off of objects at different intensities.<br><br>" +
    "Our eyes interpret this and send signals to the brain.<br><br>" +
    "At different wavelengths, we see different colors.",
    x: L.textX, y: L.textY, w: L.textW, size: L.textSize, align: 'left'});

  const label = TextBox({id: 'wavelength1', text: "400nm", x: L.w1LabelX, y: L.w1LabelY, w: L.w1LabelW,
    size: L.w1LabelSize, align: L.w1LabelW ? 'center' : undefined});

  const slider = Slider({id: 'slider1', value: 400, min: 400, max: 650,
    w: L.slider1W, y: L.slider1Y, x: L.slider1X, onChange: () => {
      let wavelength = document.getElementById("slider1").value;
      document.getElementById('wavelength1').innerHTML = wavelength + 'nm';
    }});

  const note = TextBox({text: "*wavelengths above 650nm are indistinguishable on screens",
    x: L.noteX, y: L.noteY, w: L.noteW, size: L.noteSize, align: 'center'});

  let dragging = false;

  function updateWavelength(clientX) {
    const rect = ctx.canvas.getBoundingClientRect();
    const scaleX = ctx.canvas.width / rect.width;
    const cx = Math.max(L.gradX, Math.min(L.gradX + L.gradW, (clientX - rect.left) * scaleX));
    const wl = Math.round(400 + (cx - L.gradX) / L.gradW * 250);
    document.getElementById('slider1').value = wl;
    document.getElementById('wavelength1').innerHTML = wl + 'nm';
  }

  ctx.canvas.addEventListener('pointerdown', (e) => {
    const rect = ctx.canvas.getBoundingClientRect();
    const scaleX = ctx.canvas.width / rect.width;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top)  * scaleX;
    if (cx >= L.gradX && cx <= L.gradX + L.gradW &&
        cy >= L.gradY && cy <= L.gradY + L.gradH) {
      dragging = true;
      ctx.canvas.setPointerCapture(e.pointerId);
      updateWavelength(e.clientX);
    }
  });

  ctx.canvas.addEventListener('pointermove', (e) => {
    if (dragging) updateWavelength(e.clientX);
  });

  ctx.canvas.addEventListener('pointerup',     () => { dragging = false; });
  ctx.canvas.addEventListener('pointercancel', () => { dragging = false; });

  return {text, label, slider, note};
}

function drawSpectrumGradient(ctx, rc, L) {
  let grd = ctx.createLinearGradient(L.gradX, 0, L.gradX + L.gradW, 0);
  let stops = 50;
  for (let i = 0; i <= stops; i++) {
    let wave = i * (250 / stops) + 400;
    grd.addColorStop(i * (1 / stops), wavelengthToColor(wave));
  }
  rc.rectangle(L.gradX, L.gradY, L.gradW, L.gradH, {fill: grd, fillStyle: 'solid', roughness: 0});
}

function drawElectromagnetic(ctx, rc, L) {
  clearCanvas(ctx);
  let wavelength = document.getElementById("slider1").value;
  let rgba = wavelengthToColor(wavelength);
  rc.rectangle(L.rectX, L.rectY, L.rectW, L.rectH, {fill: rgba, fillStyle: 'solid', roughness: 2, seed: 1});
  drawSpectrumGradient(ctx, rc, L);
}
