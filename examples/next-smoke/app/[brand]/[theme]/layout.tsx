import type { ReactNode } from 'react';

import '../../globals.css';

const BRANDS = ['sst', 'ssb'] as const;
const THEMES = ['light', 'dark'] as const;

// Only the four combinations exist; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return BRANDS.flatMap((brand) => THEMES.map((theme) => ({ brand, theme })));
}

/**
 * The root layout. Brand and theme are route segments so they can sit on
 * <html>, which is where the token layer reads them (and where portalled atoms
 * must find them). A real site would set them from Storyblok or the host name.
 */
export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ brand: string; theme: string }>;
}) {
  const { brand, theme } = await params;
  return (
    <html lang="en" data-brand={brand} data-theme={theme}>
      <body>{children}</body>
    </html>
  );
}
