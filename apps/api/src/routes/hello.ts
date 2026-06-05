import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import * as z from 'zod'

export function createHelloRoutes() {
  return new Hono().get(
    '/',
    zValidator(
      'query',
      z.object({
        name: z.string(),
      })
    ),
    c => {
      const { name } = c.req.valid('query')
      return c.json({
        message: `Hello, ${name}`,
      })
    }
  )
}
