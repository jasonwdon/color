export let WIDTH = 900;
export let HEIGHT = 500;

export function setDimensions(w, h) {
  WIDTH = w;
  HEIGHT = h;
}

// takes wavelength in nm and returns an rgba string
// from https://scienceprimer.com/javascript-code-convert-light-wavelength-color
export function wavelengthToColor(wavelength) {
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
    B = 0;
  } else if (wavelength >= 645 && wavelength <= 780) {
    R = 1;
    G = 0;
    B = 0;
  } else {
    R = 0;
    G = 0;
    B = 0;
  }

  let alpha = 0.85;
  return "rgba(" + (R * 100) + "%," + (G * 100) + "%," + (B * 100) + "%, " + alpha + ")";
}

// Because JQuery is for the weak
export function clearSandbox(interval) {
  clearInterval(interval.id);
  let sandbox = document.getElementById('sandbox');
  while (sandbox.childElementCount > 0) {
    sandbox.removeChild(sandbox.lastElementChild);
  }
}

export function removeById(id) {
  let element = document.getElementById(id);
  element.parentNode.removeChild(element);
}

export function clearCanvas(ctx) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
}
