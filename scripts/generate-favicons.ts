import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const SVG_PATH = path.join(process.cwd(), 'public', 'favicon.svg');
const PUBLIC_DIR = path.join(process.cwd(), 'public');

async function generateFavicons() {
  console.log('Starting favicon generation...');

  // 1. Generate PNGs of different sizes
  const sizes = {
    'favicon-16x16.png': 16,
    'favicon-32x32.png': 32,
    'favicon-48x48.png': 48,
    'apple-touch-icon.png': 180,
    'android-chrome-192x192.png': 192,
    'android-chrome-512x512.png': 512,
  };

  const pngBuffers: Record<number, Buffer> = {};

  for (const [filename, size] of Object.entries(sizes)) {
    const outputPath = path.join(PUBLIC_DIR, filename);
    const buffer = await sharp(SVG_PATH)
      .resize(size, size)
      .png()
      .toBuffer();

    await fs.promises.writeFile(outputPath, buffer);
    console.log(`Generated ${filename} (${size}x${size})`);
    pngBuffers[size] = buffer;
  }

  // 2. Generate favicon.ico combining 16x16, 32x32, and 48x48 PNGs
  const icoSizes = [16, 32, 48];
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type: Icon (1)
  header.writeUInt16LE(icoSizes.length, 4); // Number of images

  const entries: Buffer[] = [];
  const imageBuffers: Buffer[] = [];
  let currentOffset = 6 + icoSizes.length * 16; // Header size + entries size

  for (const size of icoSizes) {
    const pngBuffer = pngBuffers[size];
    if (!pngBuffer) {
      throw new Error(`PNG buffer for size ${size} not found`);
    }

    const entry = Buffer.alloc(16);
    entry.writeUInt8(size, 0); // Width
    entry.writeUInt8(size, 1); // Height
    entry.writeUInt8(0, 2); // Color count (0 for >=8bpp)
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(pngBuffer.length, 8); // Image size in bytes
    entry.writeUInt32LE(currentOffset, 12); // Image offset

    entries.push(entry);
    imageBuffers.push(pngBuffer);
    currentOffset += pngBuffer.length;
  }

  const icoBuffer = Buffer.concat([header, ...entries, ...imageBuffers]);
  const icoPath = path.join(PUBLIC_DIR, 'favicon.ico');
  await fs.promises.writeFile(icoPath, icoBuffer);
  console.log('Generated favicon.ico successfully');

  console.log('Favicon generation completed successfully!');
}

generateFavicons().catch((err) => {
  console.error('Error generating favicons:', err);
  process.exit(1);
});
