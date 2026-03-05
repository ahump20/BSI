import sharp from 'sharp';
import { readdir, mkdir } from 'fs/promises';
import { join, parse } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const INPUT_DIR = join(__dirname, '../public/assets');
const OUTPUT_DIR = join(__dirname, '../public/assets/optimized');
const SIZES = [640, 1024, 1920];
const QUALITY = 85;

// Image extensions to process
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

async function optimizeImages() {
  try {
    // Create output directory if it doesn't exist
    await mkdir(OUTPUT_DIR, { recursive: true });

    // Read all files from input directory
    const files = await readdir(INPUT_DIR);

    console.log(`\n🔍 Found ${files.length} files in ${INPUT_DIR}\n`);

    let totalOriginalSize = 0;
    let totalOptimizedSize = 0;
    let processedCount = 0;

    for (const file of files) {
      const ext = parse(file).ext.toLowerCase();

      // Skip non-image files
      if (!IMAGE_EXTENSIONS.includes(ext)) {
        console.log(`⏭️  Skipping ${file} (not an image)`);
        continue;
      }

      const inputPath = join(INPUT_DIR, file);
      const { name } = parse(file);

      console.log(`\n📸 Processing: ${file}`);

      // Get original file size
      const metadata = await sharp(inputPath).metadata();
      const originalSize = metadata.size || 0;
      totalOriginalSize += originalSize;

      // Convert to WebP at multiple sizes
      for (const width of SIZES) {
        const outputFileName = `${name}-${width}w.webp`;
        const outputPath = join(OUTPUT_DIR, outputFileName);

        try {
          const info = await sharp(inputPath)
            .resize(width, null, {
              fit: 'inside',
              withoutEnlargement: true
            })
            .webp({ quality: QUALITY })
            .toFile(outputPath);

          totalOptimizedSize += info.size;
          const reduction = ((1 - info.size / originalSize) * 100).toFixed(1);

          console.log(`  ✓ ${width}w: ${(info.size / 1024).toFixed(1)}KB (${reduction}% smaller)`);
        } catch (error) {
          console.error(`  ✗ Failed to create ${width}w:`, error.message);
        }
      }

      processedCount++;
    }

    // Print summary
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ Optimization Complete!`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📊 Images processed: ${processedCount}`);
    console.log(`📦 Original size: ${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📦 Optimized size: ${(totalOptimizedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`🎉 Total reduction: ${((1 - totalOptimizedSize / totalOriginalSize) * 100).toFixed(1)}%`);
    console.log(`📁 Output directory: ${OUTPUT_DIR}`);
    console.log(`${'='.repeat(60)}\n`);

  } catch (error) {
    console.error('❌ Error during optimization:', error);
    process.exit(1);
  }
}

optimizeImages();
