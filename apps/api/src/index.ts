import { createApp } from './app'
import { loadEnv } from './config/env'
import { createDb } from './db/client'
import { createAuth } from './lib/auth'

const env = loadEnv()
const db = createDb(env.DATABASE_URL)
export const auth = createAuth(db, env)
const app = createApp(env, db, auth)

const server = Bun.serve({
  port: env.API_PORT,
  fetch: app.fetch,
})

console.log(`Server is running on http://${server.hostname}:${server.port}`)

export type { AppType } from './app'
