# Color
An interactive about colors. https://jasonwdon.github.io/color

## Run it

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
- For mobile, we can assume a viewport of 390x710

## Narrative

What you know about colors was a simplification made for the kindergarten mind to handle. As I started getting into photography and web design, the stuff to learn was increasingly overwhelming. Color theory is incredibly complex and can take years to master. This interactive wants to fill in the blanks from the ground up and serve as a foundation for all things color in day to day life. We won't be doing PhD level stuff, but we want to fill in the gaps between elementary school color mixing, high school electromagnetics, and actual practical usage of color.

### Step 1: Additive vs Subtractive Color
- Refresher of what we learned in elementary school: primary colors
- In physics we're taught that color is light reaching our eyes at different intensities
- In biology we're taught that we have rods and cones. Rods are sensitive to light vs dark, while cones are sensitive to specific colors. Short, medium and long wavelength cones gives us RGB
- But RGB is different from RYB — our first lesson: additive vs subtractive colors
- The principles are the same, light frequencies activating our cones to a different degree. But when we're mixing pigments, we start with a white background and cover up frequencies to arrive at the final color. In RGB, we start with the absence of light and add wavelengths until we see the color we're expecting
- Where is white and black on the color spectrum? White is all frequencies getting stimulated equally. When there's a little more yellow, it looks like off-white/cream

Interactables:
- Slider to show how wavelength determines color
- Slider to show how wavelength affects the three cones
- RGB mixing to create colors
- RYB / CMY — cyan, yellow, magenta
- Show how white is created, create off-white

### Step 2: Getting to HSV and HSL
- Where does pink come from? It's not an actual wavelength but rather the eyes interpreting an average from a bunch of different activated cones
  - The color pink exists but the wavelength does not
  - Pink exists because our brain is interpreting the presence of long and short wavelengths at the same time
  - That explains why color is a "wheel" — it's actually a 3D cube
- Where is brown? Where is forest green?
- Let's talk about how the brain interprets density of excitation
- Introduce hue: from the RGB perspective, we imagine putting the cube on its corner, black on the bottom, white pointing up. Then looking down at the cube from above, we see a hexagon. Hue is the angle coming out from the center of that cube
  - Mathematically, the max RGB value sets the sector, then the two smaller values set the exact angle in that sector
  - There are formulas for this, but it ends up mapping RGB to a full 360-degree spectrum — that is our hue value
- Introduce saturation: the purity of the color. Low saturation means we are adding in the other colors. For a given hue, raising the minimum RGB value desaturates it. The middle value is usually proportionally shifted as well
- Introduce brightness/value: the amplitude of the light wave. In math/computers we use the max value of the RGB, then scale all channels up or down proportionally to preserve the hue
- HSL and HSV are similar — they just handle brightness differently
- No reddish-green or blueish-yellow: blue is blue cones firing, but red and green are not

What is neon?
- The glow effect happens when a material absorbs ultraviolet light and re-emits it at a visible wavelength
- On screen, it's just a high-saturation, high-brightness color

### Step 3: Color Theory
- Opponent process: the theory that the brain interprets signals into 3 channels — red/green, blue/yellow, dark/white
  - Refined into dual process theory
- We found neurons that fire in response to red vs green, yellow vs blue, dark vs white
- Physics dictates that we cannot create something that ranges from red to green, so we still use RGB — but the brain is weird

### Step 4: Getting to Hex Colors
- TBD

## Extras
- How different cultures group colors differently
- Quadratic psychological color wheel
