import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUTPUT_PATH = join(__dirname, '../public/assets/og-image.jpg');

async function generateOGImage() {
  try {
    console.log('📸 Generating Open Graph image...\n');

    // Create a base canvas with gradient
    const width = 1200;
    const height = 630;

    // Create SVG with text overlay
    const svgOverlay = `
      <svg width="${width}" height="${height}">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1A1A1A;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#0D0D0D;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1A1A1A;stop-opacity:1" />
          </linearGradient>
        </defs>

        <!-- Background -->
        <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>

        <!-- Burnt orange accent bars -->
        <rect x="0" y="0" width="${width}" height="8" fill="#BF5700"/>
        <rect x="0" y="${height - 8}" width="${width}" height="8" fill="#BF5700"/>

        <!-- Name -->
        <text
          x="600"
          y="240"
          font-family="Oswald, Arial, sans-serif"
          font-size="72"
          font-weight="bold"
          fill="#F4EEE7"
          text-anchor="middle"
        >AUSTIN HUMPHREY</text>

        <!-- Subtitle -->
        <text
          x="600"
          y="320"
          font-family="Oswald, Arial, sans-serif"
          font-size="32"
          font-weight="400"
          fill="#BF5700"
          text-anchor="middle"
        >Sports Intelligence · Product Strategy · AI Analytics</text>

        <!-- Texas soil tagline -->
        <text
          x="600"
          y="420"
          font-family="serif"
          font-size="28"
          font-style="italic"
          fill="#F4EEE7"
          fill-opacity="0.8"
          text-anchor="middle"
        >Born in Memphis. Rooted in Texas Soil.</text>

        <!-- URL -->
        <text
          x="600"
          y="520"
          font-family="monospace"
          font-size="20"
          fill="#703A0F"
          text-anchor="middle"
        >4547a73c.austin-portfolio-dal.pages.dev</text>
      </svg>
    `;

    await sharp(Buffer.from(svgOverlay))
      .jpeg({ quality: 90 })
      .toFile(OUTPUT_PATH);

    console.log(`✅ OG image generated: ${OUTPUT_PATH}`);
    console.log(`📐 Dimensions: ${width}x${height}px`);
    console.log(`📦 Format: JPEG (optimized for social sharing)\n`);

  } catch (error) {
    console.error('❌ Error generating OG image:', error);
    process.exit(1);
  }
}

generateOGImage();
