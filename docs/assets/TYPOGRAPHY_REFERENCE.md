# SocialSync Typography Reference

## Font Families

### Primary: Noto Sans

**Usage:** Body text, UI elements, general content
**Weights Available:** 400 (Regular), 500 (Medium), 700 (Bold), 900 (Black)
**Fallback Stack:** `'Noto Sans', system-ui, sans-serif`
**License:** Open Font License (free, commercial use allowed)
**Download:** https://fonts.google.com/specimen/Noto+Sans

**Character Set:** Latin, Latin Extended, Cyrillic, Greek
**Features:** Humanist sans-serif, excellent readability, broad language support

### Secondary: Poppins

**Usage:** Headings, titles, emphasis
**Weights Available:** 600 (Semibold), 700 (Bold), 900 (Black)
**Fallback Stack:** `'Poppins', system-ui, sans-serif`
**License:** Open Font License (free, commercial use allowed)
**Download:** https://fonts.google.com/specimen/Poppins

**Character Set:** Latin, Latin Extended, Devanagari
**Features:** Geometric sans-serif, modern, strong presence

---

## Type Scale

### Desktop Application Scale

```
Hero / Display
Size: 48px / 3rem
Line Height: 1.1 (52.8px)
Font: Poppins Black (900)
Usage: Empty states, major sections
Example: Dashboard section titles

Heading 1 (H1)
Size: 36px / 2.25rem
Line Height: 1.2 (43.2px)
Font: Poppins Bold (700)
Usage: Page titles, major headings
Example: "Content Library"

Heading 2 (H2)
Size: 30px / 1.875rem
Line Height: 1.25 (37.5px)
Font: Poppins Bold (700)
Usage: Section headings, card titles
Example: "Recent Activity"

Heading 3 (H3)
Size: 24px / 1.5rem
Line Height: 1.3 (31.2px)
Font: Poppins Semibold (600)
Usage: Subsection headings, prominent labels
Example: "Instagram Queue"

Heading 4 (H4)
Size: 20px / 1.25rem
Line Height: 1.4 (28px)
Font: Noto Sans Bold (700)
Usage: Component headings, form labels
Example: "Connected Accounts"

Body Large
Size: 18px / 1.125rem
Line Height: 1.6 (28.8px)
Font: Noto Sans Regular (400)
Usage: Introduction text, important body content
Example: Settings descriptions

Body Regular (Default)
Size: 16px / 1rem
Line Height: 1.5 (24px)
Font: Noto Sans Regular (400)
Usage: Default body text, content
Example: Activity messages

Body Medium
Size: 16px / 1rem
Line Height: 1.5 (24px)
Font: Noto Sans Medium (500)
Usage: Emphasized body text, labels
Example: File names, account names

Small
Size: 14px / 0.875rem
Line Height: 1.5 (21px)
Font: Noto Sans Regular (400)
Usage: Secondary information, captions
Example: Timestamps, helper text

Tiny
Size: 12px / 0.75rem
Line Height: 1.4 (16.8px)
Font: Noto Sans Regular (400)
Usage: Minimal information, badges
Example: Status badges, tags

Button Text
Size: 16px / 1rem (primary), 14px / 0.875rem (secondary)
Line Height: 1 (16px/14px)
Font: Noto Sans Bold (700) or Semibold (600)
Usage: All button labels
Example: "Connect Account", "Save"
```

---

## Font Weight Guidelines

### Noto Sans Weights

**Regular (400):**
- Body text
- Descriptions
- General content
- Default UI text

**Medium (500):**
- Emphasized text
- File/folder names
- Important labels
- Tab labels

**Bold (700):**
- Component headings (H4)
- Button text
- Navigation labels
- Table headers
- Form labels

**Black (900):**
- Stats numbers
- Emphasized numbers
- Critical information
- (Use sparingly)

### Poppins Weights

**Semibold (600):**
- H3 headings
- Section subheadings
- Card titles

**Bold (700):**
- H1 headings
- H2 headings
- Major section titles
- Page titles

**Black (900):**
- Hero text
- Display text
- Large numerical displays
- Brand statements

---

## Letter Spacing (Tracking)

```
Headings (Poppins):
Hero (48px): -0.02em (-0.96px) - Tighter for large text
H1 (36px): -0.01em (-0.36px) - Slightly tighter
H2 (30px): -0.01em (-0.30px) - Slightly tighter
H3 (24px): 0 - Normal

Body Text (Noto Sans):
All sizes: 0 - Normal tracking

UI Elements:
Buttons: 0.01em (0.16px) - Slightly wider
Labels (uppercase): 0.05em (0.8px) - Wide tracking
Badges: 0.02em (0.24px) - Slightly wider

Stats/Numbers:
Large numbers: -0.02em - Tighter for cohesion
```

---

## Text Colors

### Primary Text Colors

**White (#FFFFFF):**
- Primary text color
- Headings on dark backgrounds
- Navigation labels
- Main content

**Gray 100 (#f5f5f5):**
- Slightly dimmed white
- Body text for softer look
- (Use sparingly)

**Gray 300 (#d1d5db):**
- Secondary text
- Less important information
- Stat card labels

**Gray 400 (#9ca3af):**
- Tertiary text
- Timestamps
- Helper text
- Placeholder text

### Semantic Text Colors

**Success Green (#22c55e):**
- Success messages
- Positive status
- Completed indicators

**Error Red (#ef4444):**
- Error messages
- Validation errors
- Failed status

**Warning Yellow (#eab308):**
- Warning messages
- Pending status
- Attention needed

**Info Blue (#3b82f6):**
- Informational text
- Links
- Processing status

---

## Typography Hierarchy Examples

### Navigation Item
```
Font: Noto Sans Semibold (600)
Size: 16px
Line Height: 1.5
Color: Gray 300 (inactive), White (active)
Letter Spacing: 0
```

### Dashboard Stat Card
```
Label:
  Font: Noto Sans Bold (700)
  Size: 14px (0.875rem)
  Color: Gray 300
  Transform: Uppercase
  Letter Spacing: 0.05em

Value:
  Font: Noto Sans Black (900)
  Size: 36px (2.25rem)
  Color: White or Semantic Color
  Line Height: 1.1
```

### Section Header
```
Font: Poppins Bold (700)
Size: 24px
Line Height: 1.3
Color: White or Gradient
Background: Gradient text (red to white)
Text Shadow: 0 2px 4px rgba(0,0,0,0.3)
```

### Button Text
```
Primary:
  Font: Noto Sans Bold (700)
  Size: 16px
  Color: White
  Letter Spacing: 0.01em

Secondary:
  Font: Noto Sans Semibold (600)
  Size: 14px
  Color: White
  Letter Spacing: 0.01em
```

### Activity Feed Item
```
Message:
  Font: Noto Sans Regular (400)
  Size: 14px
  Color: White
  Line Height: 1.5

Timestamp:
  Font: Noto Sans Regular (400)
  Size: 12px
  Color: Gray 400
  Line Height: 1.4
```

### Form Label
```
Font: Noto Sans Bold (700)
Size: 14px
Color: Gray 300
Transform: None
Letter Spacing: 0
```

### Toast Notification
```
Font: Noto Sans Regular (400)
Size: 14px
Color: White
Line Height: 1.5
```

---

## Responsive Typography

### Breakpoint Adjustments

**Desktop (1024px+):** Use full scale as defined above

**Tablet (768px - 1023px):**
```
Hero: 40px (↓ from 48px)
H1: 32px (↓ from 36px)
H2: 26px (↓ from 30px)
H3: 22px (↓ from 24px)
Body: 16px (same)
Small: 14px (same)
```

**Mobile (< 768px):**
```
Hero: 32px (↓ from 48px)
H1: 28px (↓ from 36px)
H2: 24px (↓ from 30px)
H3: 20px (↓ from 24px)
Body: 16px (same)
Small: 14px (same)
```

**Note:** SocialSync is currently desktop-only. Include responsive specs for future mobile app planning.

---

## Special Typography Treatments

### Gradient Text (Header Titles)
```css
color: transparent;
background: linear-gradient(90deg, #c60c0c 0%, #ffffff 100%);
-webkit-background-clip: text;
background-clip: text;
```

### Text Shadow (Headings)
```css
text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
```

### Drop Shadow (Large Text)
```css
filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
```

---

## Typography in Figma

### Setting Up Text Styles

1. **Create Text Styles:**
   - Go to "Text" panel
   - Click "+" to create new style
   - Configure font, size, line height
   - Name using convention: `Heading/H1` or `Body/Regular`

2. **Style Naming Convention:**
   ```
   Heading/
     - Hero
     - H1
     - H2
     - H3
     - H4

   Body/
     - Large
     - Regular
     - Medium
     - Small
     - Tiny

   UI/
     - Button Primary
     - Button Secondary
     - Label
     - Badge
     - Navigation

   Stats/
     - Large Number
     - Small Number
   ```

3. **Install Fonts in Figma:**
   - Download Noto Sans from Google Fonts
   - Download Poppins from Google Fonts
   - Install on your system (double-click .ttf files)
   - Restart Figma to load fonts

4. **Apply Text Styles:**
   - Select text layer
   - Click text style dropdown
   - Choose appropriate style
   - Customize color separately

---

## Accessibility Guidelines

### Readability

**Minimum Sizes:**
- Body text: 16px minimum
- Secondary text: 14px minimum
- Tertiary text: 12px minimum (use sparingly)

**Line Height:**
- Body text: 1.5 minimum (150%)
- Headings: 1.2-1.3 (120-130%)
- UI elements: 1.0-1.4 depending on context

**Line Length:**
- Optimal: 50-75 characters per line
- Maximum: 90 characters per line
- Use padding/margins to control width

**Contrast:**
- White on Gray 800 (#191919): 14.3:1 ✅ AAA
- Gray 300 on Gray 800: 7.1:1 ✅ AAA
- Gray 400 on Gray 800: 4.8:1 ✅ AA

### Best Practices

**Do:**
- Use adequate line height (1.5 for body)
- Maintain high contrast ratios
- Use appropriate font sizes
- Left-align body text
- Use medium/bold for emphasis
- Provide visual hierarchy

**Don't:**
- Use font sizes below 12px
- Use low-contrast color combinations
- Use italic for large blocks of text
- Use all-caps for body text (uppercase labels OK)
- Use thin font weights on dark backgrounds
- Rely solely on color for emphasis

---

## Font Loading Strategy

### Web Implementation (If Applicable)

```html
<!-- Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;700;900&family=Poppins:wght@600;700;900&display=swap" rel="stylesheet">
```

```css
/* CSS with fallback */
body {
  font-family: 'Noto Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
}

h1, h2, h3 {
  font-family: 'Poppins', 'Noto Sans', system-ui, sans-serif;
}
```

### Electron Desktop App

Fonts are bundled with the application:
- Located in `public/fonts/` directory
- Loaded via CSS `@font-face` rules
- No external requests needed

---

## Typography Examples in Screenshots

**See screenshots at:** `/docs/screenshots/`

- **01-dashboard-view.png:** Hero headings, stat numbers, section titles
- **07-navigation-sidebar.png:** Navigation labels, logo text
- **08-dashboard-stats.png:** Large numbers, labels, hierarchy
- **06-settings-view.png:** Form labels, body text, button text

---

## Quick Reference Table

| Style | Font | Size | Weight | Line Height | Usage |
|-------|------|------|--------|-------------|-------|
| Hero | Poppins | 48px | 900 | 1.1 | Empty states |
| H1 | Poppins | 36px | 700 | 1.2 | Page titles |
| H2 | Poppins | 30px | 700 | 1.25 | Section headings |
| H3 | Poppins | 24px | 600 | 1.3 | Subsections |
| H4 | Noto Sans | 20px | 700 | 1.4 | Component headings |
| Body Large | Noto Sans | 18px | 400 | 1.6 | Important content |
| Body | Noto Sans | 16px | 400 | 1.5 | Default text |
| Body Medium | Noto Sans | 16px | 500 | 1.5 | Emphasized text |
| Small | Noto Sans | 14px | 400 | 1.5 | Secondary info |
| Tiny | Noto Sans | 12px | 400 | 1.4 | Badges, minimal |
| Button | Noto Sans | 16px | 700 | 1 | Primary buttons |
| Nav | Noto Sans | 16px | 600 | 1.5 | Navigation |
| Stat Number | Noto Sans | 36px | 900 | 1.1 | Dashboard stats |

---

**Last Updated:** February 8, 2026
**Version:** 1.0
**Fonts:** Noto Sans, Poppins (Google Fonts, Open Font License)
