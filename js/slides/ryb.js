import {TextBox} from '../components.js';

export function RYBSlide(rc) {

  let left = 50;
  let width = 480;
  TextBox({text: 
    "In elementary school, we learn that there are 3 primary colors: <b style='color:red'>Red</b>, <b style='color:yellow'>Yellow</b>, <b style='color:blue'>Blue</b>.<br><br>" + 
    "We can mix them in pairs to get our secondary colors, mix all of them to get black/brown, and mix none of them for white.<br><br>"+ 
    "Why Mrs. Johnson?<br><br>" +
    "Oh, it'll make sense when you're older.", x: left, y: 50, w: width, size: '26px', align: 'left'});

  //don't need setinterval because this is static
  let diameter = 100;
  
  rc.circle(700, 93.4, diameter, {fill:'rgba(255,0,0,1)', fillStyle:'solid', strokeWidth: 2, seed:1});
  rc.circle(800, 270, diameter, {fill:'rgba(255,255,0,1)', fillStyle:'solid', strokeWidth: 2, seed:1});
  rc.circle(600, 270, diameter, {fill:'rgba(0,0,255,1)', fillStyle:'solid', strokeWidth: 2, seed:1});

  diameter = 50;
  rc.circle(645, 182, diameter, {fill:'rgba(128,0,128,1)', fillStyle:'solid', strokeWidth: 2, seed:1});
  rc.circle(755, 182, diameter, {fill:'rgba(255,165,0,1)', fillStyle:'solid', strokeWidth: 2, seed:1});
  rc.circle(700, 275, diameter, {fill:'rgba(0,128,0,1)', fillStyle:'solid', strokeWidth: 2, seed:1});
  rc.circle(700, 205, diameter, {fill:'rgba(0,0,0,1)', fillStyle:'solid', strokeWidth: 2, seed:1});


}