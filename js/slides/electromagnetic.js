import {TextBox, Button, Slider} from '../components.js';
import {wavelengthToColor, removeById, clearCanvas} from '../utils.js';

const DELAY = 100;


export function ElectromagneticSlide(rc, ctx, interval) {
	interval.interval = setInterval(drawElectromagnetic.bind(null, ctx, rc), DELAY);

  let left = 50;
  let width = 430;
  TextBox({id: 'electromagnetic-text', text: 
    "When we're older we learn that color is light reflecting off of objects at different intensities.<br><br>" + 
    "Our eyes interpret this light and send signals to the brain.<br><br>" + 
    "At different wavelengths, we see different colors.", x: left, y: 50, w: width, size: '26px', align: 'left'});
  Button({id: 'mix-wavelengths-button', text: "mixing wavelengths?", x:125, y: 400, size: '20px', onClick: mixingWavelengths.bind(null, rc, ctx, interval)})

  TextBox({id: 'wavelength1', text: "400nm", x: 710, y: 110, size:'22px'});
  Slider({id: 'slider1', value: 400, min: 400, max: 650, w: 410, y:330, x: 535, onChange: () => {
    let wavelength = document.getElementById("slider1").value;
    document.getElementById('wavelength1').innerHTML = wavelength+'nm';
  }})


}

//canvas context, roughjs canvas object
function drawElectromagnetic(ctx, rc) {
  clearCanvas(ctx);
  let wavelength = document.getElementById("slider1").value;
  let rgba = wavelengthToColor(wavelength)[0];
  let rect_width = 300
  let rect_height = 100

  rc.rectangle(540, 90, rect_width,rect_height, {fill:rgba, fillStyle:'solid', roughness:2, seed:1});

  let gradient_width = 400;
  let gradient_height = 50;
  let gradient_x = 490;
  let gradient_y = 225;

  var grd = ctx.createLinearGradient(gradient_x, 0, gradient_x+gradient_width, 0);
  let stops = 50;
  for (let i = 0; i<=stops; i++) {
    //linearly map i from 400 to 650
    let wave = i*(250/stops) + 400
    grd.addColorStop(i*(1/stops), wavelengthToColor(wave)[0])
  }
  rc.rectangle(gradient_x, gradient_y, gradient_width,gradient_height, {fill:grd, fillStyle:'solid', roughness:0});
}

function mixingWavelengths(rc, ctx, interval) {
  removeById('electromagnetic-text');
  removeById('mix-wavelengths-button');

  let left = 50;
  let width = 430;
  TextBox({id: 'mix-wavelengths-text', text: 
  "So is mixing <b style='color:red'>Red</b>, <b style='color:yellow'>Yellow</b>, <b style='color:blue'>Blue</b> just averaging the wavelengths?<br><br>" + 
  "Let's try it:", x: left, y: 150, w: width, size: '26px', align: 'left'});

  clearInterval(interval.interval);
  interval.interval = setInterval(drawMixingWavelengths.bind(null, ctx, rc), DELAY);

  document.getElementById('slider1').value = 440;
  Slider({id: 'slider2', value: 580, min: 400, max: 650, w: 410, y:380, x: 535, onChange: () => {
    let wavelength = document.getElementById("slider2").value;
    document.getElementById('wavelength2').innerHTML = wavelength+'nm';
  }})
  document.getElementById('wavelength1').style.left = '650px';
  TextBox({id: 'wavelength2', text: "590nm", x: 770, y: 110, size:'22px'});
  TextBox({id: 'mix-wavelengths-text', text: 
  "<b style='color:red'>Red</b> + <b style='color:yellow'>Yellow</b> = <b style='color:orange'>Orange</b><br>" + 
  "<b style='color:blue'>Blue</b> + <b style='color:yellow'>Yellow</b> = <b style='color:lime'>Green</b><br>" +
  "<b style='color:red'>Red</b> + <b style='color:blue'>Blue</b> = <b style='color:purple'>Purple</b>", x: left+30, y: 300, w: width, size: '26px', align: 'left'});
  
  TextBox({text: "&#9989;", x: left+300, y: 300, size: '26px', align: 'left', class:'delay3'});
  TextBox({text: "&#9989;", x: left+295, y: 335, size: '26px', align: 'left', class:'delay4p5'});
  TextBox({text: "&#10060;", x: left+265, y: 368, size: '26px', align: 'left', class:'delay6'});

}

function drawMixingWavelengths(ctx, rc) {
  clearCanvas(ctx);
  let wavelength1 = document.getElementById("slider1").value;
  let wavelength2 = document.getElementById("slider2").value;
  let wavelength = (wavelength1 + wavelength2 ) / 2
  let rgba1 = wavelengthToColor(wavelength1)[0];
  let rgba2 = wavelengthToColor(wavelength2)[0];
  let rgba = wavelengthToColor(wavelength)[0];

  let rect_width = 300
  let rect_height = 100
  rc.rectangle(540, 90, rect_width,rect_height, {fill:rgba, fillStyle:'solid', roughness:2, seed:1});

  rect_width = 25;
  rect_height = rect_width;
  rc.rectangle(498, 128, rect_width,rect_height, {fill:rgba1, fillStyle:'solid', roughness:2, seed:1});
  rc.rectangle(853, 128, rect_width,rect_height, {fill:rgba2, fillStyle:'solid', roughness:2, seed:1});

  let gradient_width = 400;
  let gradient_height = 50;
  let gradient_x = 490;
  let gradient_y = 225

  var grd = ctx.createLinearGradient(gradient_x, 0, gradient_x+gradient_width, 0);
  let stops = 50;
  for (let i = 0; i<=stops; i++) {
    //linearly map i from 400 to 650
    let wave = i*(250/stops) + 400
    grd.addColorStop(i*(1/stops), wavelengthToColor(wave)[0])
  }
  rc.rectangle(gradient_x, gradient_y, gradient_width,gradient_height, {fill:grd, fillStyle:'solid', roughness:0});
}