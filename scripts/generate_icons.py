#!/usr/bin/env python3
"""Generate PWA icons from a source image URL"""

import sys
import os

try:
    import requests
    from PIL import Image
    from io import BytesIO
except ImportError:
    print("Installing required packages...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests", "Pillow"])
    import requests
    from PIL import Image
    from io import BytesIO

IMAGE_URL = 'https://cdn.poehali.dev/projects/adff2728-217a-4fb9-ab5c-828b17049436/files/6fe05900-96de-4b4a-ab0b-ea60d03dbec9.jpg'

def generate_icons():
    """Generate 192x192 and 512x512 PWA icons"""
    
    try:
        # Fetch the image
        print(f'Fetching image from: {IMAGE_URL}')
        response = requests.get(IMAGE_URL, timeout=30)
        response.raise_for_status()
        print('✓ Image fetched successfully')
        
        # Open image
        img = Image.open(BytesIO(response.content))
        print(f'✓ Image loaded: {img.size}, mode: {img.mode}')
        
        # Convert to RGB if necessary (for PNG conversion)
        if img.mode in ('RGBA', 'LA', 'P'):
            # Create a white background
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Get the project root directory (one level up from scripts/)
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(script_dir)
        public_dir = os.path.join(project_root, 'public')
        
        # Ensure public directory exists
        os.makedirs(public_dir, exist_ok=True)
        
        # Generate 192x192 icon
        print('\nGenerating 192x192 icon...')
        icon_192 = img.resize((192, 192), Image.LANCZOS)
        icon_192_path = os.path.join(public_dir, 'icon-192.png')
        icon_192.save(icon_192_path, 'PNG', optimize=True)
        file_size_192 = os.path.getsize(icon_192_path)
        print(f'✓ Created: {icon_192_path} ({file_size_192} bytes)')
        
        # Generate 512x512 icon
        print('Generating 512x512 icon...')
        icon_512 = img.resize((512, 512), Image.LANCZOS)
        icon_512_path = os.path.join(public_dir, 'icon-512.png')
        icon_512.save(icon_512_path, 'PNG', optimize=True)
        file_size_512 = os.path.getsize(icon_512_path)
        print(f'✓ Created: {icon_512_path} ({file_size_512} bytes)')
        
        print('\n✅ PWA icons generated successfully!')
        print('\nFiles created:')
        print(f'  - public/icon-192.png (192x192, {file_size_192:,} bytes)')
        print(f'  - public/icon-512.png (512x512, {file_size_512:,} bytes)')
        
        return True
        
    except Exception as e:
        print(f'\n❌ Error generating PWA icons: {str(e)}')
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = generate_icons()
    sys.exit(0 if success else 1)
