import type { NextConfig } from 'next';

const config: NextConfig = {
  // The root has no page of its own; start on the default combination.
  async redirects() {
    return [{ source: '/', destination: '/sst/light', permanent: false }];
  },
};

export default config;
