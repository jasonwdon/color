import {TextBox} from '../components.js';

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

export function RYBMobile(rc) {
  TextBox({text:
    "In elementary school, we learn that there are 3 primary colors: <b style='color:red'>Red</b>, <b style='color:yellow'>Yellow</b>, <b style='color:blue'>Blue</b>.<br><br>" +
    "We can mix them to get our secondary colors, mix all of them to get <b>black</b>/<b style='color:saddlebrown'>brown</b>, and the paper was <b style='color:white; background-color:black; padding: 0 4px; border-radius: 3px;'>white</b> to begin with.<br><br>" +
    "It was good enough for second grade.", x: 15, y: 30, w: 360, size: '24px', align: 'left'});

  // primary circles — triangle in bottom half of canvas
  let diameter = 80;
  rc.circle(195, 360, diameter, {fill: 'rgba(255,0,0,1)',   fillStyle: 'solid', strokeWidth: 2, seed: 1});
  rc.circle(268, 485, diameter, {fill: 'rgba(255,255,0,1)', fillStyle: 'solid', strokeWidth: 2, seed: 1});
  rc.circle(122, 485, diameter, {fill: 'rgba(0,0,255,1)',   fillStyle: 'solid', strokeWidth: 2, seed: 1});

  // secondary circles — midpoints of the triangle edges
  diameter = 40;
  rc.circle(158, 422, diameter, {fill: 'rgba(128,0,128,1)', fillStyle: 'solid', strokeWidth: 2, seed: 1}); // purple
  rc.circle(232, 422, diameter, {fill: 'rgba(255,165,0,1)', fillStyle: 'solid', strokeWidth: 2, seed: 1}); // orange
  rc.circle(195, 490, diameter, {fill: 'rgba(0,128,0,1)',   fillStyle: 'solid', strokeWidth: 2, seed: 1}); // green
  rc.circle(195, 442, diameter, {fill: 'rgba(0,0,0,1)',     fillStyle: 'solid', strokeWidth: 2, seed: 1}); // black (center)
}
