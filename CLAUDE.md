# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

Because of CORS, the app must be served over HTTP (not `file://`):

```bash
python3 -m http.server 8080
# Navigate to http://localhost:8080
```

No build step, bundler, or package manager — the project uses ES6 modules loaded directly in the browser.

## Architecture

This is a vanilla JS slide-based interactive about color theory. No frameworks, no transpilation.

**External libraries** (loaded via CDN in `index.html`):
- `rough.js` — hand-drawn/sketchy canvas rendering (imported in `color.js`)
- `wired-elements` — web component UI widgets (buttons, sliders); loaded as module script in `index.html`
- Google Fonts (Gaegu) — handwritten font aesthetic

**Key files:**
- `js/color.js` — global state (`slideIndex`, `slides[]`, `interval`), navigation logic, URL management, slide initialization
- `js/slides/AllSlides.js` — barrel file; export new slides here and register in `color.js`
- `js/components.js` — factory functions for `TextBox`, `Slider`, `Button`, `RadioButton`; all append to `#sandbox`
- `js/utils.js` — `wavelengthToColor(nm)`, `clearSandbox()`, `clearCanvas()`, `removeById()`, `WIDTH`/`HEIGHT` globals
- `css/style.css` — layout (flexbox), `.object` base class, `.delay3` / `.delay4p5` / `.delay6` animation-delay classes, nav button positions

---

## Slide System

**Slide registry** (`color.js`):
Slides are defined as a single array of `{ name, desktop, mobile }` objects:
```js
const slides = [
  { name: 'title',           desktop: TitleDesktop,           mobile: TitleMobile },
  { name: 'ryb',             desktop: RYBDesktop,             mobile: RYBMobile },
  { name: 'electromagnetic', desktop: ElectromagneticDesktop, mobile: ElectromagneticMobile },
  { name: 'cones',           desktop: ConesDesktop,           mobile: ConesMobile },
  { name: 'light-mixing',    desktop: LightMixingDesktop,     mobile: LightMixingMobile },
  { name: 'paint-mixing',    desktop: PaintMixingDesktop,     mobile: PaintMixingMobile },
  { name: 'cone-space',      desktop: ConeSpaceDesktop,       mobile: ConeSpaceMobile },
];
```

**Slide lifecycle** (`showSlide(i)`):
1. Calls `setDimensions(width, height)` to update global `WIDTH`/`HEIGHT`
2. Updates browser history via `history.replaceState` (named hash for non-title slides, clean pathname for slide 0)
3. Calls `clearSandbox(interval)` — cancels any running animation, removes all `#sandbox` children
4. Creates a new `<canvas>`, gets `ctx` and `rough.canvas(canvas)` instance, appends to `#sandbox`
5. Calls `slides[i].desktop` or `slides[i].mobile` depending on viewport
6. Adds navigation buttons (Begin on title; BACK/NEXT on all others)

Each slide function signature: `(rc, ctx, interval)` where `rc` is a rough.js canvas, `ctx` is Canvas 2D context, `interval` is a mutable object `{ id }` for animation loops.

**URL / navigation:**
- Slide 0 uses no hash — URL stays clean (e.g. `http://localhost:8080/`)
- All other slides use a named hash matching `slides[i].name` (e.g. `#ryb`, `#cones`)
- `history.replaceState` is used (not `window.location.hash`) to avoid polluting browser history on resize redraws
- On load, `init()` parses the hash with `findIndex`; unrecognised/missing hash falls back to slide 0

**Adding a new slide:**
1. Create `js/slides/mySlide.js` exporting desktop and mobile functions `(rc, ctx, interval) => {}`
2. Export both from `js/slides/AllSlides.js`
3. Add an entry to the `slides` array in `color.js`:
```js
{ name: 'my-slide', desktop: MySlideDesktop, mobile: MySlideMobile }
```

---

## Layout & Coordinates

**Breakpoint:** `max-width: 480px` (via `window.matchMedia`)

| | Desktop | Mobile |
|---|---|---|
| Canvas | 900 × 500 | `innerWidth × (sandbox height − 100)` |
| Sandbox (`#sandbox`) | 1000 × 600 fixed | `100vw × 100svh` |
| Canvas offset in sandbox | **50px on all sides** | **0px horizontal, 50px vertical** |

**Canvas vs DOM coordinate offset:**
The canvas is centered inside `#sandbox` via flexbox. On desktop this creates a 50px offset on all sides: canvas coord `(x, y)` = sandbox DOM coord `(x+50, y+50)`. On mobile the canvas is full width so the horizontal offset is 0 (only vertical 50px applies). Keep this in mind when aligning absolutely-positioned DOM elements with canvas drawings.

**Dynamic mobile layout:**
When layout values depend on screen size (e.g. centering a graph), compute them in the mobile export function rather than hardcoding in a layout object:
```js
export function MySlideMobile(rc, ctx, interval) {
  const centeredX = Math.round((window.innerWidth - MOBILE_L.itemW) / 2) + 50; // +50 cancels the -50 in draw fn
  setupSlide(rc, ctx, interval, {...MOBILE_L, itemX: centeredX});
}
```

**Never place mobile content at a fixed y below text.** Text wraps differently from phone to phone (and again once the Gaegu font loads), so a chart at a hardcoded y ends up on top of it. Measure instead: `TextBox` and `Slider` return their element, and `onResize([els], fn)` in `utils.js` runs `fn` now and whenever those elements change size. In `fn`, start content at `text.offsetTop + text.offsetHeight + gap`, keep it above `mobileContentBottom()` (the top of the BACK/NEXT buttons), and shrink the text or the content if a short screen can't fit both. The cones, light mixing, paint mixing and RYB slides all do this.

**Cache busting:** module imports carry `?v=N` (and `index.html` loads `js/color.js?v=N` and `css/style.css?v=N`). Bump N everywhere together when you change JS, so phones don't mix cached old modules with new ones.

**Coordinate scaling for pointer events:**
```js
const rect = canvas.getBoundingClientRect();
const scaleX = canvas.width / rect.width;
const scaleY = canvas.height / rect.height;
const cx = (e.clientX - rect.left) * scaleX;
const cy = (e.clientY - rect.top) * scaleY;
```

---

## Component Pattern (`components.js`)

All components create DOM elements with `class="object"` and append them to `#sandbox`. They are absolutely positioned; omitting `x` lets `align-items: center` on `#sandbox` center them horizontally.

```js
TextBox({ text: 'Hello <b>world</b>', x: 50, y: 100, w: 400, size: '24px', align: 'left', lineHeight: '1.2' })
Slider({ id: 'my-slider', min: 380, max: 780, value: 580, x: 50, y: 200, w: 400, onChange: (val) => {} })
Button({ text: 'Click me', x: 100, y: 50, size: '30px', onClick: () => {} })
```

- `TextBox` renders `text` as innerHTML — HTML tags like `<b>`, `<br>`, inline `<span style="">` all work
- `Slider` creates a `<wired-slider>`; read value via `document.getElementById(id).value`
- `Button` creates a `<wired-button>`; nav buttons use CSS classes `back-button` / `next-button`

---

## Animation Pattern

```js
const DELAY = 100; // ms
interval.id = setInterval(drawFrame, DELAY);
// clearSandbox() in utils.js will call clearInterval(interval.id) on navigation

function drawFrame() {
  clearCanvas(ctx);
  // read DOM state (slider values, etc.) and redraw
}
```

Slides that animate register their `setInterval` ID on the shared `interval` object so `clearSandbox()` can cancel it on navigation.

---

## Canvas Interaction Pattern

Use pointer events + `setPointerCapture` so dragging works even when the pointer leaves the element. The canvas is removed from the DOM on navigation so no manual cleanup is needed.

```js
let dragging = false;
ctx.canvas.addEventListener('pointerdown', (e) => {
  const rect = ctx.canvas.getBoundingClientRect();
  const cx = (e.clientX - rect.left) * (ctx.canvas.width / rect.width);
  const cy = (e.clientY - rect.top)  * (ctx.canvas.height / rect.height);
  // check bounds, then:
  dragging = true;
  ctx.canvas.setPointerCapture(e.pointerId);
  e.preventDefault();
});
ctx.canvas.addEventListener('pointermove', (e) => { if (dragging) { /* update */ } });
ctx.canvas.addEventListener('pointerup',     () => { dragging = false; });
ctx.canvas.addEventListener('pointercancel', () => { dragging = false; });
```

---

## Rough.js Conventions

```js
rc.circle(x, y, diameter, {
  fill: 'rgba(255,0,0,0.8)',
  fillStyle: 'solid',   // 'solid' for filled; omit for hatched
  roughness: 2,         // 0 = smooth, 2 = sketchy
  strokeWidth: 2,
  seed: 1               // fixed seed for consistent rendering on resize
});
```

Always set a fixed `seed` on rough.js shapes so they don't redraw differently on every resize.

---

## Spectrum Rendering

All spectrum bars are rendered pixel-by-pixel to avoid gradient artifacts:

```js
for (let px = 0; px <= w; px++) {
  const wl = minWL + (px / w) * (maxWL - minWL);
  ctx.fillStyle = wavelengthToColor(wl);
  ctx.fillRect(x + px, y, 1, barH);
}
```

**`wavelengthToColor(nm)` notes:**
- Converts wavelength (380–780nm) to `"rgba(R%,G%,B%,0.85)"`
- Uses constant alpha (0.85) — no brightness falloff at spectrum edges
- All wavelengths above ~645nm return the same pure red on an sRGB display; spectrum bars cap at 650nm for this reason

---

## Cone Space Slide (`coneSpace.js`)

The last slide: a 3D plot of color with one axis per cone (L right, S up, M in depth), drawn on its own canvas with plain 2D canvas math (no 3D library). It uses real Stockman & Sharpe 2° cone fundamentals at 5nm, each cone scaled to peak 1.

- The solid of real colors is a lit mesh (`SOLID`), drawn on its own layer and laid over the plot see-through: side bands from black out to where each ray meets the walls of the box (closed by the purples), plus a cap on the walls from white out to the edge colors. It's convex, so only quads facing the camera are drawn (no depth buffer needed). Box edges and axes are drawn over it.
- The spectral locus (equal energy of each wavelength) lies on the solid's side, so it's drawn as a dark line with colored dots only where that side faces you.
- A list beside the plot (under it on phones) of common screen standards (`SCREENS`: sRGB, Adobe RGB, Display P3, Rec. 2020), all off at first. Each checked one shows its gamut as a dashed parallelepiped in its own line color and dash, sharing D65 white, as bright as the box allows, so they compare. Each lists what share of the drawn solid it fills by volume (sRGB about 10%, Rec. 2020 about 20%). These match what the plot shows; the usual flat-chart figures (u'v' area, sRGB about 38%) ignore brightness and confused readers.
- Orbit controls: horizontal drag spins around the S axis, vertical drag tilts, clamped short of straight above or below. Wheel or pinch zooms. No auto rotation. The canvas has `touch-action: none` so dragging never scrolls or refreshes the page. `revealAfterFonts(el)` in `utils.js` fades the plot in once Gaegu has loaded.

---

## Color Mixer Brush System (`colorMixer.js`)

`colorMixer.js` holds two slides: light mixing (additive red/green/blue on black) and paint mixing (subtractive cyan/magenta/yellow on white, under a rough.js diagram with arrows from each light primary to the two paint primaries it makes).

**`paintBristleLine(lctx, x1, y1, x2, y2, strokeStyle, bSize)`**

Draws a single brush stroke as 18 individual bristles:
- Bristles are spread perpendicular to the stroke direction across `bSize/4` half-width
- Spread is non-uniform (random 75–125% scale) for texture
- Each bristle is trimmed by 0–6% at each end for jagged tips
- Each bristle is a quadratic Bézier with a random perpendicular wobble at the midpoint (`±35%` of brush size) for organic curvature
- Per-bristle `globalAlpha` (0.07–0.29) and `lineWidth` (0.5–2.5)

**`prefillVennDiagram(layers, canvasW, canvasH, brushSize)`**

Pre-paints three overlapping circles (Venn diagram) on canvas load:
- Circle radius: `min(canvasW, canvasH) * 0.26`
- Center distance: `r * 0.7` (equilateral triangle formation)
- Vertical center of triangle: `canvasH/2 + d/4` (offsets for the asymmetric triangle)
- Strokes sweep at ~135° (top-right → bottom-left) with ±0.15 rad per-stroke angle jitter
- Step between scan lines: `2.5 ± 0.25`

**Compositing:**

Each color paints on its own offscreen layer in its own color. Light layers start black and are combined with `globalCompositeOperation = 'lighter'` (added). Paint layers start white and are combined with `'multiply'`, so cyan over magenta leaves blue and all three make black.

---

## Resize Handling

Resize is debounced at 150ms, and only redraws when the width changes or the phone breakpoint flips. Phones fire height-only resizes as the browser bars slide in and out, and redrawing on those made the slide flash.

On phones there's nothing to scroll: the sandbox is exactly `100svh` with `overflow: clip`, so the browser bars stay put. The page itself isn't locked, so pulling down still refreshes. Canvases and sliders have `touch-action: pan-y` (side to side drags go to the slide, up and down to the browser), and the mixers' drawing canvases use `touch-action: none`. Every mobile slide has to fit in the screen, since nothing below it can be scrolled to.

`showSlide` fully rebuilds the slide (clears sandbox, recreates canvas, re-runs the slide function). Each slide function reads fresh layout values so it adapts automatically.
