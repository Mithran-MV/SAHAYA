import type { NextConfig } from 'next';

// GitHub Pages serves the repo at https://<user>.github.io/<repo>/, so all
// asset paths must be prefixed with the repo name. Local dev keeps a clean root.
const isGhPages = process.env.GH_PAGES === 'true';
const basePath = isGhPages ? '/SAHAYA' : undefined;

const config: NextConfig = {
  output: 'export',
  basePath,
  assetPrefix: basePath,
  images: { unoptimized: true },
  trailingSlash: false,
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath ?? '',
  },
};

export default config;
