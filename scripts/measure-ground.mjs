import fs from 'node:fs';

const cfg = fs.readFileSync(new URL('../src/game/config.ts', import.meta.url), 'utf8');
const num = (name) => {
  const match = cfg.match(new RegExp(`export const ${name} = (\\d+)`));
  if (!match) throw new Error(`missing ${name}`);
  return Number(match[1]);
};

const tile = num('TILE');
const width = num('MAP_PX_W');
const height = num('MAP_PX_H');
const columns = width / tile;
const rows = height / tile;
const tiles = columns * rows;

if (width !== 2352 || height !== 1008 || tile !== 16 || columns !== 147 || rows !== 63 || tiles !== 9261) {
  throw new Error(`outdoor size mismatch ${width}x${height} ${columns}x${rows} tiles=${tiles}`);
}

const slices = [
  { x: 0, w: 64, h: 63 },
  { x: 64, w: 64, h: 63 },
  { x: 128, w: 19, h: 63 },
];
if (slices.reduce((sum, slice) => sum + slice.w, 0) !== columns) {
  throw new Error('level slices do not cover 147 columns');
}

const buffer = new Uint8ClampedArray(width * height * 4);
const started = performance.now();
for (let y = 0; y < rows; y++) {
  for (let x = 0; x < columns; x++) {
    const color = (x + y) % 2 === 0 ? 70 : 90;
    for (let py = 0; py < tile; py++) {
      for (let px = 0; px < tile; px++) {
        const index = ((y * tile + py) * width + (x * tile + px)) * 4;
        buffer[index] = color;
        buffer[index + 1] = 140;
        buffer[index + 2] = 80;
        buffer[index + 3] = 255;
      }
    }
  }
}
const fillMs = performance.now() - started;
console.log(
  JSON.stringify({
    width,
    height,
    columns,
    rows,
    tiles,
    slices,
    bytes: buffer.length,
    fillMs: Number(fillMs.toFixed(2)),
  }),
);
