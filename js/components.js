import rough from 'https://unpkg.com/roughjs?module';

export function TextBox(config) {
  let element = document.createElement("div");
  element.className = "object";
  element.classList.add("textbox");

  //required
  element.innerHTML = config.text;

  //optional
  if (config.id !== undefined) element.id = config.id;
  if (config.class !== undefined) element.classList.add(config.class);
  if (config.x !== undefined) element.style.left = config.x + "px";
  if (config.y !== undefined) element.style.top = config.y + "px";
  if (config.w !== undefined) element.style.width = config.w + "px";
  if (config.h !== undefined) element.style.height = config.h + "px";
  if (config.rotation !== undefined) element.style.transform = "rotate(" + config.rotation + "deg)";
  if (config.align !== undefined) element.style.textAlign = config.align;
  if (config.color !== undefined) element.style.color = config.color;
  if (config.size !== undefined) element.style.fontSize = config.size;
  if (config.wordSpacing !== undefined) element.style.wordSpacing = config.wordSpacing;
  if (config.lineHeight !== undefined) element.style.lineHeight = config.lineHeight;

  document.getElementById("sandbox").appendChild(element);
  return element;
}

export function Slider(config) {
  let element = document.createElement('wired-slider');
  element.className = "object";

  //required
  element.value = config.value;
  element.min = config.min;
  element.max = config.max;
  element.addEventListener('change', config.onChange);

  //optional
  if (config.id !== undefined) element.id = config.id;
  if (config.x !== undefined) element.style.left = config.x + "px";
  if (config.y !== undefined) element.style.top = config.y + "px";
  if (config.w !== undefined) element.style.width = config.w + "px";
  if (config.h !== undefined) element.style.height = config.h + "px";

  document.getElementById("sandbox").appendChild(element);
  return element;
}

export function Button(config) {
  let element = document.createElement('wired-button');
  element.className = "object";
  element.classList.add("textbox");

  //required
  element.addEventListener('click', config.onClick);
  element.innerHTML = config.text;

  //optional
  if (config.class !== undefined) element.classList.add(config.class);
  if (config.id !== undefined) element.id = config.id;
  if (config.x !== undefined) element.style.left = config.x + "px";
  if (config.y !== undefined) element.style.top = config.y + "px";
  if (config.w !== undefined) element.style.width = config.w + "px";
  if (config.h !== undefined) element.style.height = config.h + "px";
  if (config.size !== undefined) element.style.fontSize = config.size;

  document.getElementById("sandbox").appendChild(element);
}

export function RadioButton(config) {
  let element = document.createElement('wired-radio');
  element.className = "object";

  //required
  element.addEventListener('change', config.onClick);

  //optional
  if (config.class !== undefined) element.classList.add(config.class);
  if (config.id !== undefined) element.id = config.id;
  if (config.x !== undefined) element.style.left = config.x + "px";
  if (config.y !== undefined) element.style.top = config.y + "px";
  if (config.w !== undefined) element.style.width = config.w + "px";
  if (config.h !== undefined) element.style.height = config.h + "px";

  if (config.parent === 'body') document.body.appendChild(element);
  else document.getElementById("sandbox").appendChild(element);
}

// The row of numbered circles between BACK and NEXT, one per section of the
// deck, joined by a sketchy line. The current section's circle is filled in.
// Picking one goes to its first slide. A section with no slides yet is
// greyed out and can't be picked. On desktop
// each circle has its section's name under it; on phones there's only room
// for the current section's name, under the row.
//   sections: [{name, enabled}], current: index, onPick(index), phone: bool
export function SectionNav(config) {
  const {sections, current, onPick, phone} = config;
  const itemW = phone ? 44 : 130, dot = phone ? 26 : 28;
  const nav = document.createElement('nav');
  nav.className = 'object section-nav' + (phone ? ' phone' : '');
  nav.setAttribute('aria-label', 'Sections');

  const svgNS = 'http://www.w3.org/2000/svg';
  const track = document.createElementNS(svgNS, 'svg');
  track.classList.add('section-track');
  const trackW = itemW * (sections.length - 1);
  track.setAttribute('width', trackW);
  track.setAttribute('height', 8);
  track.style.left = itemW / 2 + 'px';
  track.style.top = dot / 2 - 4 + 'px';
  track.appendChild(rough.svg(track).line(0, 4, trackW, 4,
    {stroke: '#999', strokeWidth: 1.5, roughness: 1, bowing: 1.5, seed: 7}));
  nav.appendChild(track);

  sections.forEach((sec, i) => {
    const item = document.createElement('button');
    item.className = 'section-item' + (i === current ? ' current' : '');
    item.style.width = itemW + 'px';
    item.disabled = !sec.enabled;
    item.title = sec.enabled ? sec.name : sec.name + ' (coming soon)';
    item.setAttribute('aria-label', item.title);
    if (i === current) item.setAttribute('aria-current', 'true');

    const circle = document.createElementNS(svgNS, 'svg');
    circle.setAttribute('width', dot);
    circle.setAttribute('height', dot);
    circle.classList.add('section-dot');
    const ink = !sec.enabled ? '#bbb' : '#222';
    circle.appendChild(rough.svg(circle).circle(dot / 2, dot / 2, dot - 4, {
      stroke: ink, strokeWidth: 1.5, roughness: 1.2, seed: i + 1,
      fill: i === current ? '#222' : '#fff', fillStyle: 'solid'}));
    const num = document.createElement('span');
    num.className = 'section-num';
    num.textContent = i + 1;
    const mark = document.createElement('span');
    mark.className = 'section-mark';
    mark.style.width = mark.style.height = dot + 'px';
    mark.append(circle, num);
    item.appendChild(mark);

    if (!phone) {
      const name = document.createElement('span');
      name.className = 'section-name';
      name.textContent = sec.name;
      item.appendChild(name);
    }
    // the current one goes back to the start of its section
    if (sec.enabled) item.addEventListener('click', () => onPick(i));
    nav.appendChild(item);
  });

  if (phone && sections[current]) {
    const name = document.createElement('div');
    name.className = 'section-name current-name';
    name.textContent = sections[current].name;
    nav.appendChild(name);
  }

  document.getElementById('sandbox').appendChild(nav);
  return nav;
}
