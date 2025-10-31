// Quick script to generate PWA icons
import sharp from 'sharp';
import { writeFileSync } from 'fs';

const IMAGE_URL = 'https://cdn.poehali.dev/projects/adff2728-217a-4fb9-ab5c-828b17049436/files/6fe05900-96de-4b4a-ab0b-ea60d03dbec9.jpg';

console.log('Fetching image...');
const response = await fetch(IMAGE_URL);
const arrayBuffer = await response.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);

console.log('Creating 192x192 icon...');
const icon192 = await sharp(buffer).resize(192, 192, { fit: 'cover' }).png().toBuffer();
writeFileSync('public/icon-192.png', icon192);
console.log('✓ public/icon-192.png');

console.log('Creating 512x512 icon...');
const icon512 = await sharp(buffer).resize(512, 512, { fit: 'cover' }).png().toBuffer();
writeFileSync('public/icon-512.png', icon512);
console.log('✓ public/icon-512.png');

console.log('\n✅ Done! PWA icons created successfully.');
