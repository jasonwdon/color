//import { annotate } from 'https://unpkg.com/rough-notation?module';
import rough from 'https://unpkg.com/roughjs?module';
import {TextBox, Slider, Button} from './components.js';
import {wavelengthToColor, clearSandbox} from './utils.js';

// Global Constants
const WIDTH = 900;
const HEIGHT = 500;
const DELAY = 100;

document.addEventListener("DOMContentLoaded", init);
function init() {
  clearSandbox();

  TextBox({id:'main-title', text:'Color is Made Up', y:200, size: '75px'})
  Button({text: "Begin", size: '30px', y:350, onClick: intro})

  //temp override for debugging
  //electromagnetic();
}

function intro() {
  clearSandbox();

  let left = 100;
  TextBox({text: "In 2020, I tried to pick a color palette for a startup concept", x: left, y: 120, size: '30px', align: 'left'});
  TextBox({text: "I got distracted and the startup fell apart", x: left, y: 220, size:'30px', align: 'left'});
  TextBox({text: "Here's what I learned about <b>color</b>", x: left, y:320, size:'30px', align: 'left'});
  Button({text: "BACK", class: 'back-button', onClick: init})
  Button({text: "NEXT", class: 'next-button', onClick: electromagnetic})
}

function electromagnetic() {
  clearSandbox();
  
  let left = 50;
  let width = 500;
  TextBox({text: "When we’re older we learn that color is light reflecting off of objects at different wavelengths.", x: left, y: 50, w: width, size: '26px', align: 'left'});
  TextBox({text: "Harmless radiation that our eyeballs can interpret, visible light is a subset of the greater electromagnetic spectrum. ", 
    x: left, y: 200, w: width, size:'26px', align: 'left'});
  TextBox({text: "At different wavelengths, a different color is emitted", x: left, y:350, w: width-50, size:'26px', align: 'left'});

  TextBox({id: 'wavelength-text', text: "400nm", x: 710, y: 180, size:'22px'});
  Slider({id: 'wired-slider', value: 400, min: 400, max: 650, w: 410, y:400, x: 530, onChange: () => {
    let wavelength = document.getElementById("wired-slider").value;
    document.getElementById('wavelength-text').innerHTML = wavelength+'nm';
  }})

  //draw interactive
  let canvas = document.createElement('canvas');
	canvas.width = WIDTH;
	canvas.height= HEIGHT;
  let ctx = canvas.getContext('2d');
	let rc = rough.canvas(canvas);
  document.getElementById("sandbox").appendChild(canvas);
	setInterval(drawElectromagnetic.bind(null, ctx, rc), DELAY);

  Button({text: "BACK", class: 'back-button', onClick: intro})
  Button({text: "NEXT", class: 'next-button', onClick: electromagnetic})
}
//canvas context, roughjs canvas object
function drawElectromagnetic(ctx, rc) {
  clear(ctx);
  let wavelength = document.getElementById("wired-slider").value;
  let rgba = wavelengthToColor(wavelength)[0];
  let rect_width = 300
  let rect_height = 100

  rc.rectangle(centerX(rect_width)+240, centerY(rect_height)-40, rect_width,rect_height, {fill:rgba, fillStyle:'solid', roughness:2, seed:1});

  
  let gradient_width = 400;
  let gradient_height = 50;
  let gradient_x = centerX(gradient_width) + 240
  let gradient_y = centerY(gradient_height) + 70

  var grd = ctx.createLinearGradient(gradient_x, 0, gradient_x+gradient_width, 0);
  let stops = 50;
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

function clear(ctx) {
	ctx.fillStyle = 'rgba(255, 255, 255, 1)';
	ctx.fillRect(0,0,WIDTH,HEIGHT);
}
