import { defineConfig } from 'vitest/config'
import { cloudflarePool } from '@cloudflare/vitest-pool-workers'

export default defineConfig({
  plugins: [
    cloudflarePool({
      configPath: './wrangler.toml'
    }),
  ],
  test: {
    include: ['worker/**/*.test.js'],
  },
})
