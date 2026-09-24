import * as React from 'react';
import type { Decorator, Preview } from '@storybook/react-vite';

import './preview.css';

/**
 * Brand and mode are two independent axes, composed on <html>:
 *
 *   <html data-brand="ssb" data-theme="dark">
 *
 * They are toolbar globals rather than per-story args so a reviewer can walk
 * the whole library in one combination and then flip — which is how the ramp
 * defects in this system were actually found. Three of the four accent1
 * versions were reviewed hard in light mode and the one that shipped broken
 * was broken in dark.
 */
/**
 * A docs story with `docs.story.inline: false` (the open overlays: Popover,
 * Tooltip, HoverCard, Menu, Toast) renders in its OWN iframe, whose URL
 * Storybook builds as `iframe.html?id=…&viewMode=story` with no `globals`, and
 * whose channel talks to the docs frame, not the manager. That frame would
 * therefore always start on `initialGlobals` (SST, light) and ignore the
 * toolbar: an SSB docs page with SST popovers. When we are such a frame, read
 * the parent docs preview's globals and follow its updates instead.
 */
type ThemeGlobals = Record<string, unknown>;
type ParentPreviewWindow = Window & {
  __STORYBOOK_PREVIEW__?: { storyStoreValue?: { userGlobals?: { get?: () => ThemeGlobals } } };
  __STORYBOOK_ADDONS_CHANNEL__?: {
    on: (event: string, fn: () => void) => void;
    off: (event: string, fn: () => void) => void;
  };
};

function docsParent(): ParentPreviewWindow | null {
  if (typeof window === 'undefined' || window.parent === window) return null;
  try {
    const parent = window.parent as ParentPreviewWindow;
    return parent.__STORYBOOK_PREVIEW__ ? parent : null;
  } catch {
    return null; // cross-origin parent (a composed Storybook): nothing to follow
  }
}

function useDocsParentGlobals(): ThemeGlobals | null {
  const [globals, setGlobals] = React.useState<ThemeGlobals | null>(
    () => docsParent()?.__STORYBOOK_PREVIEW__?.storyStoreValue?.userGlobals?.get?.() ?? null,
  );
  React.useEffect(() => {
    const parent = docsParent();
    const channel = parent?.__STORYBOOK_ADDONS_CHANNEL__;
    if (!channel) return undefined;
    // The docs frame RECEIVES `updateGlobals` from the manager (its own
    // `globalsUpdated` goes out over the transport and is not heard locally).
    // Re-read the store once it has applied the change.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onUpdate = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const next = parent?.__STORYBOOK_PREVIEW__?.storyStoreValue?.userGlobals?.get?.();
        if (next) setGlobals({ ...next });
      }, 0);
    };
    channel.on('updateGlobals', onUpdate);
    channel.on('globalsUpdated', onUpdate);
    return () => {
      clearTimeout(timer);
      channel.off('updateGlobals', onUpdate);
      channel.off('globalsUpdated', onUpdate);
    };
  }, []);
  return globals;
}

const withBrandAndTheme: Decorator = (Story, context) => {
  const globals = { ...context.globals, ...useDocsParentGlobals() };
  const brand = globals.brand as 'sst' | 'ssb';
  const theme = globals.theme as 'light' | 'dark';
  const pointer = (globals.pointer as 'auto' | 'touch' | undefined) ?? 'auto';
  // Page-level stories (TopNav, a full AppShell) own the page edge and bring
  // their own gutter, so the canvas adds none. Everything else sits on the
  // page gutter: 16px on a phone viewport, 24px from `sm`, like a real page.
  const pageLevel = context.parameters.pageLevel === true;

  // Applied during render as well as in the effect: a child's layout effect
  // runs BEFORE this decorator's effect, so a component that measures itself
  // on mount (Pagination fitting its rail) would otherwise measure mouse
  // styles and then be switched to touch without its size changing.
  if (typeof document !== 'undefined') {
    if (pointer === 'touch') document.documentElement.setAttribute('data-pointer', 'coarse');
    else document.documentElement.removeAttribute('data-pointer');
  }

  React.useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-brand', brand);
    root.setAttribute('data-theme', theme);
    // Touch styles (16px field text, 44px hit areas) follow
    // `(pointer: coarse)`, which resizing the canvas does not change. The
    // Pointer toolbar forces them for review; products never set this.
    if (pointer === 'touch') root.setAttribute('data-pointer', 'coarse');
    else root.removeAttribute('data-pointer');
    return () => {
      root.removeAttribute('data-brand');
      root.removeAttribute('data-theme');
      root.removeAttribute('data-pointer');
    };
  }, [brand, theme, pointer]);

  return (
    <div
      data-brand={brand}
      data-theme={theme}
      style={{
        background: 'var(--surface-page)',
        color: 'var(--content-primary)',
        fontFamily: 'var(--font-family-sans)',
        padding: pageLevel ? 0 : 'var(--space-gutter)',
        minHeight: '100vh',
      }}
    >
      <Story />
    </div>
  );
};

const preview: Preview = {
  decorators: [withBrandAndTheme],
  globalTypes: {
    brand: {
      description: 'Sub-brand',
      toolbar: {
        title: 'Brand',
        icon: 'paintbrush',
        items: [
          { value: 'sst', title: 'SST' },
          { value: 'ssb', title: 'SSB' },
        ],
        dynamicTitle: true,
      },
    },
    theme: {
      description: 'Light or dark',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
    pointer: {
      description: 'Mouse, or force touch styles (hit areas, 16px fields). Pair with a mobile viewport.',
      toolbar: {
        title: 'Pointer',
        icon: 'mobile',
        items: [
          { value: 'auto', title: 'Mouse (device)' },
          { value: 'touch', title: 'Touch' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    brand: 'sst',
    theme: 'light',
    pointer: 'auto',
  },
  parameters: {
    // The page colour comes from `--surface-page`, which follows the toolbar.
    // Storybook's own backgrounds addon would paint over it and quietly make
    // every dark-mode review wrong.
    backgrounds: { disable: true },
    // Device sizes for the built-in Viewport toolbar. Widths sit on the
    // breakpoint tokens' sides: 320 (xs), 375 phone, 768 tablet (below md
    // 1056, so the TopNav drawer shows), 1280 laptop, 1920 wide.
    viewport: {
      options: {
        mobileS: { name: 'Mobile S · 320', styles: { width: '320px', height: '640px' }, type: 'mobile' },
        mobile: { name: 'Mobile · 375', styles: { width: '375px', height: '812px' }, type: 'mobile' },
        mobileLandscape: { name: 'Mobile landscape · 812×375', styles: { width: '812px', height: '375px' }, type: 'mobile' },
        tablet: { name: 'Tablet · 768', styles: { width: '768px', height: '1024px' }, type: 'tablet' },
        desktop: { name: 'Desktop · 1280', styles: { width: '1280px', height: '800px' }, type: 'desktop' },
        wide: { name: 'Wide · 1920', styles: { width: '1920px', height: '1080px' }, type: 'desktop' },
      },
    },
    layout: 'fullscreen',
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
      expanded: true,
    },
    a11y: { test: 'error' },
    options: {
      storySort: {
        order: ['Foundations', 'Atoms', 'Molecules', 'Organisms', 'Layout', 'Pages'],
      },
    },
  },
};

export default preview;
