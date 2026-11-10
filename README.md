# Color
An interactive about colors. https://jasonwdon.github.io/color

## Run it Locally

ES modules require an HTTP server (not `file://`):
```
python3 -m http.server 8080
```
Then open http://localhost:8080

## Stack
- [rough.js](https://roughjs.com/) — hand-drawn style canvas rendering
- [wired-elements](https://wiredjs.com/) — sketchy UI components
- Plain HTML/JS — no build step

## Notes
- For mobile, we can assume a viewport of 390×710
- Slides are addressable by name in the URL hash (e.g. `#ryb`, `#electromagnetic`). The title slide has no hash.

## Plan
The deck runs in four sections. Each section opens with its own title slide in its own color, and a small progress marker shows where you are. A closing slide ties back to the title.

### 1. Physics and Biology
- Refresher from elementary school: the primary colors red, yellow, blue (RYB) ✓
- Physics: color is light reaching our eyes at different wavelengths ✓
- Biology: rods and cones; short, medium and long wavelength cones peak near blue, green and red ✓
- RGB vs RYB: additive vs subtractive color ✓
  - Paint starts from a white page and covers up wavelengths; screens start from black and add light
  - Both activate the same three cone types; only the medium differs

### 2. Perception
- Pink isn't a wavelength: it's the brain reading long and short wavelengths at once
- That's why color wraps around into a wheel
- Where are brown and forest green? Same hue as orange and green, just darker in context
- Opponent process: the brain sorts signals into red vs green, blue vs yellow, dark vs light
  - Neurons that fire for one side and against the other
  - No reddish green or bluish yellow exists perceptually
- Context changes color: illusions like the dress and same-color squares in shadow

### 3. Color for Computers
- Screens mix red, green and blue light (the color mixer slide) ✓
- The RGB cube: stand it on its black corner with white pointing up; looking down you see a hexagon
- Hue: the angle around that hexagon
- Saturation: purity; raising the lowest channel washes the color out
- Brightness/value: scaling all channels together keeps the hue
- HSV vs HSL: the same idea, handling brightness differently
- Hex colors: the same RGB numbers written in base 16

### 4. Color Psychology
- Languages and cultures split the spectrum differently (how many color words, where blue and green divide)
- What colors mean and how they make us feel, and how much of that is learned
- The perceptual color wheel vs the physics one
- What makes neon look neon: very saturated and bright, physically UV absorbed and re-emitted as visible light

### Closing
- Color is made up: the light is real, the colors are what our eyes and brain make of it
