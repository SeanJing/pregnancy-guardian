import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers'

export default defineWorkersConfig({
  test: {
    include: ['worker/**/*.test.js'],
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' }
      }
    }
  }
})
