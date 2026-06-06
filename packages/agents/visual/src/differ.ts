import * as fs from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

export interface DiffResult {
  pixelCount: number;
  percentage: number;
  diffBuffer: Buffer;
  width: number;
  height: number;
}

export function diffImages(baseline: Buffer, current: Buffer): DiffResult {
  const img1 = PNG.sync.read(baseline);
  const img2 = PNG.sync.read(current);

  const { width, height } = img1;
  const diff = new PNG({ width, height });

  const pixelCount = pixelmatch(img1.data, img2.data, diff.data, width, height, {
    threshold: 0.1,
  });

  return {
    pixelCount,
    percentage: (pixelCount / (width * height)) * 100,
    diffBuffer: PNG.sync.write(diff),
    width,
    height,
  };
}

export function saveDiffImage(diffBuffer: Buffer, name: string, diffDir?: string): string {
  const dir = path.resolve(diffDir ?? '.qaforge/visual/diff');
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${name}-diff.png`);
  fs.writeFileSync(filePath, diffBuffer);
  return filePath;
}
