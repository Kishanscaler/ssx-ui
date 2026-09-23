/**
 * Launches headless Chromium through playwright-core (a devDependency; it
 * ships no browser of its own).
 *
 * Order: the revision this playwright-core expects, else the newest Chromium
 * already in the Playwright cache (any revision drives fine over CDP for what
 * we do), else an installed Google Chrome. If none exists:
 *   npx playwright-core install chromium-headless-shell
 */
import { existsSync, readdirSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { join } from 'node:path';

import { chromium } from 'playwright-core';

function cacheDir() {
  if (process.env.PLAYWRIGHT_BROWSERS_PATH) return process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (platform() === 'darwin') return join(homedir(), 'Library/Caches/ms-playwright');
  if (platform() === 'win32') return join(homedir(), 'AppData/Local/ms-playwright');
  return join(homedir(), '.cache/ms-playwright');
}

function cachedExecutables() {
  const dir = cacheDir();
  if (!existsSync(dir)) return [];
  const found = [];
  const entries = readdirSync(dir)
    .filter((n) => /^chromium(_headless_shell)?-\d+$/.test(n))
    .sort((a, b) => Number(b.split('-').pop()) - Number(a.split('-').pop()));
  for (const name of entries) {
    const candidates = [
      'chrome-headless-shell-mac-arm64/chrome-headless-shell',
      'chrome-headless-shell-mac-x64/chrome-headless-shell',
      'chrome-headless-shell-linux64/chrome-headless-shell',
      'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
      'chrome-mac/Chromium.app/Contents/MacOS/Chromium',
      'chrome-linux64/chrome',
      'chrome-linux/chrome',
    ];
    for (const rel of candidates) {
      const full = join(dir, name, rel);
      if (existsSync(full)) found.push(full);
    }
  }
  return found;
}

export async function launchBrowser() {
  const preferred = chromium.executablePath();
  const executablePath = existsSync(preferred) ? preferred : cachedExecutables()[0];
  if (executablePath) return chromium.launch({ executablePath, headless: true });
  try {
    return await chromium.launch({ channel: 'chrome', headless: true });
  } catch {
    throw new Error(
      'No Chromium found. Run `npx playwright-core install chromium-headless-shell` in react/.',
    );
  }
}
