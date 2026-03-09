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
### Step 1: Additive vs Subtractive Color ✓
- Refresher of what we learned in elementary school: primary colors (RYB)
- In physics we're taught that color is light reaching our eyes at different wavelengths
- In biology we're taught that we have rods and cones. Short, medium and long wavelength cones give us sensitivity peaks near R, G, B
- But RGB is different from RYB — our first lesson: additive vs subtractive colors
- When mixing pigments, we start with a white background and cover up frequencies. In RGB (screens), we start with the absence of light and add wavelengths
- Both systems activate the same three cone types — the difference is the medium

### Step 2: Getting to HSV and HSL
- Where does pink come from? It's not an actual wavelength but rather the eyes interpreting a mix of cone activations
  - Pink exists because our brain is interpreting the presence of long and short wavelengths simultaneously
  - That explains why color is a "wheel" — it wraps around
- Where is brown? Where is forest green?
- Introduce hue: imagine the RGB cube on its corner, black on the bottom, white pointing up. Looking down, we see a hexagon. Hue is the angle from the center
- Introduce saturation: purity of color. Raising the minimum RGB value desaturates
- Introduce brightness/value: the amplitude — scale all channels proportionally to preserve hue
- HSL and HSV are similar — they just handle brightness differently

### Step 3: Color Theory
- Opponent process: the brain interprets signals into 3 channels — red/green, blue/yellow, dark/white
- We found neurons that fire in response to red vs green, yellow vs blue, dark vs white
- No reddish-green or blueish-yellow exists perceptually

### Step 4: Getting to Hex Colors
- TBD

## Extras
- How different cultures group colors differently
- Quadratic psychological color wheel
- What is neon? (High-saturation, high-brightness; physically: UV absorption + re-emission at visible wavelength)
