
// takes wavelength in nm and returns an rgba value
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

// Because JQuery is for the weak
export function clearSandbox() {
  clearInterval();
  let sandbox = document.getElementById('sandbox');
  while (sandbox.childElementCount > 0) {
    let child = sandbox.lastElementChild;
    sandbox.removeChild(child);
  }
}