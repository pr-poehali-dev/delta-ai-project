#!/usr/bin/env node
/**
 * PWA Icon Generator
 * Downloads image and creates 192x192 and 512x512 PNG icons
 */

import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const IMAGE_URL = 'https://cdn.poehali.dev/projects/adff2728-217a-4fb9-ab5c-828b17049436/files/6fe05900-96de-4b4a-ab0b-ea60d03dbec9.jpg';

async function main() {
  try {
    console.log('🚀 PWA Icon Generator for Delta AI\n');
    console.log(`📥 Fetching image from CDN...`);
    
    const response = await fetch(IMAGE_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    console.log(`✅ Image downloaded (${imageBuffer.length} bytes)\n`);
    
    const publicDir = join(__dirname, 'public');
    mkdirSync(publicDir, { recursive: true });
    
    // Generate 192x192 icon
    console.log('🎨 Creating 192x192 icon...');
    const icon192Buffer = await sharp(imageBuffer)
      .resize(192, 192, {
        fit: 'cover',
        position: 'center'
      })
      .png({ quality: 90, compressionLevel: 9 })
      .toBuffer();
    
    const path192 = join(publicDir, 'icon-192.png');
    writeFileSync(path192, icon192Buffer);
    console.log(`✅ Saved: ${path192} (${icon192Buffer.length} bytes)`);
    
    // Generate 512x512 icon
    console.log('🎨 Creating 512x512 icon...');
    const icon512Buffer = await sharp(imageBuffer)
      .resize(512, 512, {
        fit: 'cover',
        position: 'center'
      })
      .png({ quality: 90, compressionLevel: 9 })
      .toBuffer();
    
    const path512 = join(publicDir, 'icon-512.png');
    writeFileSync(path512, icon512Buffer);
    console.log(`✅ Saved: ${path512} (${icon512Buffer.length} bytes)`);
    
    console.log('\n✨ PWA icons generated successfully!');
    console.log('\n📱 Icons are ready for your Progressive Web App:');
    console.log('   • public/icon-192.png (192x192)');
    console.log('   • public/icon-512.png (512x512)');
    console.log('\n💡 These icons are referenced in public/manifest.json');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
