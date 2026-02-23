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
- `rough.js` — hand-drawn/sketchy canvas rendering
- `wired-elements` — web component UI widgets (buttons, sliders, radio buttons)
- Google Fonts (Gaegu) — handwritten font aesthetic

**Slide lifecycle** (orchestrated in `color.js`):
1. `showSlide(i)` clears the sandbox, creates a `<canvas>`, calls the slide function, then adds nav buttons
2. Each slide is a function with signature `(rc, ctx, interval)` where `rc` is a rough.js canvas instance, `ctx` is the Canvas 2D context, and `interval` is a mutable object `{ id }` for animation loops
3. Slides register their `setInterval` ID on the shared `interval` object so `clearSandbox()` can cancel it on navigation

**Key files:**
- `js/color.js` — global state (`slideIndex`, `slides[]`, `interval`), navigation logic, slide initialization
- `js/slides/AllSlides.js` — barrel file; add new slides here and to the `slides` array in `color.js`
- `js/components.js` — factory functions for `TextBox`, `Slider`, `Button`, `RadioButton`; all append to `#sandbox`
- `js/utils.js` — `wavelengthToColor(nm)` (380–780nm → RGBA), `clearSandbox()`, `clearCanvas()`, `removeById()`
- `css/style.css` — layout (flexbox), `.delay3` / `.delay4p5` / `.delay6` animation-delay classes, absolute positioning within `#sandbox`

**Canvas vs DOM coordinate offset:**
The canvas (900×500 desktop, `innerWidth × innerHeight-100` mobile) is centered via flexbox inside `#sandbox` (1000×600 desktop, `100vw × 100svh` mobile). On desktop this creates a **50px offset on all sides**: canvas coord `(x, y)` = sandbox DOM coord `(x+50, y+50)`. On mobile the canvas is full width so the **horizontal offset is 0** (only the vertical 50px offset applies). Keep this in mind when aligning absolutely-positioned DOM elements with canvas drawings.

**Dynamic mobile layout:**
When layout values need to depend on screen size (e.g. centering a graph), compute them in the mobile export function rather than hardcoding in the layout object:
```js
export function MySlideMobile(rc, ctx, interval) {
  const centeredX = Math.round((window.innerWidth - MOBILE_L.itemW) / 2) + 50; // +50 cancels the -50 in draw fn
  setupSlide(rc, ctx, interval, {...MOBILE_L, itemX: centeredX});
}
```

**Adding a new slide:**
1. Create `js/slides/mySlide.js` exporting a function `(rc, ctx, interval) => {}`
2. Export it from `js/slides/AllSlides.js`
3. Add it to the `slides` array in `color.js`

**Component pattern** (`components.js`):
```js
Button({ text: 'Click me', x: 100, y: 50, onClick: () => {} })
Slider({ min: 380, max: 780, value: 580, x: 50, y: 200, onChange: (val) => {} })
TextBox({ text: 'Hello', x: 50, y: 100, w: 400, size: '24px', align: 'left', wordSpacing: '-4px', lineHeight: '1.2' })
```
All config properties except `text` are optional; components use absolute positioning within `#sandbox`. Omitting `x` on a component lets the flexbox `align-items: center` on `#sandbox` center it horizontally.

**Animation pattern** (used in `electromagnetic.js`):
```js
interval.id = setInterval(drawFrame, 100);
// clearSandbox() in utils.js will call clearInterval(interval.id)
```

**Canvas interaction pattern** (click/drag on canvas regions):
Use pointer events + `setPointerCapture` so dragging works even when the pointer leaves the element. The canvas is removed from the DOM on navigation, so no manual cleanup is needed.
```js
let dragging = false;
ctx.canvas.addEventListener('pointerdown', (e) => {
  const rect = ctx.canvas.getBoundingClientRect();
  const scaleX = ctx.canvas.width / rect.width;
  const cx = (e.clientX - rect.left) * scaleX;
  // check bounds, then:
  dragging = true;
  ctx.canvas.setPointerCapture(e.pointerId);
});
ctx.canvas.addEventListener('pointermove', (e) => { if (dragging) { /* update */ } });
ctx.canvas.addEventListener('pointerup',     () => { dragging = false; });
ctx.canvas.addEventListener('pointercancel', () => { dragging = false; });
```

**`wavelengthToColor` notes:**
- Uses constant alpha (0.85) — no brightness falloff at spectrum edges
- All wavelengths above ~645nm return the same pure red on an sRGB display; the gradient bar caps at 650nm for this reason
