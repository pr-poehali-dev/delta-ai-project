import type { Plugin } from 'vite';
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const IMAGE_URL = 'https://cdn.poehali.dev/projects/adff2728-217a-4fb9-ab5c-828b17049436/files/6fe05900-96de-4b4a-ab0b-ea60d03dbec9.jpg';

export function generatePWAIcons(): Plugin {
  let generated = false;

  return {
    name: 'generate-pwa-icons',
    
    async buildStart() {
      if (generated) return;
      
      try {
        console.log('\n🎨 Generating PWA icons...');
        
        // Fetch image
        const response = await fetch(IMAGE_URL);
        const arrayBuffer = await response.arrayBuffer();
        const imageBuffer = Buffer.from(arrayBuffer);
        
        const publicDir = join(process.cwd(), 'public');
        mkdirSync(publicDir, { recursive: true });
        
        // Generate 192x192
        const icon192 = await sharp(imageBuffer)
          .resize(192, 192, { fit: 'cover', position: 'center' })
          .png()
          .toBuffer();
        writeFileSync(join(publicDir, 'icon-192.png'), icon192);
        console.log('✅ Created public/icon-192.png');
        
        // Generate 512x512
        const icon512 = await sharp(imageBuffer)
          .resize(512, 512, { fit: 'cover', position: 'center' })
          .png()
          .toBuffer();
        writeFileSync(join(publicDir, 'icon-512.png'), icon512);
        console.log('✅ Created public/icon-512.png');
        
        generated = true;
        console.log('✨ PWA icons generated successfully!\n');
      } catch (error) {
        console.error('❌ Error generating PWA icons:', error);
      }
    }
  };
}

// Standalone execution
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const plugin = generatePWAIcons();
    if (plugin.buildStart) {
      await plugin.buildStart.call({} as any, {} as any);
    }
  })();
}
