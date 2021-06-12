//import { annotate } from 'https://unpkg.com/rough-notation?module';
import rough from 'https://unpkg.com/roughjs?module';
import {TextBox, Button} from './components.js';
import {clearSandbox} from './utils.js';
import {IntroSlide, RYBSlide, ElectromagneticSlide} from './slides/AllSlides.js';

// Global Constants
const WIDTH = 900;
const HEIGHT = 500;

// Global interval because I'm not clever enough
// also object so that we can mutate it's property by reference
let interval={interval:null};

//start here
document.addEventListener("DOMContentLoaded", showSlide);

let slideIndex = 0;
let slides = [Title, IntroSlide, RYBSlide, ElectromagneticSlide]
function prevSlide() {
  if (slideIndex > 0) slideIndex--;
  showSlide();
}
function nextSlide() {
  if (slideIndex < slides.length - 1) slideIndex++;
  showSlide();
}
function showSlide() {
  clearSandbox(interval);

  //set up
  let canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height= HEIGHT;
  let ctx = canvas.getContext('2d');
  ctx.globalCompositeOperation='multiply';
  let rc = rough.canvas(canvas);
  document.getElementById("sandbox").appendChild(canvas);


  slides[slideIndex](rc, ctx, interval);

  if (slideIndex === 0) {
    Button({text: "Begin", size: '30px', y:350, onClick: nextSlide})
  } else {
    Button({text: "BACK", class: 'back-button', onClick: prevSlide})
    Button({text: "NEXT", class: 'next-button', onClick: nextSlide})
  }
}

function Title() {
  TextBox({id:'main-title', text:'Color is Made Up', y:200, size: '75px'})
}
