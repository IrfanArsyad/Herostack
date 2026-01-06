import sharp from "sharp";
import { mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const INPUT_SVG = path.join(process.cwd(), "public/logo.svg");
const OUTPUT_DIR = path.join(process.cwd(), "public/icons");

async function generateIcons() {
  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
  }

  console.log("Generating PWA icons from logo.svg...\n");

  for (const size of SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);

    await sharp(INPUT_SVG)
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`Created: icon-${size}x${size}.png`);
  }

  // Create maskable icon (with padding for safe zone)
  const maskableSize = 512;
  const padding = Math.floor(maskableSize * 0.1); // 10% padding
  const innerSize = maskableSize - (padding * 2);

  const maskablePath = path.join(OUTPUT_DIR, `icon-maskable-${maskableSize}x${maskableSize}.png`);

  // Create maskable icon with background and padding
  await sharp({
    create: {
      width: maskableSize,
      height: maskableSize,
      channels: 4,
      background: { r: 15, g: 23, b: 42, alpha: 1 } // #0f172a
    }
  })
    .composite([
      {
        input: await sharp(INPUT_SVG)
          .resize(innerSize, innerSize)
          .toBuffer(),
        gravity: "center"
      }
    ])
    .png()
    .toFile(maskablePath);

  console.log(`Created: icon-maskable-${maskableSize}x${maskableSize}.png`);

  console.log("\nAll icons generated successfully!");
}

generateIcons().catch(console.error);
