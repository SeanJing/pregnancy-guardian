import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['worker/**/*.test.js'],
    pool: '@cloudflare/vitest-pool-workers',
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' }
      }
    }
  }
})
