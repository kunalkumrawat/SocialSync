# How to Convert Brand Guidelines HTML to PDF

The brand guidelines HTML file has been created and opened in your browser.

## Method 1: Browser Print to PDF (Recommended - Takes 2 minutes)

### Steps:

1. **The HTML file should already be open in your browser**
   - If not, open: `/Users/kunalkumrawat/socialsync/docs/SocialSync_Brand_Guidelines.html`

2. **Print to PDF:**
   - **macOS:** Press `Cmd + P`
   - **Windows/Linux:** Press `Ctrl + P`

3. **Configure Print Settings:**
   - **Destination:** Save as PDF (or "Microsoft Print to PDF" on Windows)
   - **Layout:** Portrait
   - **Paper size:** A4
   - **Margins:** None (or Minimum)
   - **Options:**
     - ✓ Background graphics (IMPORTANT - includes colors and gradients)
     - Scale: 100%

4. **Save:**
   - Click "Save" or "Print"
   - Name it: `SocialSync_Brand_Guidelines_v1.0.pdf`
   - Save to: `/Users/kunalkumrawat/socialsync/docs/`

**Result:** You'll have a professional, high-quality PDF with all colors, gradients, and styling intact!

---

## Method 2: Using Chrome DevTools (Alternative)

If the print dialog doesn't give good results:

1. Open the HTML in **Google Chrome**
2. Press `Cmd + Option + I` (macOS) or `F12` (Windows)
3. Press `Cmd + Shift + P` (macOS) or `Ctrl + Shift + P` (Windows)
4. Type "PDF" and select "Capture full size screenshot" or "Print"
5. Configure as above and save

---

## Method 3: Using Command Line (Advanced)

If you want to automate it:

```bash
# Install Playwright browsers first
cd /Users/kunalkumrawat/socialsync
npx playwright install chromium

# Run the PDF generator
node scripts/generate-pdf.js
```

This will create the PDF automatically at:
`/Users/kunalkumrawat/socialsync/docs/SocialSync_Brand_Guidelines_v1.0.pdf`

---

## Verification Checklist

After creating the PDF, verify:

- [ ] All pages present (24 pages total)
- [ ] Colors render correctly (dark backgrounds, gradients)
- [ ] Fonts display properly (Noto Sans, Poppins)
- [ ] Page numbers visible
- [ ] Table of contents readable
- [ ] Code blocks and tables formatted correctly
- [ ] File size reasonable (should be 2-5 MB)

---

## Troubleshooting

### Colors/backgrounds not showing:
- Make sure "Background graphics" is checked in print settings
- Try using Chrome instead of Safari

### Text is too small:
- Check scale is set to 100%
- Margins set to None or Minimum

### Pages cut off:
- Set margins to None
- Try "Fit to page width" option

### Fonts don't look right:
- Fonts should be embedded automatically
- Make sure you're viewing in a modern browser

---

## Quick Start (Fastest Way)

1. Press `Cmd + P` (print)
2. Select "Save as PDF"
3. Enable "Background graphics"
4. Set margins to "None"
5. Click "Save"

**Done!** You now have your brand guidelines PDF.

---

**Estimated time:** 2 minutes
**Difficulty:** Easy
**Result:** Professional brand guidelines PDF ready to share!
