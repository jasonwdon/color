import {TextBox} from '../components.js';


export function IntroSlide() {
  let left = 125;
  TextBox({text: "In 2020, I tried to pick a color palette for a startup concept", x: left, y: 120, size: '30px', align: 'left'});
  TextBox({text: "I got distracted and the startup fell apart", x: left, y: 220, size:'30px', align: 'left'});
  TextBox({text: "Here's what I learned about <b style='color:blue'>c</b><b style='color:green'>o</b><b style='color:yellow'>l</b><b style='color:orange'>o</b><b style='color:red'>r</b>", x: left, y:320, size:'30px', align: 'left'});
}