# STAGE OTT Branding - SocialSync Redesign

## Summary
SocialSync has been redesigned to match STAGE OTT's official brand visual identity guidelines (2021/2025).

## Brand Colors Applied

### Primary STAGE Colors
- **Maroon** (#7a0600) - Primary brand color
- **Milano Red** (#c60c0c) - Secondary brand color
- **Red Ribbon** (#e10d37) - Accent color for highlights
- **Cod Gray** (#191919) - Main background (theatre-like cinematic feel)

### Gray Scale
- **#0a0a0a** - Deeper black
- **#191919** - Brand black (main background)
- **#2a2a2a** - Lighter shade for cards
- **#3a3a3a** - Mid-tone for hover states
- **#4a4a4a** - Lighter elements

## Typography
- **Primary Font**: Noto Sans (400, 500, 600, 700, 800, 900)
- Loaded via Google Fonts
- Bold, clean typography matching STAGE's brand guidelines

## Files Modified

### 1. `tailwind.config.js`
- Added STAGE color palette as custom theme colors
- Configured `stage.maroon`, `stage.red`, `stage.ribbon`, `stage.black`, `stage.gray.*`
- Set Noto Sans as primary font family

### 2. `src/index.css`
- Imported Noto Sans font from Google Fonts
- Updated body background to STAGE black (#191919)
- Redesigned scrollbar with maroon/red colors
- Added STAGE theme commentary

### 3. `src/App.tsx`
**Main Layout:**
- Background: Changed from `bg-gray-900` to `bg-stage-black`
- Sidebar: Changed from `bg-gray-800` to `bg-stage-gray-700`
- Added red maroon border accents (`border-stage-maroon/20`)

**Logo Section:**
- Integrated official STAGE white logo
- Added "Powered by STAGE OTT" branding
- Changed "SocialSync" to accent color (stage-ribbon)

**Navigation Buttons:**
- Active state: Gradient from maroon to red with shadow
- Hover state: STAGE gray with smooth transitions
- Added font-medium weight for clarity

**Header:**
- Background: stage-gray-700
- Border: stage-maroon/30
- Title text: stage-ribbon color

**Status Footer:**
- Background: stage-gray-800
- Active indicator: stage-ribbon (was green)
- Enhanced typography

**Dashboard Cards:**
- Background: stage-gray-700
- Border: stage-maroon/20 with hover effect
- Stat colors updated to match STAGE palette

**All UI Components:**
- Replaced all `bg-gray-800` → `bg-stage-gray-700`
- Replaced all `bg-gray-700` → `bg-stage-gray-600`
- Replaced all blue accents → red/maroon STAGE colors

### 4. `public/stage-logo.png`
- Added official STAGE white logo (without background)
- Source: `/Desktop/Desktop /STAGE/Marketing/Marketing - HR/Brand assets/STAGE _ OFFICIAL LOGOS/`

## Design Philosophy Applied

Following STAGE's brand guidelines:
1. **Theatre-like Cinematic Feel**: Dark backgrounds (#191919) creating an immersive atmosphere
2. **Bold Typography**: Noto Sans font family for strong, clean text
3. **Red Curtain Symbolism**: Integrated through accent colors and logo
4. **High Contrast**: White text on black backgrounds for readability
5. **Professional Polish**: Gradient buttons, subtle borders, smooth transitions

## Color Usage Guide

### When to Use Each Color:
- **Maroon (#7a0600)**: Borders, subtle accents, gradients
- **Red (#c60c0c)**: Buttons, hover states, call-to-action
- **Ribbon (#e10d37)**: Highlights, active states, important text
- **Black (#191919)**: Main background, creating theatre atmosphere
- **Grays**: Cards, panels, layered UI elements

## Before vs After

### Before:
- Generic gray/blue color scheme
- Standard system fonts
- No brand association
- Felt like a utility tool

### After:
- STAGE OTT branded colors (maroon, red, black)
- Noto Sans typography
- "Powered by STAGE OTT" branding
- Cinematic theatre-like aesthetic
- Professional, polished appearance
- Clear brand identity

## Result
SocialSync now feels like an **official STAGE OTT product** with:
- ✅ Brand-compliant color palette
- ✅ Official STAGE logo integration
- ✅ Theatre-inspired dark theme
- ✅ Professional typography (Noto Sans)
- ✅ Consistent visual identity
- ✅ Enhanced user experience with smooth transitions

---

**Updated by:** Claude Code
**Date:** February 8, 2026
**Reference:** Brand Visual Identity | STAGE 2021
**Contact:** kunal@stage.in
