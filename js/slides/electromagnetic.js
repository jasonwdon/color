import {TextBox, Button, Slider} from '../components.js';
import {wavelengthToColor, removeById, clearCanvas} from '../utils.js';

const DELAY = 100;

const DESKTOP_L = {
  textX: 50,  textY: 50,  textW: 430, textSize: '26px',
  btnX: 125,  btnY: 400,  btnSize: '20px',
  w1LabelX: 710, w1LabelY: 110, w1LabelSize: '22px',
  slider1X: 535, slider1Y: 330, slider1W: 410,
  rectX: 540,  rectY: 90,  rectW: 300, rectH: 100,
  gradX: 490,  gradY: 225, gradW: 400, gradH: 50,
  swatch1X: 498, swatchY: 128, swatchSize: 25,
  swatch2X: 853,
  w1MoveX: '650px',
  w2LabelX: 770, w2LabelY: 110, w2LabelSize: '22px',
  slider2X: 535, slider2Y: 380, slider2W: 410,
  mixTextX: 50,  mixTextY: 150, mixTextW: 430, mixTextSize: '26px',
  resultsX: 80,  resultsY: 300, resultsW: 430, resultsSize: '26px',
  check1X: 350, check1Y: 300,
  check2X: 345, check2Y: 335,
  crossX:  315, crossY:  368,
};

const MOBILE_L = {
  textX: 15,  textY: 20,  textW: 360, textSize: '18px',
  btnX: 70,   btnY: 530,  btnSize: '16px',
  w1LabelX: 170, w1LabelY: 210, w1LabelSize: '18px',
  slider1X: 15, slider1Y: 420, slider1W: 360,
  rectX: 130, rectY: 240, rectW: 130, rectH: 75,
  gradX: 15,  gradY: 345, gradW: 360, gradH: 40,
  swatch1X: 108, swatchY: 268, swatchSize: 22,
  swatch2X: 262,
  w1MoveX: '130px',
  w2LabelX: 240, w2LabelY: 210, w2LabelSize: '18px',
  slider2X: 15, slider2Y: 490, slider2W: 360,
  mixTextX: 15,  mixTextY: 20,  mixTextW: 360, mixTextSize: '18px',
  resultsX: 15,  resultsY: 380, resultsW: 360, resultsSize: '18px',
  check1X: 310, check1Y: 380,
  check2X: 305, check2Y: 415,
  crossX:  275, crossY:  448,
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

  Button({id: 'mix-wavelengths-button', text: "mixing wavelengths?",
    x: L.btnX, y: L.btnY, size: L.btnSize,
    onClick: mixingWavelengths.bind(null, rc, ctx, interval, L)});

  TextBox({id: 'wavelength1', text: "400nm", x: L.w1LabelX, y: L.w1LabelY, size: L.w1LabelSize});

  Slider({id: 'slider1', value: 400, min: 400, max: 650,
    w: L.slider1W, y: L.slider1Y, x: L.slider1X, onChange: () => {
      let wavelength = document.getElementById("slider1").value;
      document.getElementById('wavelength1').innerHTML = wavelength + 'nm';
    }});
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

function mixingWavelengths(rc, ctx, interval, L) {
  removeById('electromagnetic-text');
  removeById('mix-wavelengths-button');

  TextBox({id: 'mix-wavelengths-text', text:
    "So is mixing <b style='color:red'>Red</b>, <b style='color:yellow'>Yellow</b>, <b style='color:blue'>Blue</b> just averaging the wavelengths?<br><br>" +
    "Let's try it:",
    x: L.mixTextX, y: L.mixTextY, w: L.mixTextW, size: L.mixTextSize, align: 'left'});

  clearInterval(interval.id);
  interval.id = setInterval(drawMixingWavelengths.bind(null, ctx, rc, L), DELAY);

  document.getElementById('slider1').value = 440;
  Slider({id: 'slider2', value: 580, min: 400, max: 650,
    w: L.slider2W, y: L.slider2Y, x: L.slider2X, onChange: () => {
      let wavelength = document.getElementById("slider2").value;
      document.getElementById('wavelength2').innerHTML = wavelength + 'nm';
    }});

  document.getElementById('wavelength1').style.left = L.w1MoveX;
  TextBox({id: 'wavelength2', text: "580nm", x: L.w2LabelX, y: L.w2LabelY, size: L.w2LabelSize});

  TextBox({id: 'mix-results-text', text:
    "<b style='color:red'>Red</b> + <b style='color:yellow'>Yellow</b> = <b style='color:orange'>Orange</b><br>" +
    "<b style='color:blue'>Blue</b> + <b style='color:yellow'>Yellow</b> = <b style='color:lime'>Green</b><br>" +
    "<b style='color:red'>Red</b> + <b style='color:blue'>Blue</b> = <b style='color:purple'>Purple</b>",
    x: L.resultsX, y: L.resultsY, w: L.resultsW, size: L.resultsSize, align: 'left'});

  TextBox({text: "&#9989;",  x: L.check1X, y: L.check1Y, size: L.resultsSize, align: 'left', class: 'delay3'});
  TextBox({text: "&#9989;",  x: L.check2X, y: L.check2Y, size: L.resultsSize, align: 'left', class: 'delay4p5'});
  TextBox({text: "&#10060;", x: L.crossX,  y: L.crossY,  size: L.resultsSize, align: 'left', class: 'delay6'});
}

function drawMixingWavelengths(ctx, rc, L) {
  clearCanvas(ctx);
  let wavelength1 = document.getElementById("slider1").value;
  let wavelength2 = document.getElementById("slider2").value;
  let wavelength = (wavelength1 + wavelength2) / 2;
  let rgba1 = wavelengthToColor(wavelength1);
  let rgba2 = wavelengthToColor(wavelength2);
  let rgba  = wavelengthToColor(wavelength);

  rc.rectangle(L.rectX,   L.rectY,   L.rectW,     L.rectH,     {fill: rgba,  fillStyle: 'solid', roughness: 2, seed: 1});
  rc.rectangle(L.swatch1X, L.swatchY, L.swatchSize, L.swatchSize, {fill: rgba1, fillStyle: 'solid', roughness: 2, seed: 1});
  rc.rectangle(L.swatch2X, L.swatchY, L.swatchSize, L.swatchSize, {fill: rgba2, fillStyle: 'solid', roughness: 2, seed: 1});

  drawSpectrumGradient(ctx, rc, L);
}
