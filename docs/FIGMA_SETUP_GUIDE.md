# SocialSync Brand Guidelines - Figma Setup Guide

**Complete step-by-step guide to creating the 40-50 page brand guidelines PDF**

---

## Prerequisites

### Required Software
- **Figma Desktop App** (recommended) or Browser version
- **Account:** Free tier is sufficient

### Required Fonts
Download and install these fonts on your system:
1. **Noto Sans** - https://fonts.google.com/specimen/Noto+Sans
   - Weights: 400, 500, 700, 900
2. **Poppins** - https://fonts.google.com/specimen/Poppins
   - Weights: 600, 700, 900

### Required Plugins
Install these Figma plugins:
1. **Iconify** - For inserting Lucide icons
2. **Contrast** - For checking color accessibility
3. **Table of Contents** - For auto-generating ToC (optional)
4. **Unsplash** - For placeholder images (optional)

---

## Part 1: Document Setup (15 minutes)

### Step 1: Create New Figma File

1. Open Figma
2. Click **"New design file"**
3. Name it: `SocialSync Brand Guidelines v1.0`
4. Save location: Your choice (Figma cloud)

### Step 2: Set Up Page Structure

Create these pages (use left sidebar):
1. **Cover** - Main cover page
2. **Intro** - Welcome, story, ToC
3. **Logo System** - Logo variations and usage
4. **Colors** - Color palette and guidelines
5. **Typography** - Font system and examples
6. **Iconography** - Icon specifications
7. **Components** - UI component library
8. **Layout** - Grid and spacing
9. **Motion** - Animation guidelines
10. **Voice** - Brand voice and messaging
11. **Examples** - Application screenshots
12. **Accessibility** - WCAG guidelines

### Step 3: Configure Document Settings

1. **Set Canvas Size (A4):**
   - Click anywhere on canvas
   - Right panel → Frame properties
   - Width: `2480px` (A4 at 300 DPI)
   - Height: `3508px` (A4 at 300 DPI)

   *Note: A4 = 210mm × 297mm = 8.27" × 11.69" at 300 DPI*

2. **Create Master Frame:**
   - Press `F` (Frame tool)
   - Click on canvas
   - Set dimensions: 2480 × 3508
   - Name: "Page Template"

3. **Add Layout Grid:**
   - Select master frame
   - Right panel → Layout grid → **+**
   - Type: **Columns**
   - Count: `12`
   - Gutter: `60px`
   - Margin: `236px` (20mm at 300 DPI)

---

## Part 2: Set Up Styles (30 minutes)

### Step 4: Create Color Styles

**Reference:** `/docs/assets/COLOR_PALETTE.md`

1. **Open Color Styles Panel:**
   - Right sidebar → Click color fill icon
   - Click **"+"** to create new style

2. **Create STAGE Brand Colors:**
   ```
   Name: Brand/Maroon
   Color: #7a0600

   Name: Brand/Red
   Color: #c60c0c

   Name: Brand/Ribbon
   Color: #e10d37

   Name: Brand/Black
   Color: #191919
   ```

3. **Create Gray Scale:**
   ```
   Gray/900 → #0a0a0a
   Gray/800 → #191919
   Gray/700 → #2a2a2a
   Gray/600 → #3a3a3a
   Gray/500 → #4a4a4a
   ```

4. **Create Semantic Colors:**
   ```
   Semantic/Success/500 → #22c55e
   Semantic/Success/600 → #16a34a
   Semantic/Error/500 → #ef4444
   Semantic/Error/600 → #dc2626
   Semantic/Warning/500 → #eab308
   Semantic/Warning/600 → #ca8a04
   Semantic/Info/500 → #3b82f6
   Semantic/Info/600 → #2563eb
   ```

5. **Create Platform Colors:**
   ```
   Platform/Instagram → #E4405F
   Platform/YouTube → #FF0000
   Platform/Google → #4285F4
   ```

### Step 5: Create Text Styles

**Reference:** `/docs/assets/TYPOGRAPHY_REFERENCE.md`

1. **Open Text Styles Panel:**
   - Right sidebar → Text section
   - Click **"+"** to create new style

2. **Create Heading Styles:**
   ```
   Heading/Hero
   Font: Poppins Black (900)
   Size: 144px (48px × 3 for 300 DPI)
   Line Height: 1.1 (auto)
   Color: White

   Heading/H1
   Font: Poppins Bold (700)
   Size: 108px (36px × 3)
   Line Height: 1.2
   Color: White

   Heading/H2
   Font: Poppins Bold (700)
   Size: 90px (30px × 3)
   Line Height: 1.25
   Color: White

   Heading/H3
   Font: Poppins Semibold (600)
   Size: 72px (24px × 3)
   Line Height: 1.3
   Color: White

   Heading/H4
   Font: Noto Sans Bold (700)
   Size: 60px (20px × 3)
   Line Height: 1.4
   Color: Gray 300
   ```

3. **Create Body Styles:**
   ```
   Body/Large
   Font: Noto Sans Regular (400)
   Size: 54px (18px × 3)
   Line Height: 1.6
   Color: White

   Body/Regular
   Font: Noto Sans Regular (400)
   Size: 48px (16px × 3)
   Line Height: 1.5
   Color: White

   Body/Medium
   Font: Noto Sans Medium (500)
   Size: 48px (16px × 3)
   Line Height: 1.5
   Color: White

   Body/Small
   Font: Noto Sans Regular (400)
   Size: 42px (14px × 3)
   Line Height: 1.5
   Color: Gray 300

   Body/Tiny
   Font: Noto Sans Regular (400)
   Size: 36px (12px × 3)
   Line Height: 1.4
   Color: Gray 400
   ```

**Important Note:** All sizes are 3× for 300 DPI printing.
- Screen size 16px = 48px in Figma for 300 DPI output
- Screen size 24px = 72px in Figma for 300 DPI output

### Step 6: Create Effect Styles (Optional)

Create shadow effects for consistency:

```
Shadow/Card
Effect: Drop Shadow
X: 0, Y: 12, Blur: 36, Spread: 0
Color: #7a0600 at 20% opacity

Shadow/Stat Card
Effect: Drop Shadow
X: 0, Y: 24, Blur: 60, Spread: 0
Color: #7a0600 at 30% opacity
```

---

## Part 3: Create Cover Page (30 minutes)

### Step 7: Design Cover Page

**Switch to "Cover" page**

1. **Create Background:**
   - Create frame: 2480 × 3508
   - Fill: Gradient
     - Type: Linear
     - Angle: 135°
     - Color 1: #7a0600 (0%)
     - Color 2: #191919 (100%)

2. **Add Logo:**
   - Import STAGE logo: `/public/stage-logo-horizontal.png`
   - Resize to ~600px width
   - Position: Top center, 400px from top
   - Opacity: 90%

3. **Add "SocialSync" Text:**
   - Text: "SocialSync"
   - Style: Heading/Hero (144px Poppins Black)
   - Position: Center, ~1200px from top
   - Color: White
   - Add shadow effect

4. **Add "by STAGE":**
   - Text: "by STAGE"
   - Font: Noto Sans Medium, 54px
   - Color: Gray 300
   - Position: Below SocialSync, centered

5. **Add Tagline:**
   - Text: "Your Social Media Executive"
   - Style: Heading/H3 (72px)
   - Color: Gray 300
   - Position: Below "by STAGE", centered

6. **Add Decorative Line:**
   - Draw line (press L)
   - Width: 600px, Height: 3px
   - Color: Brand/Ribbon
   - Position: Between logo and SocialSync

7. **Add Footer:**
   - Text: "Brand Guidelines v1.0  •  February 2026"
   - Style: Body/Small
   - Color: Gray 400
   - Position: Bottom center, 200px from bottom

---

## Part 4: Create Introduction Pages (45 minutes)

### Step 8: Welcome Page

1. Create frame: 2480 × 3508
2. **Add Header:**
   - Text: "Welcome"
   - Style: Heading/H1
   - Position: Top left, respecting margins

3. **Add Body Content:**
   ```
   This brand guidelines document establishes the visual
   identity of SocialSync, your intelligent social media
   executive powered by STAGE OTT.

   WHO SHOULD USE THIS GUIDE
   - Designers creating SocialSync materials
   - Developers implementing UI components
   - Marketers creating promotional content
   - Partners integrating with our platform

   HOW TO USE THIS DOCUMENT
   This guide is organized into sections covering every
   aspect of the SocialSync brand identity...
   ```
   - Style: Body/Regular
   - Color: White
   - Line length: 70-80 characters

4. **Add Page Number:**
   - Text: "02"
   - Style: Body/Small
   - Position: Bottom right corner

### Step 9: Brand Story Page

1. Create frame: 2480 × 3508
2. **Add Header:** "Brand Story"
3. **Add Content:**
   ```
   STAGE OTT CONNECTION
   SocialSync is born from STAGE OTT's mission to
   empower creators with cinematic-quality tools...

   PRODUCT VISION
   Automate the routine. Amplify the creative...

   TARGET AUDIENCE
   - Content creators
   - Social media managers
   - Digital agencies
   - Small business owners
   ```
4. Add page number: "03"

### Step 10: Table of Contents

1. Create frame: 2480 × 3508
2. **Add Header:** "Table of Contents"
3. **Add TOC List:**
   ```
   1. Logo System .................... 05
   2. Color Palette .................. 11
   3. Typography ..................... 19
   4. Iconography .................... 23
   5. UI Components .................. 27
   6. Layout & Spacing ............... 35
   7. Motion & Animation ............. 38
   8. Voice & Messaging .............. 41
   9. Application Examples ........... 43
   10. Accessibility ................. 49
   ```
   - Style: Body/Large with Heading/H4 for section names
   - Use leader dots or tabs
4. Add page number: "04"

---

## Part 5: Logo System Pages (60 minutes)

**Reference:** Logo assets in `/public/`

### Step 11: Primary Logo Lockups

1. Create frame: 2480 × 3508
2. **Add Section Header:**
   - Text: "Logo System"
   - Style: Heading/H1 with gradient fill (red to white)

3. **Import Logos:**
   - Import `/public/stage-logo-horizontal.png`
   - Create "SocialSync" text lockup with "by STAGE" below
   - Show at multiple sizes: Large, Medium, Small

4. **Add Labels:**
   - "Primary Lockup (Horizontal)"
   - "Vertical Lockup"
   - "Icon Only"

5. **Add Guidelines:**
   - Minimum sizes
   - Clear space (equal to X-height of logo)
   - Usage notes

### Step 12: Logo Don'ts Page

1. Create frame: 2480 × 3508
2. **Show Examples with ❌:**
   - Don't stretch or distort
   - Don't change colors
   - Don't add effects
   - Don't place on busy backgrounds
   - Don't rotate
   - Don't crop

3. **Visual Examples:**
   - Create each "don't" example
   - Add red X overlay (60% opacity)
   - Add caption explaining why

*Continue with remaining logo pages...*

---

## Part 6: Color System Pages (90 minutes)

**Reference:** `/docs/assets/COLOR_PALETTE.md`

### Step 13: Color Palette Page

1. Create frame: 2480 × 3508
2. **Add Section Header:** "Color System"

3. **Create Color Swatches:**
   - For each color, create:
     - Large square (400 × 400px)
     - Color name (Heading/H4)
     - HEX code (Body/Medium)
     - RGB values (Body/Small)
     - Usage notes (Body/Small)

4. **Layout:**
   ```
   [Maroon]    [Red]       [Ribbon]
   #7a0600     #c60c0c     #e10d37

   [Gray 900]  [Gray 800]  [Gray 700]
   #0a0a0a     #191919     #2a2a2a
   ```

5. **Add Gradient Examples:**
   - Show button gradient
   - Show background gradient
   - Show card gradient

### Step 14: Semantic Colors Page

1. Create frame: 2480 × 3508
2. **Show semantic colors with context:**
   - Success green with checkmark icon
   - Error red with X icon
   - Warning yellow with triangle icon
   - Info blue with info icon

3. **Add Usage Examples:**
   - Toast notification mockups
   - Status badge examples
   - Button states

### Step 15: Color Contrast Page

1. Create frame: 2480 × 3508
2. **Show Contrast Ratios:**
   - White on Gray 800: 14.3:1 ✅ AAA
   - Success on Gray 800: 4.8:1 ✅ AA
   - Error on Gray 800: 4.2:1 ✅ AA

3. **Add Accessibility Guidelines:**
   - WCAG AA requirements
   - WCAG AAA requirements
   - Minimum contrast for text
   - Minimum contrast for UI components

*Continue with remaining color pages...*

---

## Part 7: Typography Pages (60 minutes)

**Reference:** `/docs/assets/TYPOGRAPHY_REFERENCE.md`

### Step 16: Font Families Page

1. Create frame: 2480 × 3508
2. **Show Font Specimens:**

   **Noto Sans:**
   ```
   ABCDEFGHIJKLMNOPQRSTUVWXYZ
   abcdefghijklmnopqrstuvwxyz
   0123456789 !@#$%^&*()
   ```
   Show in weights: 400, 500, 700, 900

   **Poppins:**
   ```
   ABCDEFGHIJKLMNOPQRSTUVWXYZ
   abcdefghijklmnopqrstuvwxyz
   0123456789
   ```
   Show in weights: 600, 700, 900

### Step 17: Type Scale Page

1. Create frame: 2480 × 3508
2. **Show Visual Hierarchy:**
   ```
   Hero (144px) - "The quick brown fox"
   H1 (108px) - "The quick brown fox"
   H2 (90px) - "The quick brown fox"
   H3 (72px) - "The quick brown fox"
   H4 (60px) - "The quick brown fox"
   Body (48px) - "The quick brown fox jumps..."
   Small (42px) - "The quick brown fox..."
   Tiny (36px) - "The quick brown fox..."
   ```

3. **Add Size Labels:**
   - Show pixel size
   - Show line height
   - Show font weight

*Continue with typography pages...*

---

## Part 8: Iconography Pages (60 minutes)

**Reference:** `/docs/assets/ICON_REFERENCE.md`

### Step 18: Icon Grid Page

1. Create frame: 2480 × 3508
2. **Install Icons:**
   - Open Iconify plugin (Plugins → Iconify)
   - Search "Lucide"
   - Insert each icon from icon reference

3. **Create Icon Grid:**
   - Layout: 5 columns × 4 rows
   - Size: 60px each (20px × 3 for 300 DPI)
   - Spacing: 80px between icons
   - Label each icon below

4. **Icons to Include:**
   - LayoutDashboard
   - FolderOpen
   - ListChecks
   - CheckCircle2
   - CalendarClock
   - Settings
   - Instagram
   - Youtube
   - HardDrive
   - XCircle
   - AlertTriangle
   - SendHorizontal
   - Search
   - FileText
   - RefreshCw
   - Trash2
   - Loader2
   - Info

### Step 19: Icon Size Scale Page

1. Create frame: 2480 × 3508
2. **Show Same Icon at Different Sizes:**
   ```
   Badge:      48px  (16px × 3)
   Inline:     60px  (20px × 3)
   Navigation: 66px  (22px × 3)
   Header:     72px  (24px × 3)
   Large:      96px  (32px × 3)
   Stat:       144px (48px × 3)
   Hero:       192px (64px × 3)
   ```

3. **Add Usage Context:**
   - Show icon in context (button, badge, etc.)

*Continue with icon pages...*

---

## Part 9: UI Components Pages (90 minutes)

**Reference:** Screenshots in `/docs/screenshots/`

### Step 20: Button System Page

1. Create frame: 2480 × 3508
2. **Create Button Examples:**

   **Primary Button:**
   - Width: 360px, Height: 108px
   - Fill: Gradient (#7a0600 to #c60c0c)
   - Border Radius: 36px
   - Text: "Connect Account"
   - Shadow: Drop shadow effect

   **Secondary Button:**
   - Width: 300px, Height: 84px
   - Fill: #3a3a3a (Gray 600)
   - Border Radius: 24px
   - Text: "Cancel"

   **Tertiary/Icon Button:**
   - Size: 60px × 60px
   - Icon only
   - Text color: Gray 400

3. **Show States:**
   - Default
   - Hover (scale 105%)
   - Active (scale 95%)
   - Disabled (opacity 50%)

### Step 21: Card Components Page

1. Create frame: 2480 × 3508
2. **Recreate Dashboard Stat Card:**
   - Import screenshot `/docs/screenshots/08-dashboard-stats.png`
   - Annotate dimensions
   - Show gradient background
   - Show border
   - Show shadow
   - Label all elements

3. **Annotations:**
   - Background: gradient from #2a2a2a to #191919
   - Border: 2px #c60c0c at 30% opacity
   - Shadow: 36px blur, #7a0600 at 10%
   - Padding: 48px
   - Border radius: 48px

### Step 22: Toast Notifications Page

1. Create frame: 2480 × 3508
2. **Create Toast Examples:**

   **Success Toast:**
   - Width: 900px, Height: 120px
   - Background: #16a34a
   - Border: 1px #22c55e
   - Icon: CheckCircle2 (60px)
   - Text: "Account connected successfully!"
   - Close button: X icon (48px)

   **Error Toast:**
   - Same layout
   - Colors: #dc2626 background, #ef4444 border
   - Icon: XCircle

   **Warning Toast:**
   - Colors: #ca8a04 background, #eab308 border
   - Icon: AlertTriangle

   **Info Toast:**
   - Colors: #2563eb background, #3b82f6 border
   - Icon: Info

*Continue with component pages...*

---

## Part 10: Application Examples (60 minutes)

### Step 23: Import Screenshots

1. **Create frames for each screenshot:**
   - Import all screenshots from `/docs/screenshots/`
   - Scale to fit frame with margins
   - Add borders/shadows for polish

2. **Dashboard View Page:**
   - Import `01-dashboard-view.png`
   - Add annotations:
     - "Navigation icons (22px)"
     - "Dashboard stats (48px icons)"
     - "Platform cards with brand colors"
     - "Activity feed"

3. **Add Callouts:**
   - Use arrows pointing to specific elements
   - Label colors, sizes, spacing
   - Explain design decisions

*Repeat for each screenshot...*

---

## Part 11: Export PDF (30 minutes)

### Step 24: Prepare for Export

1. **Add Page Numbers:**
   - Go through each page
   - Add page number in bottom right
   - Style: Body/Small, Gray 400
   - Numbers: 01, 02, 03... 50

2. **Final Review:**
   - Check all text is readable
   - Verify all images are high quality
   - Check color accuracy
   - Verify fonts are applied correctly
   - Check spacing and alignment

3. **Create Export Frame:**
   - Select all frames
   - Group them (Cmd/Ctrl + G)
   - Name: "SocialSync Brand Guidelines v1.0"

### Step 25: Export as PDF

**Method 1: Figma Native Export (Free)**
1. Select all frames
2. Right panel → Export section
3. Click **"+"** to add export setting
4. Format: **PDF**
5. Click **Export** button
6. Save as: `SocialSync_Brand_Guidelines_v1.0.pdf`
7. Location: `/Users/kunalkumrawat/socialsync/docs/`

**Limitations:** May not preserve all effects

**Method 2: Print to PDF (Recommended)**
1. File → Export → PDF
2. In PDF settings:
   - Quality: High
   - Include: All pages
   - Flatten: No (keeps layers for editing)
3. Save to same location

**Method 3: Plugin (Best Quality)**
1. Install "PDF Export" plugin
2. Configure:
   - Resolution: 300 DPI
   - Color mode: RGB
   - Compression: Medium
   - Embed fonts: Yes
3. Export all pages
4. Save

### Step 26: Verify PDF

1. **Open PDF and check:**
   - All pages present (should be 40-50)
   - Fonts render correctly
   - Images are sharp (not pixelated)
   - Colors accurate
   - File size under 20MB
   - All links work (if added)

2. **If issues:**
   - Increase export quality
   - Check font embedding
   - Optimize large images
   - Re-export

---

## Tips for Success

### Design Tips

**Consistency:**
- Use text and color styles throughout
- Maintain same margins on all pages
- Keep header placement consistent
- Use same page number position

**Visual Hierarchy:**
- Use size and color to create hierarchy
- Group related information
- Use white space generously
- Guide eye with color and contrast

**Typography:**
- Don't mix too many font sizes
- Keep line length readable (70-80 chars)
- Use adequate line height
- Align text to grid

**Color:**
- Stick to defined palette
- Use semantic colors appropriately
- Maintain high contrast
- Test accessibility

### Time Savers

**Use Components:**
- Create page header component
- Create page number component
- Create callout/annotation component
- Reuse across pages

**Duplicate Pages:**
- Create one perfect page
- Duplicate for similar pages
- Just swap content

**Auto Layout:**
- Use Auto Layout for consistent spacing
- Makes adjustments easier
- Maintains alignment

**Plugins:**
- **Iconify:** Quick icon access
- **Unsplash:** Stock photos if needed
- **Content Reel:** Generate dummy text
- **Stark:** Accessibility checking

---

## Troubleshooting

### Common Issues

**Fonts not showing:**
- Install fonts on your system
- Restart Figma
- Check font names match exactly

**Export quality poor:**
- Increase DPI (use 300)
- Check image resolution
- Don't scale images up, only down

**File size too large:**
- Compress images before import
- Use JPG for photos, PNG for graphics
- Reduce unnecessary effects
- Flatten complex elements

**Colors don't match:**
- Use exact HEX codes
- Check color profile (use sRGB)
- Verify monitor calibration

**Alignment issues:**
- Turn on rulers (Shift + R)
- Use grid (Ctrl/Cmd + ')
- Enable snap to pixel grid

---

## Final Checklist

Before considering the PDF complete:

- [ ] All 40-50 pages created
- [ ] Cover page with logo and title
- [ ] Table of contents with page numbers
- [ ] Logo system pages (6+)
- [ ] Color system pages (8+)
- [ ] Typography pages (4+)
- [ ] Icon pages (4+)
- [ ] Component pages (8+)
- [ ] Layout pages (3+)
- [ ] Motion pages (3+)
- [ ] Voice pages (2+)
- [ ] Screenshot examples (6+)
- [ ] Accessibility pages (2+)
- [ ] All page numbers added
- [ ] All text styles applied
- [ ] All color styles applied
- [ ] All images high quality
- [ ] PDF exported at 300 DPI
- [ ] Fonts embedded
- [ ] File size under 20MB
- [ ] Saved in `/docs/` folder

---

## Next Steps After Completion

1. **Share with team** for review
2. **Gather feedback** and make revisions
3. **Version control** - increment version number
4. **Distribute** to stakeholders
5. **Update** as brand evolves

---

## Resources

### Assets Created for You
- Color palette: `/docs/assets/COLOR_PALETTE.md`
- Icon reference: `/docs/assets/ICON_REFERENCE.md`
- Typography guide: `/docs/assets/TYPOGRAPHY_REFERENCE.md`
- Screenshots: `/docs/screenshots/` (10 images)

### Reference Materials
- Implementation guide: `/docs/BRAND_IDENTITY_IMPLEMENTATION.md`
- PDF spec: `/docs/BRAND_GUIDELINES_PDF_SPEC.md`
- Logo assets: `/public/stage-logo-horizontal.png`

### External Resources
- Lucide icons: https://lucide.dev
- Figma tutorials: https://help.figma.com
- Color contrast checker: https://webaim.org/resources/contrastchecker/
- Google Fonts: https://fonts.google.com

---

**Estimated Total Time:** 8-12 hours
**Difficulty:** Intermediate
**Tools Required:** Figma (free), fonts (free)

**Good luck creating your brand guidelines! 🎨**

---

**Document Version:** 1.0
**Last Updated:** February 8, 2026
**Created For:** SocialSync Brand Identity Phase 4
