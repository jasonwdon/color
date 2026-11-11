import {TextBox} from '../components.js?v=36';
import {clearCanvas, onResize, mobileContentBottom} from '../utils.js?v=36';

export function RYBDesktop(rc) {
  let left = 50;
  let width = 480;
  TextBox({text:
    "In elementary school, we learn that there are 3 primary colors: <b style='color:red'>Red</b>, <b style='color:yellow'>Yellow</b>, <b style='color:blue'>Blue</b>.<br><br>" +
    "We can mix them to get our secondary colors, mix all of them to get <b>black</b>/<b style='color:saddlebrown'>brown</b>, and the paper was <b style='color:white; background-color:black; padding: 0 4px; border-radius: 3px;'>white</b> to begin with.<br><br>" +
    "It was good enough for second grade.", x: left, y: 100, w: width, size: '26px', align: 'left'});

  let diameter = 100;
  rc.circle(700, 93.4, diameter, {fill: 'rgba(255,0,0,1)',   fillStyle: 'solid', strokeWidth: 2, seed: 1});
  rc.circle(800, 270,  diameter, {fill: 'rgba(255,255,0,1)', fillStyle: 'solid', strokeWidth: 2, seed: 1});
  rc.circle(600, 270,  diameter, {fill: 'rgba(0,0,255,1)',   fillStyle: 'solid', strokeWidth: 2, seed: 1});

  diameter = 50;
  rc.circle(645, 182, diameter, {fill: 'rgba(128,0,128,1)',   fillStyle: 'solid', strokeWidth: 2, seed: 1});
  rc.circle(755, 182, diameter, {fill: 'rgba(255,165,0,1)',   fillStyle: 'solid', strokeWidth: 2, seed: 1});
  rc.circle(700, 275, diameter, {fill: 'rgba(0,128,0,1)',     fillStyle: 'solid', strokeWidth: 2, seed: 1});
  rc.circle(700, 205, diameter, {fill: 'rgba(0,0,0,1)',       fillStyle: 'solid', strokeWidth: 2, seed: 1});
}

export function RYBMobile(rc, ctx) {
  const W = window.innerWidth;
  const text = TextBox({text:
    "In elementary school, we learn that there are 3 primary colors: <b style='color:red'>Red</b>, <b style='color:yellow'>Yellow</b>, <b style='color:blue'>Blue</b>.<br><br>" +
    "We can mix them to get our secondary colors, mix all of them to get <b>black</b>/<b style='color:saddlebrown'>brown</b>, and the paper was <b style='color:white; background-color:black; padding: 0 4px; border-radius: 3px;'>white</b> to begin with.<br><br>" +
    "It was good enough for second grade.", x: 15, y: 30, w: W - 30, size: '24px', align: 'left'});

  // The circles go in the space between the end of the text and the buttons,
  // shrinking if that space is short, so they never cover the text.
  let fontSize = 24;
  onResize([text], () => {
    const top = text.offsetTop + text.offsetHeight + 10;
    const bottom = mobileContentBottom();
    const clusterH = 210; // from the top of the red circle to the bottom of blue and yellow
    if (bottom - top < clusterH * 0.7 && fontSize > 18) {
      fontSize -= 1;
      text.style.fontSize = fontSize + 'px';
      return;
    }
    const scale = Math.min(1, (bottom - top) / clusterH);
    const cx = ctx.canvas.width / 2;
    const cy = (top + bottom) / 2 - ctx.canvas.offsetTop + 20 * scale; // black circle sits below the middle
    clearCanvas(ctx);
    drawMobileCircles(rc, cx, cy, scale);
  });
}

function drawMobileCircles(rc, cx, cy, s) {
  const circle = (dx, dy, d, fill) =>
    rc.circle(cx + dx * s, cy + dy * s, d * s, {fill, fillStyle: 'solid', strokeWidth: 2, seed: 1});

  // primary circles form a triangle
  circle(  0, -82, 80, 'rgba(255,0,0,1)');
  circle( 73,  43, 80, 'rgba(255,255,0,1)');
  circle(-73,  43, 80, 'rgba(0,0,255,1)');

  // secondary circles at the midpoints of the triangle edges, black in the middle
  circle(-37, -20, 40, 'rgba(128,0,128,1)');
  circle( 37, -20, 40, 'rgba(255,165,0,1)');
  circle(  0,  48, 40, 'rgba(0,128,0,1)');
  circle(  0,   0, 40, 'rgba(0,0,0,1)');
}
