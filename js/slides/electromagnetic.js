import {TextBox, Slider} from '../components.js';
import {wavelengthToColor, clearCanvas} from '../utils.js';

const DELAY = 100;

const DESKTOP_L = {
  textX: 50,  textY: 50,  textW: 430, textSize: '26px',
  w1LabelX: 710, w1LabelY: 179, w1LabelSize: '22px',
  slider1X: 535, slider1Y: 330, slider1W: 410,
  rectX: 540,  rectY: 90,  rectW: 300, rectH: 100,
  gradX: 490,  gradY: 225, gradW: 400, gradH: 50,
  noteX: 535, noteY: 390, noteW: 410, noteSize: '14px',
};

const MOBILE_L = {
  textX: 15,  textY: 20,  textW: 360, textSize: '18px',
  w1LabelX: 170, w1LabelY: 318, w1LabelSize: '18px',
  slider1X: 15, slider1Y: 420, slider1W: 360,
  rectX: 130, rectY: 240, rectW: 130, rectH: 75,
  gradX: 15,  gradY: 345, gradW: 360, gradH: 40,
  noteX: 15, noteY: 480, noteW: 360, noteSize: '12px',
};

export function ElectromagneticDesktop(rc, ctx, interval) {
  setupEM(rc, ctx, interval, DESKTOP_L);
}

export function ElectromagneticMobile(rc, ctx, interval) {
  setupEM(rc, ctx, interval, MOBILE_L);
}

function setupEM(rc, ctx, interval, L) {
  interval.id = setInterval(drawElectromagnetic.bind(null, ctx, rc, L), DELAY);

  TextBox({id: 'electromagnetic-text', text:
    "When we're older we learn that color is light reflecting off of objects at different intensities.<br><br>" +
    "Our eyes interpret this light and send signals to the brain.<br><br>" +
    "At different wavelengths, we see different colors.",
    x: L.textX, y: L.textY, w: L.textW, size: L.textSize, align: 'left'});

  TextBox({id: 'wavelength1', text: "400nm", x: L.w1LabelX, y: L.w1LabelY, size: L.w1LabelSize});

  Slider({id: 'slider1', value: 400, min: 400, max: 650,
    w: L.slider1W, y: L.slider1Y, x: L.slider1X, onChange: () => {
      let wavelength = document.getElementById("slider1").value;
      document.getElementById('wavelength1').innerHTML = wavelength + 'nm';
    }});

  TextBox({text: "* all wavelengths above 650nm appear as the same red on modern displays",
    x: L.noteX, y: L.noteY, w: L.noteW, size: L.noteSize, align: 'left'});
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
