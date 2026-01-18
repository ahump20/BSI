#!/usr/bin/env node

/**
 * Image Optimization Script
 *
 * Optimizes images in public/images for production:
 * - Converts large PNG/JPG to WebP (with quality settings)
 * - Compresses original images
 * - Logs savings
 *
 * Usage: node scripts/optimize-images.mjs
 *
 * Requirements: sharp (npm install sharp --save-dev)
 */

import sharp from 'sharp';
import { readdir, stat, writeFile, unlink } from 'fs/promises';
import { join, extname, basename } from 'path';
import { existsSync } from 'fs';

const PUBLIC_IMAGES = 'public/images';
const SIZE_THRESHOLD = 100 * 1024; // Only optimize files > 100KB
const WEBP_QUALITY = 80;
const JPEG_QUALITY = 80;
const PNG_COMPRESSION = 9;

// Command line flags
const args = process.argv.slice(2);
const REMOVE_ORIGINALS = args.includes('--remove-originals');
const SAVINGS_THRESHOLD = 0.5; // Remove original if WebP is 50%+ smaller

// Track savings
let totalOriginalSize = 0;
let totalOptimizedSize = 0;
let filesProcessed = 0;
let filesSkipped = 0;

async function getFilesRecursive(dir) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getFilesRecursive(fullPath)));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

async function optimizeImage(filePath) {
  const ext = extname(filePath).toLowerCase();
  const validExts = ['.jpg', '.jpeg', '.png', '.gif'];

  if (!validExts.includes(ext)) {
    return;
  }

  try {
    const stats = await stat(filePath);
    const originalSize = stats.size;

    // Skip small files
    if (originalSize < SIZE_THRESHOLD) {
      filesSkipped++;
      return;
    }

    totalOriginalSize += originalSize;

    // Check if WebP version already exists and is smaller
    const webpPath = filePath.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp');
    if (existsSync(webpPath)) {
      const webpStats = await stat(webpPath);
      if (webpStats.size < originalSize * 0.8) {
        console.log(`  ⏭️  Skip ${basename(filePath)} - WebP already exists`);
        totalOptimizedSize += webpStats.size;
        filesSkipped++;
        return;
      }
    }

    const image = sharp(filePath);
    const metadata = await image.metadata();

    // Resize if larger than 2000px on any dimension (most screens don't need more)
    const maxDimension = 2000;
    const needsResize =
      (metadata.width && metadata.width > maxDimension) ||
      (metadata.height && metadata.height > maxDimension);

    let pipeline = sharp(filePath);

    if (needsResize) {
      pipeline = pipeline.resize(maxDimension, maxDimension, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Create WebP version
    const webpBuffer = await pipeline.clone().webp({ quality: WEBP_QUALITY }).toBuffer();

    // Only save WebP if it's smaller than original
    if (webpBuffer.length < originalSize * 0.9) {
      await writeFile(webpPath, webpBuffer);
      const savingsRatio = (originalSize - webpBuffer.length) / originalSize;
      const savingsPercent = savingsRatio * 100;
      console.log(
        `  ✅ ${basename(filePath)} → WebP (${formatSize(originalSize)} → ${formatSize(webpBuffer.length)}, -${savingsPercent.toFixed(0)}%)`
      );
      totalOptimizedSize += webpBuffer.length;

      // Remove original if flag is set and savings are significant
      if (REMOVE_ORIGINALS && savingsRatio >= SAVINGS_THRESHOLD) {
        await unlink(filePath);
        console.log(`     🗑️  Removed original (${formatSize(originalSize)} saved)`);
      }
    } else {
      // If WebP isn't smaller, optimize original format
      let optimizedBuffer;

      if (ext === '.png') {
        optimizedBuffer = await pipeline
          .png({ compressionLevel: PNG_COMPRESSION, palette: true })
          .toBuffer();
      } else if (ext === '.jpg' || ext === '.jpeg') {
        optimizedBuffer = await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
      } else {
        totalOptimizedSize += originalSize;
        filesSkipped++;
        return;
      }

      if (optimizedBuffer.length < originalSize) {
        await writeFile(filePath, optimizedBuffer);
        const savings = ((originalSize - optimizedBuffer.length) / originalSize) * 100;
        console.log(
          `  ✅ ${basename(filePath)} optimized (${formatSize(originalSize)} → ${formatSize(optimizedBuffer.length)}, -${savings.toFixed(0)}%)`
        );
        totalOptimizedSize += optimizedBuffer.length;
      } else {
        totalOptimizedSize += originalSize;
        console.log(`  ⏭️  ${basename(filePath)} - already optimal`);
      }
    }

    filesProcessed++;
  } catch (error) {
    console.error(`  ❌ Error processing ${filePath}:`, error.message);
    filesSkipped++;
  }
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

async function main() {
  console.log('🖼️  BSI Image Optimization\n');
  console.log(`Processing images in ${PUBLIC_IMAGES}...`);
  console.log(`Settings: WebP quality ${WEBP_QUALITY}, JPEG quality ${JPEG_QUALITY}`);
  console.log(`Threshold: Only files > ${formatSize(SIZE_THRESHOLD)}`);
  console.log(`Remove originals: ${REMOVE_ORIGINALS ? 'Yes (when savings > 50%)' : 'No'}`);
  console.log(`\nUsage: node scripts/optimize-images.mjs [--remove-originals]\n`);

  if (!existsSync(PUBLIC_IMAGES)) {
    console.error('❌ public/images directory not found');
    process.exit(1);
  }

  const files = await getFilesRecursive(PUBLIC_IMAGES);
  const imageFiles = files.filter((f) => /\.(jpg|jpeg|png|gif)$/i.test(f));

  console.log(`Found ${imageFiles.length} image files\n`);

  for (const file of imageFiles) {
    await optimizeImage(file);
  }

  console.log('\n📊 Summary:');
  console.log(`   Files processed: ${filesProcessed}`);
  console.log(`   Files skipped: ${filesSkipped}`);
  if (totalOriginalSize > 0) {
    console.log(`   Original size: ${formatSize(totalOriginalSize)}`);
    console.log(`   Optimized size: ${formatSize(totalOptimizedSize)}`);
    const savings = ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) * 100;
    console.log(
      `   Total savings: ${formatSize(totalOriginalSize - totalOptimizedSize)} (${savings.toFixed(0)}%)`
    );
  }
}

main().catch(console.error);
