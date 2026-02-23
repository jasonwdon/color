import {TextBox} from '../components.js';

export function TitleDesktop(rc, ctx, interval) {
  TextBox({id: 'main-title', text: "<b style='color:blue'>C</b><b style='color:green'>o</b><b style='color:goldenrod'>l</b><b style='color:orange'>o</b><b style='color:red'>r</b> is Made Up", y: 200, size: '75px'})
}

export function TitleMobile(rc, ctx, interval) {
  TextBox({id: 'main-title', text: "<b style='color:blue'>C</b><b style='color:green'>o</b><b style='color:goldenrod'>l</b><b style='color:orange'>o</b><b style='color:red'>r</b> is Made Up", y: 200, size: '52px'})
}
