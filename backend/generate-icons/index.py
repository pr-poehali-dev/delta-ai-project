import requests
from PIL import Image
from io import BytesIO
import os

def handler(request):
    """Generate PWA icons from the source image"""
    
    IMAGE_URL = 'https://cdn.poehali.dev/projects/adff2728-217a-4fb9-ab5c-828b17049436/files/6fe05900-96de-4b4a-ab0b-ea60d03dbec9.jpg'
    
    try:
        # Fetch the image
        print(f'Fetching image from: {IMAGE_URL}')
        response = requests.get(IMAGE_URL)
        response.raise_for_status()
        
        # Open image
        img = Image.open(BytesIO(response.content))
        print(f'Image loaded: {img.size}')
        
        # Get the project root directory (3 levels up from backend/generate-icons/)
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
        public_dir = os.path.join(project_root, 'public')
        
        # Ensure public directory exists
        os.makedirs(public_dir, exist_ok=True)
        
        # Generate 192x192 icon
        print('Generating 192x192 icon...')
        icon_192 = img.resize((192, 192), Image.LANCZOS)
        icon_192_path = os.path.join(public_dir, 'icon-192.png')
        icon_192.save(icon_192_path, 'PNG')
        print(f'✓ Created {icon_192_path}')
        
        # Generate 512x512 icon
        print('Generating 512x512 icon...')
        icon_512 = img.resize((512, 512), Image.LANCZOS)
        icon_512_path = os.path.join(public_dir, 'icon-512.png')
        icon_512.save(icon_512_path, 'PNG')
        print(f'✓ Created {icon_512_path}')
        
        return {
            'statusCode': 200,
            'body': {
                'message': 'PWA icons generated successfully',
                'files': [
                    'public/icon-192.png',
                    'public/icon-512.png'
                ]
            }
        }
        
    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'body': {
                'error': str(e)
            }
        }
