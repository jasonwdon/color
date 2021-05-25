//import { annotate } from 'https://unpkg.com/rough-notation?module';
import rough from 'https://unpkg.com/roughjs?module';

// Global Constants
const WIDTH = 500;
const HEIGHT = 200;
const DELAY = 100;

// Global contexts
let canvas; //canvas object
let ctx; //canvas context
let rc; //roughjs canvas object

document.addEventListener("DOMContentLoaded", initCanvas);
export function initCanvas() {
	canvas = document.getElementById('canvas');
	canvas.width = WIDTH;
	canvas.height= HEIGHT;

  ctx = canvas.getContext('2d');
	rc = rough.canvas(canvas);

	setInterval(draw, DELAY);
}

function draw() {
  clear();
  let wavelength = document.getElementById("wired-slider").value;
  let rgba = wavelengthToColor(wavelength)[0];
  let rect_width = 300
  let rect_height = 100

  rc.rectangle(centerX(rect_width), centerY(rect_height)-40, rect_width,rect_height, {fill:rgba, fillStyle:'solid', roughness:1});

  
  let gradient_width = 400;
  let gradient_height = 50;
  let gradient_x = centerX(gradient_width)
  let gradient_y = centerY(gradient_height) + 70

  var grd = ctx.createLinearGradient(gradient_x, 0, gradient_x+gradient_width, 0);
  let stops = 10
  for (let i = 0; i<=stops; i++) {
    //linearly map i from 400 to 650
    let wave = i*(250/stops) + 400
    grd.addColorStop(i*(1/stops), wavelengthToColor(wave)[0])
  }
  rc.rectangle(gradient_x, gradient_y, gradient_width,gradient_height, {fill:grd, fillStyle:'solid', roughness:0});

}

function centerX(object_width) {
  return WIDTH/2 - object_width/2;
}

function centerY(object_height) {
  return HEIGHT/2 - object_height/2;
}

function clear() {
	ctx.fillStyle = 'rgba(255, 255, 255, 1)';
	ctx.fillRect(0,0,canvas.width,canvas.height);
}

// takes wavelength in nm and returns an rgba value
// from https://scienceprimer.com/javascript-code-convert-light-wavelength-color
function wavelengthToColor(wavelength) {
  // modified to display full solid color, alpha is constant
  // works well from 400-650
  let R, G, B;

  if (wavelength >= 380 && wavelength < 440) {
      R = -1 * (wavelength - 440) / (440 - 380);
      G = 0;
      B = 1;
  } else if (wavelength >= 440 && wavelength < 490) {
      R = 0;
      G = (wavelength - 440) / (490 - 440);
      B = 1;  
  } else if (wavelength >= 490 && wavelength < 510) {
      R = 0;
      G = 1;
      B = -1 * (wavelength - 510) / (510 - 490);
  } else if (wavelength >= 510 && wavelength < 580) {
      R = (wavelength - 510) / (580 - 510);
      G = 1;
      B = 0;
  } else if (wavelength >= 580 && wavelength < 645) {
      R = 1;
      G = -1 * (wavelength - 645) / (645 - 580);
      B = 0.0;
  } else if (wavelength >= 645 && wavelength <= 780) {
      R = 1;
      G = 0;
      B = 0;
  } else {
      R = 0;
      G = 0;
      B = 0;
  }

  // make alpha a little softer for aesthetics
  let alpha = 0.75;

  let colorSpace = ["rgba(" + (R * 100) + "%," + (G * 100) + "%," + (B * 100) + "%, " + alpha + ")", R, G, B, alpha]
  return colorSpace;
}