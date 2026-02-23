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
The canvas (900×500 desktop, `innerWidth × innerHeight-100` mobile) is centered via flexbox inside `#sandbox` (1000×600 desktop, `100vw × 100svh` mobile). This creates a 50px offset on each side. Canvas coordinate `(x, y)` maps to sandbox DOM position `(x+50, y+50)`. Keep this in mind when aligning absolutely-positioned DOM elements with canvas drawings.

**Adding a new slide:**
1. Create `js/slides/mySlide.js` exporting a function `(rc, ctx, interval) => {}`
2. Export it from `js/slides/AllSlides.js`
3. Add it to the `slides` array in `color.js`

**Component pattern** (`components.js`):
```js
Button({ text: 'Click me', x: 100, y: 50, onClick: () => {} })
Slider({ min: 380, max: 780, value: 580, x: 50, y: 200, onChange: (val) => {} })
TextBox({ text: 'Hello', x: 50, y: 100, w: 400, size: '24px', align: 'left', wordSpacing: '-4px' })
```
All config properties except `text` are optional; components use absolute positioning within `#sandbox`. Omitting `x` on a component lets the flexbox `align-items: center` on `#sandbox` center it horizontally.

**Animation pattern** (used in `electromagnetic.js`):
```js
interval.id = setInterval(drawFrame, 100);
// clearSandbox() in utils.js will call clearInterval(interval.id)
```
