import { Hono } from 'hono'
import type { Env } from './config/env'
import type { Database } from './db/client'
import type { Auth } from './lib/auth'
import { createCorsMiddleware } from './middleware/cors'
import { createHealthRoutes } from './routes/health'
import { createHelloRoutes } from './routes/hello'
import { createMeRoutes } from './routes/me'

export function createApp(env: Env, db: Database, auth: Auth) {
  return new Hono()
    .use('/api/*', createCorsMiddleware(env))
    .route('/', createHealthRoutes(db))
    .route('/', createHelloRoutes())
    .route('/', createMeRoutes(auth))
    .on(['POST', 'GET'], '/api/auth/*', c => auth.handler(c.req.raw))
}

export type AppType = ReturnType<typeof createApp>
