import type { OpenNextConfig } from 'open-next/types/open-next';

const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: 'cloudflare',
      converter: 'edge',
      generateDockerfile: false,
    },
  },
  middleware: {
    external: true,
    override: {
      wrapper: 'cloudflare',
      converter: 'edge',
    },
  },
  imageOptimization: {
    arch: 'x64',
    override: {
      wrapper: 'cloudflare',
    },
  },
};

export default config;
