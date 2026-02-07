const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function generatePDF() {
  console.log('🚀 Starting PDF generation...');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  const htmlPath = path.join(__dirname, '..', 'docs', 'SocialSync_Brand_Guidelines.html');
  const pdfPath = path.join(__dirname, '..', 'docs', 'SocialSync_Brand_Guidelines_v1.0.pdf');

  // Load the HTML file
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' });

  console.log('📄 Generating PDF...');

  // Generate PDF with print-optimized settings
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    },
    preferCSSPageSize: true
  });

  await browser.close();

  const stats = fs.statSync(pdfPath);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log('✅ PDF generated successfully!');
  console.log(`📁 Location: ${pdfPath}`);
  console.log(`📊 File size: ${fileSizeMB} MB`);
}

generatePDF().catch((error) => {
  console.error('❌ Error generating PDF:', error);
  process.exit(1);
});
