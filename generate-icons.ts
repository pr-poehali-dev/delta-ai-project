import sharp from 'sharp';
import { writeFile } from 'fs/promises';
import { join } from 'path';

const IMAGE_URL = 'https://cdn.poehali.dev/projects/adff2728-217a-4fb9-ab5c-828b17049436/files/6fe05900-96de-4b4a-ab0b-ea60d03dbec9.jpg';

async function generatePWAIcons() {
  try {
    console.log('Fetching image from:', IMAGE_URL);
    
    // Fetch the image
    const response = await fetch(IMAGE_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    console.log('Image fetched successfully');
    
    // Generate 192x192 icon
    console.log('Generating 192x192 icon...');
    const icon192 = await sharp(imageBuffer)
      .resize(192, 192, {
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toBuffer();
    
    await writeFile(join(process.cwd(), 'public', 'icon-192.png'), icon192);
    console.log('✓ Created public/icon-192.png');
    
    // Generate 512x512 icon
    console.log('Generating 512x512 icon...');
    const icon512 = await sharp(imageBuffer)
      .resize(512, 512, {
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toBuffer();
    
    await writeFile(join(process.cwd(), 'public', 'icon-512.png'), icon512);
    console.log('✓ Created public/icon-512.png');
    
    console.log('\n✅ PWA icons generated successfully!');
    console.log('Files created:');
    console.log('  - public/icon-192.png (192x192)');
    console.log('  - public/icon-512.png (512x512)');
  } catch (error) {
    console.error('❌ Error generating PWA icons:', error);
    process.exit(1);
  }
}

generatePWAIcons();
