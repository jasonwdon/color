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

  let left = 125;
  TextBox({text: "In 2020, I tried to pick a color palette for a startup concept", x: left, y: 120, size: '30px', align: 'left'});
  TextBox({text: "I got distracted and the startup fell apart", x: left, y: 220, size:'30px', align: 'left'});
  TextBox({text: "Here's what I learned about <b style='color:blue'>c</b><b style='color:green'>o</b><b style='color:yellow'>l</b><b style='color:orange'>o</b><b style='color:red'>r</b>", x: left, y:320, size:'30px', align: 'left'});
  Button({text: "BACK", class: 'back-button', onClick: init})
  Button({text: "NEXT", class: 'next-button', onClick: ryb})
}

function ryb() {
  clearSandbox();

  let left = 50;
  let width = 480;
  TextBox({text: 
    "In elementary school, we learn that there are 3 primary colors: <b style='color:red'>Red</b>, <b style='color:yellow'>Yellow</b>, <b style='color:blue'>Blue</b>.<br><br>" + 
    "We can mix them in pairs to get our secondary colors, mix all of them to get black/brown, and mix none of them for white.<br><br>"+ 
    "Why Mrs. Johnson?<br><br>" +
    "Oh, it'll make sense when you're older.", x: left, y: 50, w: width, size: '26px', align: 'left'});

  //draw interactive
  let canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height= HEIGHT;
  let ctx = canvas.getContext('2d');
  ctx.globalCompositeOperation='multiply';
  let rc = rough.canvas(canvas);

  //don't need setinterval because this is static
  let diameter = 100;
  rc.circle(centerX(diameter)+300, centerY(diameter)-0.866*100-20, diameter, {fill:'rgba(255,0,0,1)', fillStyle:'solid', strokeWidth: 2, seed:1});
  rc.circle(centerX(diameter)+400, centerY(diameter)+70, diameter, {fill:'rgba(255,255,0,1)', fillStyle:'solid', strokeWidth: 2, seed:1});
  rc.circle(centerX(diameter)+200, centerY(diameter)+70, diameter, {fill:'rgba(0,0,255,1)', fillStyle:'solid', strokeWidth: 2, seed:1});

  diameter = 50;
  rc.circle(centerX(diameter)+200+20, centerY(diameter)-(0.866*50), diameter, {fill:'rgba(128,0,128,1)', fillStyle:'solid', strokeWidth: 2, seed:1});
  rc.circle(centerX(diameter)+350-20, centerY(diameter)-(0.866*50), diameter, {fill:'rgba(255,165,0,1)', fillStyle:'solid', strokeWidth: 2, seed:1});
  rc.circle(centerX(diameter)+275, centerY(diameter)+50, diameter, {fill:'rgba(0,128,0,1)', fillStyle:'solid', strokeWidth: 2, seed:1});
  rc.circle(centerX(diameter)+275, centerY(diameter)-20, diameter, {fill:'rgba(0,0,0,1)', fillStyle:'solid', strokeWidth: 2, seed:1});

  document.getElementById("sandbox").appendChild(canvas);

  Button({text: "BACK", class: 'back-button', onClick: intro})
  Button({text: "NEXT", class: 'next-button', onClick: electromagnetic})
}


function electromagnetic() {
  clearSandbox();
  
  let left = 50;
  let width = 430;
  TextBox({text: 
    "When we're older we learn that color is light reflecting off of objects at different intensities.<br><br>" + 
    "Our eyes interpret this light and send signals to the brain.<br><br>" + 
    "At different wavelengths, we see different colors.", x: left, y: 50, w: width, size: '26px', align: 'left'});

  TextBox({id: 'wavelength-text', text: "400nm", x: 710, y: 110, size:'22px'});
  Slider({id: 'wired-slider', value: 400, min: 400, max: 650, w: 410, y:330, x: 535, onChange: () => {
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

  Button({text: "BACK", class: 'back-button', onClick: ryb})
  Button({text: "NEXT", class: 'next-button', onClick: electromagnetic})
}

//canvas context, roughjs canvas object
function drawElectromagnetic(ctx, rc) {
  clear(ctx);
  let wavelength = document.getElementById("wired-slider").value;
  let rgba = wavelengthToColor(wavelength)[0];
  let rect_width = 300
  let rect_height = 100

  rc.rectangle(centerX(rect_width)+240, centerY(rect_height)-110, rect_width,rect_height, {fill:rgba, fillStyle:'solid', roughness:2, seed:1});

  
  let gradient_width = 400;
  let gradient_height = 50;
  let gradient_x = centerX(gradient_width) + 240
  let gradient_y = centerY(gradient_height)

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
  ctx.clearRect(0,0,WIDTH,HEIGHT);
}
