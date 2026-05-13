import { defineConfig } from 'vitest/config'
import { cloudflarePool, cloudflareTest } from '@cloudflare/vitest-pool-workers'

export default defineConfig({
  test: {
    include: ['worker/**/*.test.js'],
    globals: true,
  },
  plugins: [
    cloudflarePool({
      wrangler: { configPath: './wrangler.toml' }
    }),
    cloudflareTest(),
  ],
})
