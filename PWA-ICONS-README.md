# PWA Icons Generation Guide

## Overview

This guide explains how to generate the required PWA (Progressive Web App) icons for Delta AI from the source image.

## Source Image

- **URL**: `https://cdn.poehali.dev/projects/adff2728-217a-4fb9-ab5c-828b17049436/files/6fe05900-96de-4b4a-ab0b-ea60d03dbec9.jpg`
- **Required Output**: Two PNG icons (192x192 and 512x512 pixels)

## Quick Start

### Option 1: Using Node.js/Bun (Recommended)

```bash
# Using Node.js
node create-pwa-icons.js

# OR using Bun (faster)
bun create-pwa-icons.js
```

### Option 2: Alternative Scripts

If the main script doesn't work, try these alternatives:

```bash
# TypeScript version
bun generate-icons.ts

# ES Module version
node make-icons.mjs

# Another ES Module version
node download-and-convert.mjs

# Python version (requires Pillow and requests)
python scripts/generate_icons.py

# JavaScript version in scripts folder
node scripts/generate-pwa-icons.js
```

## What Gets Generated

After running any of the scripts, you'll have:

```
public/
├── icon-192.png    (192x192 pixels, PNG format)
└── icon-512.png    (512x512 pixels, PNG format)
```

These files are already referenced in `public/manifest.json`:

```json
{
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

## Manual Process

If automatic generation doesn't work, you can create the icons manually:

1. **Download the source image**:
   ```bash
   curl -o source-image.jpg "https://cdn.poehali.dev/projects/adff2728-217a-4fb9-ab5c-828b17049436/files/6fe05900-96de-4b4a-ab0b-ea60d03dbec9.jpg"
   ```

2. **Convert using ImageMagick** (if installed):
   ```bash
   convert source-image.jpg -resize 192x192^ -gravity center -extent 192x192 public/icon-192.png
   convert source-image.jpg -resize 512x512^ -gravity center -extent 512x512 public/icon-512.png
   ```

3. **Or use any image editing software**:
   - Open the source image in Photoshop, GIMP, or online tool
   - Resize to 192x192 and save as `public/icon-192.png`
   - Resize to 512x512 and save as `public/icon-512.png`

## Dependencies

The scripts require:

- **sharp** (Node.js): Already installed as dev dependency
- **Pillow** (Python): `pip install Pillow requests` (for Python script only)

## Troubleshooting

### Script Fails with "Cannot find module 'sharp'"

```bash
bun add -d sharp
# or
npm install --save-dev sharp
```

### Permission Denied

```bash
chmod +x create-pwa-icons.js
./create-pwa-icons.js
```

### Network Issues

If the download fails, try:
1. Check your internet connection
2. Try downloading the image manually first
3. Use a VPN if the URL is blocked

## Available Scripts

All of these scripts do the same thing - choose the one that works best for your environment:

| Script | Runtime | Location |
|--------|---------|----------|
| `create-pwa-icons.js` | Node.js/Bun | Root directory |
| `generate-icons.ts` | Bun/ts-node | Root directory |
| `make-icons.mjs` | Node.js | Root directory |
| `download-and-convert.mjs` | Node.js | Root directory |
| `scripts/generate_icons.py` | Python 3 | scripts/ folder |
| `scripts/generate-pwa-icons.js` | Node.js | scripts/ folder |

## Verification

After generation, verify the files:

```bash
# Check if files exist
ls -lh public/icon-*.png

# Check image dimensions (requires ImageMagick)
identify public/icon-192.png
identify public/icon-512.png
```

Expected output:
```
public/icon-192.png PNG 192x192
public/icon-512.png PNG 512x512
```

## Integration

The generated icons are automatically used by:

1. **PWA Manifest** (`public/manifest.json`)
2. **iOS Web App** (when added to home screen)
3. **Android Web App** (when installed)
4. **Desktop PWA** (when installed on desktop)

## Notes

- Icons use `fit: 'cover'` to maintain aspect ratio and fill the square
- Center-crop is applied to keep the main subject centered
- PNG format is used for best compatibility
- Quality settings are optimized for file size vs. quality

## Support

If you encounter any issues:

1. Check that `sharp` package is installed: `bun pm ls | grep sharp`
2. Verify Node.js version: `node --version` (should be 18+)
3. Try a different script from the list above
4. Fall back to manual creation if scripts fail

---

Generated for **Delta AI** PWA  
Last updated: October 31, 2025
