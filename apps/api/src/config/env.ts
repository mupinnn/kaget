import { z } from 'zod'

const envSchema = z.object({
  API_PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform(value => value.split(',').map(origin => origin.trim())),
})

export type Env = z.infer<typeof envSchema>

export function loadEnv(): Env {
  const result = envSchema.safeParse(Bun.env)

  if (!result.success) {
    console.error('Invalid environment variables:', z.prettifyError(result.error))
    process.exit(1)
  }

  return result.data
}
