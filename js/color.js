import rough from 'https://unpkg.com/roughjs?module';
import {Button} from './components.js?v=40';
import {clearSandbox, setDimensions} from './utils.js?v=40';
import {TitleDesktop, TitleMobile, RYBDesktop, RYBMobile, ElectromagneticDesktop, ElectromagneticMobile, ConesDesktop, ConesMobile, LightMixingDesktop, LightMixingMobile, PaintMixingDesktop, PaintMixingMobile} from './slides/AllSlides.js?v=40';

let interval = {id: null};
let slideIndex = 0;

const slides = [
  { name: 'title',           desktop: TitleDesktop,           mobile: TitleMobile },
  { name: 'ryb',             desktop: RYBDesktop,             mobile: RYBMobile },
  { name: 'electromagnetic', desktop: ElectromagneticDesktop, mobile: ElectromagneticMobile },
  { name: 'cones',           desktop: ConesDesktop,           mobile: ConesMobile },
  { name: 'light-mixing',    desktop: LightMixingDesktop,     mobile: LightMixingMobile },
  { name: 'paint-mixing',    desktop: PaintMixingDesktop,     mobile: PaintMixingMobile },
];

document.addEventListener("DOMContentLoaded", init);

function getLayout() {
  const isMobile = window.matchMedia('(max-width: 480px)').matches;
  const width  = isMobile ? window.innerWidth : 900;
  // On phones the sandbox is 100svh, the screen height with the browser bars
  // showing, which doesn't change as the bars slide in and out. Taking the
  // canvas height from it (rather than innerHeight) keeps it steady.
  const sandboxH = document.getElementById('sandbox').clientHeight || window.innerHeight;
  const height = isMobile ? sandboxH - 100 : 500;
  return { width, height, isMobile };
}

function init() {
  const hash = window.location.hash.slice(1);
  const namedIndex = slides.findIndex(s => s.name === hash);
  slideIndex = namedIndex >= 0 ? namedIndex : 0;
  showSlide(slideIndex);

  // Phones fire resize when the browser bars show or hide, which only changes
  // the height. Redrawing then makes the slide flash, so only redraw when the
  // width changes (e.g. turning the phone) or we cross the phone breakpoint.
  let lastWidth = window.innerWidth;
  let lastMobile = getLayout().isMobile;
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const { isMobile } = getLayout();
      if (window.innerWidth === lastWidth && isMobile === lastMobile) return;
      lastWidth = window.innerWidth;
      lastMobile = isMobile;
      showSlide(slideIndex);
    }, 150);
  });
}

function showSlide(i) {
  const { width, height, isMobile } = getLayout();
  setDimensions(width, height);
  history.replaceState(null, '', i === 0 ? window.location.pathname : '#' + slides[i].name);
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
    // on short phones 70% down lands on "by Jason", so keep Begin below it
    const beginY = isMobile ? Math.max(Math.round(height * 0.7), 410) : Math.round(height * 0.7);
    Button({text: "Begin", size: '30px', y: beginY, onClick: nextSlide})
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
