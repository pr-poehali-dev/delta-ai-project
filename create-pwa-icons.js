#!/usr/bin/env node
/**
 * PWA Icon Generator for Delta AI
 * 
 * This script downloads the source image and generates
 * 192x192 and 512x512 PNG icons for the Progressive Web App.
 * 
 * Usage:
 *   node create-pwa-icons.js
 *   # or
 *   bun create-pwa-icons.js
 */

import sharp from 'sharp';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG = {
  sourceUrl: 'https://cdn.poehali.dev/projects/adff2728-217a-4fb9-ab5c-828b17049436/files/6fe05900-96de-4b4a-ab0b-ea60d03dbec9.jpg',
  outputDir: join(__dirname, 'public'),
  icons: [
    { size: 192, filename: 'icon-192.png' },
    { size: 512, filename: 'icon-512.png' }
  ]
};

async function generateIcons() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   PWA Icon Generator for Delta AI     ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    // Step 1: Download source image
    console.log(`📥 Downloading source image...`);
    console.log(`   ${CONFIG.sourceUrl}\n`);
    
    const response = await fetch(CONFIG.sourceUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const sourceBuffer = Buffer.from(arrayBuffer);
    const sizeMB = (sourceBuffer.length / 1024 / 1024).toFixed(2);
    console.log(`✅ Downloaded ${sourceBuffer.length} bytes (${sizeMB} MB)\n`);

    // Step 2: Ensure output directory exists
    if (!existsSync(CONFIG.outputDir)) {
      mkdirSync(CONFIG.outputDir, { recursive: true });
      console.log(`📁 Created directory: ${CONFIG.outputDir}\n`);
    }

    // Step 3: Generate icons
    for (const icon of CONFIG.icons) {
      console.log(`🎨 Generating ${icon.size}x${icon.size} icon...`);
      
      const iconBuffer = await sharp(sourceBuffer)
        .resize(icon.size, icon.size, {
          fit: 'cover',
          position: 'center',
          kernel: sharp.kernel.lanczos3
        })
        .png({
          quality: 90,
          compressionLevel: 9,
          adaptiveFiltering: true
        })
        .toBuffer();

      const outputPath = join(CONFIG.outputDir, icon.filename);
      writeFileSync(outputPath, iconBuffer);
      
      const sizeKB = (iconBuffer.length / 1024).toFixed(2);
      console.log(`✅ ${icon.filename} created (${sizeKB} KB)`);
      console.log(`   ${outputPath}\n`);
    }

    // Step 4: Success summary
    console.log('╔════════════════════════════════════════╗');
    console.log('║          ✨ SUCCESS! ✨                ║');
    console.log('╚════════════════════════════════════════╝\n');
    console.log('PWA icons have been generated successfully!\n');
    console.log('Generated files:');
    CONFIG.icons.forEach(icon => {
      console.log(`  ✓ public/${icon.filename} (${icon.size}x${icon.size})`);
    });
    console.log('\nThese icons are referenced in:');
    console.log('  • public/manifest.json');
    console.log('\nYour Progressive Web App is now ready! 🚀\n');

    process.exit(0);

  } catch (error) {
    console.error('\n╔════════════════════════════════════════╗');
    console.error('║            ❌ ERROR ❌                 ║');
    console.error('╚════════════════════════════════════════╝\n');
    console.error('Failed to generate PWA icons:\n');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    console.error('\n');
    process.exit(1);
  }
}

// Run the generator
generateIcons();
