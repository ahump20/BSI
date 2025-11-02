#!/usr/bin/env node
/**
 * Drill PDF Generator for The Garrido Code
 * Extracts drills from episode HTML and generates downloadable PDFs
 */

const fs = require('fs');
const path = require('path');

// Episode metadata
const episodes = [
  { file: 'chaos.html', num: '01', title: 'Controlled Chaos', drills: 3 },
  { file: 'respect.html', num: '02', title: 'Respect the Game', drills: 3 },
  { file: 'teach.html', num: '03', title: 'The Game Teaches', drills: 3 },
  { file: 'failure.html', num: '04', title: 'Failure as Information', drills: 3 },
  { file: 'poetry.html', num: '05', title: 'Poetry in Motion', drills: 3 },
  { file: 'team.html', num: '06', title: 'Team Within Team', drills: 1 },
  { file: 'architecture.html', num: '07', title: 'Practice Architecture', drills: 1 },
  { file: 'flow.html', num: '08', title: 'Flow & Focus', drills: 1 },
  { file: 'memory.html', num: '09', title: 'Institutional Memory', drills: 1 },
  { file: 'legacy.html', num: '10', title: 'Legacy Over Victory', drills: 1 }
];

// PDF-ready HTML template
const pdfTemplate = (episode, drillContent) => `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>EP${episode.num} Drills - ${episode.title}</title>
<style>
@page { size: letter; margin: 0.75in; }
body {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  max-width: 7.5in;
  margin: 0 auto;
}
h1 {
  color: #BF5700;
  font-size: 24pt;
  border-bottom: 3px solid #BF5700;
  padding-bottom: 0.25in;
  margin-bottom: 0.5in;
}
h2 {
  color: #CC6600;
  font-size: 18pt;
  margin-top: 0.4in;
  page-break-after: avoid;
}
h3 {
  color: #666;
  font-size: 14pt;
  margin-top: 0.3in;
}
.drill-header {
  background: #f8f8f8;
  padding: 0.15in;
  border-left: 4px solid #BF5700;
  margin: 0.2in 0;
  page-break-inside: avoid;
}
.drill-label {
  background: linear-gradient(135deg, #BF5700, #D97B38);
  color: white;
  padding: 0.05in 0.15in;
  border-radius: 0.1in;
  font-size: 10pt;
  font-weight: bold;
  display: inline-block;
  margin-top: 0.1in;
}
ol {
  margin: 0.15in 0;
  padding-left: 0.3in;
}
li {
  margin: 0.1in 0;
  page-break-inside: avoid;
}
.metrics {
  background: #FFF4E6;
  border-left: 3px solid #BF5700;
  padding: 0.15in;
  margin: 0.2in 0;
  page-break-inside: avoid;
}
.metrics h4 {
  color: #CC6600;
  margin-top: 0;
  font-size: 12pt;
}
.metric-item {
  margin: 0.05in 0 0.05in 0.2in;
  font-size: 10pt;
}
.footer {
  margin-top: 0.5in;
  padding-top: 0.2in;
  border-top: 1px solid #ddd;
  font-size: 9pt;
  color: #666;
  text-align: center;
}
@media print {
  body { margin: 0; }
  .drill-header, .metrics { page-break-inside: avoid; }
}
</style>
</head>
<body>
<h1>Episode ${episode.num}: ${episode.title}</h1>
<p><strong>The Garrido Code</strong> | Practice Drills & Implementation</p>
${drillContent}
<div class="footer">
<p>&copy; 2025 Blaze Sports Intel | blazesportsintel.com/garrido</p>
<p>Honoring the legacy of Augie Garrido through actionable coaching intelligence.</p>
</div>
</body>
</html>`;

// Extract drill content from HTML
function extractDrills(htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf8');

  // Extract drill cards (between <div class="drill-card"> and closing </div>)
  const drillMatches = html.match(/<div class="drill-card"[^>]*>([\s\S]*?)<\/div>\s*<\/section>/);
  if (!drillMatches) return '';

  let content = drillMatches[0];

  // Clean up for PDF
  content = content
    .replace(/<div class="drill-card"[^>]*>/g, '<div class="drill-header">')
    .replace(/data-aos="[^"]*"/g, '')
    .replace(/<i class="fas [^"]*"><\/i>/g, '•')
    .replace(/<span class="metric-text">/g, '')
    .replace(/<\/span>/g, '')
    .replace(/class="drill-metrics"/g, 'class="metrics"')
    .replace(/class="metrics-list"/g, 'class="metrics"')
    .replace(/<h5>/g, '<h4>')
    .replace(/<\/h5>/g, '</h4>')
    .replace(/<div class="metric-item">/g, '<div class="metric-item">• ');

  return content;
}

// Generate all PDFs
console.log('🎓 The Garrido Code - Drill PDF Generator\n');

episodes.forEach(episode => {
  const htmlPath = path.join(__dirname, episode.file);

  if (!fs.existsSync(htmlPath)) {
    console.log(`⚠️  ${episode.file} not found, skipping...`);
    return;
  }

  const drillContent = extractDrills(htmlPath);
  const pdfHtml = pdfTemplate(episode, drillContent);

  const outputPath = path.join(__dirname, 'downloads', `ep${episode.num}-drills.html`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, pdfHtml);

  console.log(`✓ EP${episode.num}: ${episode.title} → downloads/ep${episode.num}-drills.html`);
});

console.log('\n📄 PDF-ready HTML files generated in /garrido/downloads/');
console.log('   Open in browser and Print to PDF (Cmd+P) for final PDFs\n');
console.log('💡 Tip: Use browser print with "Background graphics" enabled');
