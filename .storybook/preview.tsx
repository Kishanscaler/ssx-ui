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
const withBrandAndTheme: Decorator = (Story, context) => {
  const brand = context.globals.brand as 'sst' | 'ssb';
  const theme = context.globals.theme as 'light' | 'dark';

  React.useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-brand', brand);
    root.setAttribute('data-theme', theme);
    return () => {
      root.removeAttribute('data-brand');
      root.removeAttribute('data-theme');
    };
  }, [brand, theme]);

  return (
    <div
      data-brand={brand}
      data-theme={theme}
      style={{
        background: 'var(--surface-page)',
        color: 'var(--content-primary)',
        fontFamily: 'var(--font-family-sans)',
        padding: 'var(--space-6)',
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
  },
  initialGlobals: {
    brand: 'sst',
    theme: 'light',
  },
  parameters: {
    // The page colour comes from `--surface-page`, which follows the toolbar.
    // Storybook's own backgrounds addon would paint over it and quietly make
    // every dark-mode review wrong.
    backgrounds: { disable: true },
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
