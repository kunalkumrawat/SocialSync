# SocialSync Color Palette

## STAGE OTT Primary Colors

### Brand Colors
```
Maroon (Primary)
HEX: #7a0600
RGB: 122, 6, 0
CMYK: 0, 95, 100, 52
Pantone: 1815 C (closest match)
Usage: Primary brand color, gradients, accents
```

```
Milano Red (Secondary)
HEX: #c60c0c
RGB: 198, 12, 12
CMYK: 0, 94, 94, 22
Pantone: 485 C (closest match)
Usage: Buttons, active states, emphasis
```

```
Red Ribbon (Accent)
HEX: #e10d37
RGB: 225, 13, 55
CMYK: 0, 94, 76, 12
Pantone: 192 C (closest match)
Usage: Icons, highlights, call-to-action
```

```
STAGE Black
HEX: #191919
RGB: 25, 25, 25
CMYK: 0, 0, 0, 90
Usage: Backgrounds, text
```

### Gray Scale

```
Gray 900 (Darkest)
HEX: #0a0a0a
RGB: 10, 10, 10
Usage: Deep backgrounds
```

```
Gray 800
HEX: #191919
RGB: 25, 25, 25
Usage: Primary backgrounds
```

```
Gray 700
HEX: #2a2a2a
RGB: 42, 42, 42
Usage: Card backgrounds
```

```
Gray 600
HEX: #3a3a3a
RGB: 58, 58, 58
Usage: Secondary cards, hover states
```

```
Gray 500
HEX: #4a4a4a
RGB: 74, 74, 74
Usage: Disabled states, borders
```

---

## Semantic Color Tokens

### Success (Green)

```
Success 500 (Primary)
HEX: #22c55e
RGB: 34, 197, 94
Usage: Success messages, posted status, checkmarks
```

```
Success 600 (Dark)
HEX: #16a34a
RGB: 22, 163, 74
Usage: Success hover states, darker contexts
```

### Error (Red)

```
Error 500 (Primary)
HEX: #ef4444
RGB: 239, 68, 68
Usage: Error messages, failed status, destructive actions
```

```
Error 600 (Dark)
HEX: #dc2626
RGB: 220, 38, 38
Usage: Error hover states, critical alerts
```

### Warning (Yellow)

```
Warning 500 (Primary)
HEX: #eab308
RGB: 234, 179, 8
Usage: Warning messages, pending status, caution
```

```
Warning 600 (Dark)
HEX: #ca8a04
RGB: 202, 138, 4
Usage: Warning hover states, attention needed
```

### Info (Blue)

```
Info 500 (Primary)
HEX: #3b82f6
RGB: 59, 130, 246
Usage: Informational messages, processing status
```

```
Info 600 (Dark)
HEX: #2563eb
RGB: 37, 99, 235
Usage: Info hover states, links
```

---

## Platform Brand Colors

### Instagram

```
Instagram Pink
HEX: #E4405F
RGB: 228, 64, 95
Pantone: 205 C (closest match)
Usage: Instagram icons, indicators, accents
Notes: Official Instagram brand color
```

### YouTube

```
YouTube Red
HEX: #FF0000
RGB: 255, 0, 0
Pantone: Red 032 C
Usage: YouTube icons, indicators, accents
Notes: Official YouTube brand color
```

### Google

```
Google Blue
HEX: #4285F4
RGB: 66, 133, 244
Pantone: 2727 C (closest match)
Usage: Google Drive icons, indicators, accents
Notes: Official Google brand color
```

---

## Gradient Combinations

### Primary Button Gradient
```
From: #7a0600 (Maroon)
To: #c60c0c (Milano Red)
Angle: 90deg (left to right)
Usage: Primary action buttons
```

### Background Gradient
```
From: #0a0a0a (Gray 900)
Via: #141414 (Netflix Black)
To: #0a0a0a (Gray 900)
Angle: 135deg (diagonal)
Usage: Main app background
```

### Card Gradient
```
From: #2a2a2a (Gray 700)
To: #191919 (Gray 800)
Angle: 135deg (diagonal)
Usage: Card backgrounds
```

### Hover Glow
```
From: #e10d37 (Red Ribbon) at 5% opacity
To: transparent
Angle: 135deg
Usage: Card hover effects
```

---

## Accessibility Considerations

### Text Contrast Ratios (WCAG AA)

**Light text on dark backgrounds:**
- White (#FFFFFF) on Gray 800 (#191919): 14.3:1 ✅ AAA
- White (#FFFFFF) on Gray 700 (#2a2a2a): 12.6:1 ✅ AAA
- White (#FFFFFF) on Maroon (#7a0600): 5.2:1 ✅ AA

**Semantic colors on dark backgrounds:**
- Success (#22c55e) on Gray 800 (#191919): 4.8:1 ✅ AA
- Error (#ef4444) on Gray 800 (#191919): 4.2:1 ✅ AA
- Warning (#eab308) on Gray 800 (#191919): 7.1:1 ✅ AAA
- Info (#3b82f6) on Gray 800 (#191919): 4.5:1 ✅ AA

**Minimum contrast requirements:**
- Normal text (16px+): 4.5:1
- Large text (18px+ or 14px+ bold): 3:1
- UI components: 3:1

---

## Color Usage Guidelines

### Do's ✓
- Use STAGE colors (maroon, red, ribbon) as primary brand colors
- Use semantic colors for UI states (success, error, warning, info)
- Use platform colors for brand recognition (Instagram, YouTube, Google)
- Maintain high contrast for accessibility
- Use gradients for depth and visual interest

### Don'ts ✗
- Don't use low-contrast color combinations
- Don't mix too many colors in one component
- Don't override semantic color meanings
- Don't use platform colors outside their context
- Don't create new brand colors without approval

---

## Figma Color Variables

### How to Set Up in Figma

1. **Create Color Styles:**
   - Go to "Styles" panel
   - Click "+" to create new color style
   - Name using convention: `Brand/Maroon` or `Semantic/Success/500`

2. **Organize by Category:**
   ```
   Brand/
     - Maroon
     - Red
     - Ribbon
     - Black

   Semantic/
     Success/
       - 500
       - 600
     Error/
       - 500
       - 600
     Warning/
       - 500
       - 600
     Info/
       - 500
       - 600

   Platform/
     - Instagram
     - YouTube
     - Google

   Gray/
     - 900
     - 800
     - 700
     - 600
     - 500
   ```

3. **Apply to Elements:**
   - Select element
   - Click color swatch
   - Choose from color styles
   - This ensures consistency across document

---

## Export Swatches

For print designers or external use:

**Adobe Swatch Exchange (.ase)**
- Export from Figma using plugins
- Use "Color Styleguide" plugin

**CSS Variables**
```css
:root {
  --stage-maroon: #7a0600;
  --stage-red: #c60c0c;
  --stage-ribbon: #e10d37;
  --stage-black: #191919;

  --semantic-success: #22c55e;
  --semantic-error: #ef4444;
  --semantic-warning: #eab308;
  --semantic-info: #3b82f6;

  --platform-instagram: #E4405F;
  --platform-youtube: #FF0000;
  --platform-google: #4285F4;
}
```

---

**Last Updated:** February 8, 2026
**Version:** 1.0
