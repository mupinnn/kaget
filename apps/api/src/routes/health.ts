import { sql } from 'drizzle-orm'
import { Hono } from 'hono'
import type { Database } from '../db/client'

export function createHealthRoutes(db: Database) {
  return new Hono().get('/api/health', async c => {
    try {
      await db.execute(sql`SELECT 1`)
      return c.json({ status: 'ok', db: 'connected' })
    } catch {
      return c.json({ status: 'degraded', db: 'disconnected' }, 503)
    }
  })
}
