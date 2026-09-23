/**
 * `npm run check:reflow` — every Storybook story at 320x640 (mouse) and
 * 375x812 (touch styles forced via the Pointer global), failing if the page
 * scrolls sideways (WCAG 1.4.10 reflow). Needs a served Storybook build:
 *   npm run build-storybook && npx http-server storybook-static -p 6201
 * SB=<url> to point elsewhere, ONLY=<regex> to filter story ids.
 * Added after the 2026-09-23 responsive audit (docs/responsive-audit.md).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { launchBrowser } from './lib/browser.mjs';
const base = process.env.SB || 'http://127.0.0.1:6201';
const idx = await (await fetch(base + '/index.json')).json();
const ids = Object.values(idx.entries).filter((e) => e.type === 'story' && (!process.env.ONLY || new RegExp(process.env.ONLY).test(e.id))).map((e) => e.id);
const runs = [
  { w: 320, h: 640, pointer: 'auto' },
  { w: 375, h: 812, pointer: 'touch' },
];
const browser = await launchBrowser();
const bad = [];
let done = 0;
async function worker(queue) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  for (;;) {
    const job = queue.shift();
    if (!job) break;
    const { id, w, h, pointer } = job;
    await page.setViewportSize({ width: w, height: h });
    try {
      await page.goto(`${base}/iframe.html?viewMode=story&id=${id}&globals=brand:sst;theme:light;pointer:${pointer}`, { waitUntil: 'load', timeout: 30000 });
      await page.waitForSelector('#storybook-root > *', { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(350);
      const sw = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
      if (sw > w + 1) bad.push({ id, w, pointer, scrollWidth: sw, over: sw - w });
    } catch (e) {
      bad.push({ id, w, pointer, error: String(e.message).slice(0, 80) });
    }
    done++;
  }
  await ctx.close();
}
const queue = [];
for (const r of runs) for (const id of ids) queue.push({ id, ...r });
const total = queue.length;
await Promise.all(Array.from({ length: 6 }, () => worker(queue)));
await browser.close();
writeFileSync(new URL('../reflow-result.json', import.meta.url), JSON.stringify(bad, null, 1));
console.log(`reflow sweep: ${ids.length} stories x ${runs.length} runs = ${total}; problems: ${bad.length}`);
for (const b of bad.slice(0, 40)) console.log(JSON.stringify(b));
if (bad.length) process.exit(1);
