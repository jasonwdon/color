//import { annotate } from 'https://unpkg.com/rough-notation?module';
import rough from 'https://unpkg.com/roughjs?module';

// Global Constants
const WIDTH = 500;
const HEIGHT = 300;
const DELAY = 75;

// Global contexts
let canvas; //canvas object
let ctx; //canvas context
let rc; //roughjs canvas object

document.addEventListener("DOMContentLoaded", initCanvas);

// run on DOMContentLoaded
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
  let hex = wavelengthToColor(400)[0]
  rc.rectangle(0,0,50,50, {fill:hex, fillStyle:'solid', roughness:1, seed:10})
}

function clear() {
	ctx.fillStyle = 'rgba(255, 255, 255, 1)';
	ctx.fillRect(0,0,canvas.width,canvas.height);
}

// takes wavelength in nm and returns an rgba value
// from https://scienceprimer.com/javascript-code-convert-light-wavelength-color
function wavelengthToColor(wavelength) {
  let R, G, B, alpha, colorSpace;
  let gamma = 1;

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

  // intensty is lower at the edges of the visible spectrum.
  if (wavelength > 780 || wavelength < 380) {
      alpha = 0;
  } else if (wavelength > 700) {
      alpha = (780 - wavelength) / (780 - 700);
  } else if (wavelength < 420) {
      alpha = (wavelength - 380) / (420 - 380);
  } else {
      alpha = 1;
  }

  colorSpace = ["rgba(" + (R * 100) + "%," + (G * 100) + "%," + (B * 100) + "%, " + alpha + ")", R, G, B, alpha]

  // colorSpace is an array with 5 elements.
  // The first element is the complete code as a string.  
  // Use colorSpace[0] as is to display the desired color.  
  // use the last four elements alone or together to access each of the individual r, g, b and a channels.  
  
  return colorSpace;
    
}