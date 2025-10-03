# Icons Directory

Place your heart-pin icon image files here.

## Recommended file structure:

- `heart-pin-icon.png` - Main icon (recommended: 512x512px or 1024x1024px)
- `heart-pin-icon.svg` - Vector version (optional, for crisp scaling)
- `favicon.ico` - Browser favicon (16x16, 32x32, 48x48px)
- `apple-touch-icon.png` - Apple touch icon (180x180px)
- `android-chrome-192x192.png` - Android icon (192x192px)
- `android-chrome-512x512.png` - Android icon (512x512px)

## Usage:

After placing your image files here, update the following files:

1. **app/layout.tsx** - Add favicon metadata
2. **app/page.tsx** - Import and use the icon component
3. **app/dashboard/page.tsx** - Update header logo
4. **components/ui/HeartPinIcon.tsx** - Create component to use your image

## Next Steps:

1. Save your heart-pin image as `heart-pin-icon.png` in this directory
2. Let me know the filename and I'll help you integrate it into the app
