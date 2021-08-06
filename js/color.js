//import { annotate } from 'https://unpkg.com/rough-notation?module';
import rough from 'https://unpkg.com/roughjs?module';
import {Button, RadioButton} from './components.js';
import {clearSandbox} from './utils.js';
import {Title, IntroSlide, RYBSlide, ElectromagneticSlide} from './slides/AllSlides.js';

// Global Constants
const WIDTH = 900;
const HEIGHT = 500;

// Global interval because I'm not clever enough
// also object so that we can mutate it's property by reference
let interval={interval:null};

//start here
document.addEventListener("DOMContentLoaded", init);

let slideIndex = 0;
let slides = [Title, IntroSlide, RYBSlide, ElectromagneticSlide]

function init() {
  //create nav bar
  for (let i = 0; i < 1; i++) {
    RadioButton({x: 500+i*50, w: 100, onClick: showSlide.bind(null, i), parent:'body'})
  }

  //show title slide
  showSlide(0);
}

function showSlide(i) {
  //clear the previous slide
  clearSandbox(interval);

  //set up canvas 
  let canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height= HEIGHT;
  let ctx = canvas.getContext('2d');
  let rc = rough.canvas(canvas);
  document.getElementById("sandbox").appendChild(canvas);

  //display slide by calling function
  slides[i](rc, ctx, interval);

  //show nav buttons
  if (slideIndex === 0) {
    Button({text: "Begin", size: '30px', y:350, onClick: nextSlide})
  } else {
    Button({text: "BACK", class: 'back-button', onClick: prevSlide})
    Button({text: "NEXT", class: 'next-button', onClick: nextSlide})
  }
}

function prevSlide() {
  if (slideIndex > 0) slideIndex--;
  showSlide(slideIndex);
}

function nextSlide() {
  if (slideIndex < slides.length - 1) slideIndex++;
  showSlide(slideIndex);
}