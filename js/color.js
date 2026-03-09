import rough from 'https://unpkg.com/roughjs?module';
import {Button} from './components.js';
import {clearSandbox, setDimensions} from './utils.js';
import {TitleDesktop, TitleMobile, RYBDesktop, RYBMobile, ElectromagneticDesktop, ElectromagneticMobile, ConesDesktop, ConesMobile, ColorMixerDesktop, ColorMixerMobile} from './slides/AllSlides.js';

let interval = {id: null};
let slideIndex = 0;

const slides = [
  { name: 'title',           desktop: TitleDesktop,           mobile: TitleMobile },
  { name: 'ryb',             desktop: RYBDesktop,             mobile: RYBMobile },
  { name: 'electromagnetic', desktop: ElectromagneticDesktop, mobile: ElectromagneticMobile },
  { name: 'cones',           desktop: ConesDesktop,           mobile: ConesMobile },
  { name: 'color-mixer',     desktop: ColorMixerDesktop,      mobile: ColorMixerMobile },
];

document.addEventListener("DOMContentLoaded", init);

function getLayout() {
  const isMobile = window.matchMedia('(max-width: 480px)').matches;
  const width  = isMobile ? window.innerWidth : 900;
  const height = isMobile ? window.innerHeight - 100 : 500;
  return { width, height, isMobile };
}

function init() {
  const hash = window.location.hash.slice(1);
  const namedIndex = slides.findIndex(s => s.name === hash);
  slideIndex = namedIndex >= 0 ? namedIndex : 0;
  showSlide(slideIndex);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => showSlide(slideIndex), 150);
  });
}

function showSlide(i) {
  const { width, height, isMobile } = getLayout();
  setDimensions(width, height);
  window.location.hash = slides[i].name;
  clearSandbox(interval);

  let canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  let ctx = canvas.getContext('2d');
  let rc = rough.canvas(canvas);
  document.getElementById("sandbox").appendChild(canvas);

  const slideFn = isMobile ? slides[i].mobile : slides[i].desktop;
  slideFn(rc, ctx, interval);

  if (slideIndex === 0) {
    Button({text: "Begin", size: '30px', y: Math.round(height * 0.7), onClick: nextSlide})
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
