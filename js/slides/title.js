import {TextBox} from '../components.js';

export function TitleDesktop(rc, ctx, interval) {
  TextBox({id: 'main-title', text: "<b style='color:blue'>C</b><b style='color:green'>o</b><b style='color:goldenrod'>l</b><b style='color:orange'>o</b><b style='color:red'>r</b> is Made Up", y: 200, size: '75px'})
  TextBox({text: "by Jason", y: 290, size: '24px'})
}

export function TitleMobile(rc, ctx, interval) {
  TextBox({id: 'main-title', text: "<span style='font-size:85px'><b style='color:blue'>C</b><b style='color:green'>o</b><b style='color:goldenrod'>l</b><b style='color:orange'>o</b><b style='color:red'>r</b></span><br>is Made Up", y: 200, size: '65px', lineHeight: '1'})
  TextBox({text: "by Jason", y: 360, size: '22px'})
}
