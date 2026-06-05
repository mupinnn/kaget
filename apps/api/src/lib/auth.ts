import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import type { Env } from '../config/env'
import type { Database } from '../db/client'
import * as schema from '../db/schema/index'

export function createAuth(db: Database, env: Env) {
  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema,
    }),
    emailAndPassword: {
      enabled: true,
    },
    trustedOrigins: env.CORS_ORIGINS,
  })
}

export type Auth = ReturnType<typeof createAuth>
