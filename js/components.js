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

  document.getElementById("sandbox").appendChild(element);
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
