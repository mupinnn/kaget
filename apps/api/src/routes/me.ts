import { Hono } from 'hono'
import type { Auth } from '../lib/auth'

export function createMeRoutes(auth: Auth) {
  return new Hono().get('/api/me', async c => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    })

    if (!session) {
      return c.json({ user: null }, 401)
    }

    return c.json({ user: session.user })
  })
}
