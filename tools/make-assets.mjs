// Turns the supplied logo (gold on white JPEG) into transparent PNGs, favicons and the social share image.
// Run: npm run assets
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';

const SRC = 'tools/logo-source.jpg';
const OUT = 'src/assets';
mkdirSync(OUT, { recursive: true });

// 1. white background -> alpha. Gold never has a high blue channel, so blue drives the alpha.
const { data, info } = await sharp(SRC).raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;
const rgba = Buffer.alloc(W * H * 4);
const T = 150; // blue <= T => fully opaque
for (let i = 0, o = 0; i < data.length; i += C, o += 4) {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  let a = Math.min(1, Math.max(0, (255 - b) / (255 - T)));
  if (a < 0.04) a = 0;
  const un = (c) => (a === 0 ? 0 : Math.max(0, Math.min(255, Math.round((c - (1 - a) * 255) / a))));
  rgba[o] = un(r); rgba[o + 1] = un(g); rgba[o + 2] = un(b); rgba[o + 3] = Math.round(a * 255);
}
const full = sharp(rgba, { raw: { width: W, height: H, channels: 4 } });
const PNG = { compressionLevel: 9, palette: true, quality: 92, effort: 10 };
await full.clone().png(PNG).toFile(`${OUT}/logo-full.png`);

// 2. crops used by the intro animation + header
const crop = (left, top, width, height) => full.clone().extract({ left, top, width, height });
await crop(440, 0, 720, 580).resize({ width: 560 }).png(PNG).toFile(`${OUT}/logo-emblem.png`);
await crop(0, 630, W, 190).resize({ width: 900 }).png(PNG).toFile(`${OUT}/logo-wordmark.png`);
await crop(0, 0, W, 830).resize({ width: 640 }).png(PNG).toFile(`${OUT}/logo-stacked.png`);

// 3. favicons: emblem on a black rounded tile
const tile = async (size, radius = 0.22) => {
  const pad = Math.round(size * 0.12);
  const emblem = await crop(440, 0, 720, 580).resize({ width: size - pad * 2, height: size - pad * 2, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const r = Math.round(size * radius);
  const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" fill="#0a0806"/></svg>`);
  return sharp(bg).composite([{ input: emblem, left: pad, top: pad }]).png().toBuffer();
};
for (const [name, size, radius] of [['favicon-32.png', 32], ['favicon-48.png', 48], ['apple-touch-icon.png', 180, 0], ['icon-192.png', 192], ['icon-512.png', 512]]) {
  writeFileSync(`${OUT}/${name}`, await tile(size, radius ?? 0.22));
}
// .ico = header + one embedded 48px PNG
const png48 = await tile(48);
const ico = Buffer.alloc(22);
ico.writeUInt16LE(0, 0); ico.writeUInt16LE(1, 2); ico.writeUInt16LE(1, 4);
ico.writeUInt8(48, 6); ico.writeUInt8(48, 7); ico.writeUInt8(0, 8); ico.writeUInt8(0, 9);
ico.writeUInt16LE(1, 10); ico.writeUInt16LE(32, 12); ico.writeUInt32LE(png48.length, 14); ico.writeUInt32LE(22, 18);
writeFileSync(`${OUT}/favicon.ico`, Buffer.concat([ico, png48]));

// 4. social share image 1200x630
const stacked = await crop(0, 0, W, 830).resize({ height: 400 }).png().toBuffer();
const sm = await sharp(stacked).metadata();
const ogBg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><radialGradient id="g" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#241a0c"/><stop offset="1" stop-color="#070504"/></radialGradient></defs><rect width="1200" height="630" fill="url(#g)"/><text x="600" y="560" text-anchor="middle" font-family="Georgia, serif" font-size="30" letter-spacing="10" fill="#d6b25e">PAINT · SIP · SUNSET · CURAÇAO</text></svg>`);
await sharp(ogBg).composite([{ input: stacked, left: Math.round((1200 - sm.width) / 2), top: 70 }]).jpeg({ quality: 88 }).toFile(`${OUT}/og-image.jpg`);

console.log('assets written to', OUT);
