import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

// Export the exact vector mark for PWA launchers; no external image or service.
const source = await readFile(
  new URL('../public/brand-mark.svg', import.meta.url),
  'utf8',
);
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
const browser = await chromium.launch(executablePath ? { executablePath } : {});
try {
  for (const [size, name] of [
    [32, 'favicon.png'],
    [192, 'icon-192.png'],
    [512, 'icon-512.png'],
  ]) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
    });
    const svg = source.replace(
      '<svg ',
      `<svg width="${size}" height="${size}" style="display:block" `,
    );
    await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
    await page.screenshot({
      path: new URL(`../public/${name}`, import.meta.url).pathname,
      omitBackground: true,
    });
    await page.close();
  }
} finally {
  await browser.close();
}
