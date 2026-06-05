import { defineConfig } from 'drizzle-kit'
import { loadEnv } from './src/config/env'

export default defineConfig({
  schema: './src/db/schema',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: loadEnv().DATABASE_URL,
  },
})
