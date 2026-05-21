import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import { authRoutes } from './routes/admin/auth'
import { listingRoutes } from './routes/listings'

const app = Fastify({ logger: true })

app.register(cookie)

app.get('/health', async () => {
  return { ok: true }
})

app.register(authRoutes, { prefix: '/api/admin' })
app.register(listingRoutes, { prefix: '/api' })

const start = async () => {
  try {
    await app.listen({ port: 3001, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
