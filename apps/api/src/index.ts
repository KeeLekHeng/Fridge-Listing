import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import multipart from '@fastify/multipart'
import { authRoutes } from './routes/admin/auth'
import { adminListingRoutes } from './routes/admin/listings'
import { imageRoutes } from './routes/admin/images'
import { statusRoutes } from './routes/admin/status'
import { listingRoutes } from './routes/listings'

const app = Fastify({ logger: true })

app.register(cookie)
app.register(multipart, { limits: { files: 3, fileSize: 2 * 1024 * 1024 } })

app.get('/health', async () => {
  return { ok: true }
})

app.register(authRoutes, { prefix: '/api/admin' })
app.register(adminListingRoutes, { prefix: '/api/admin' })
app.register(imageRoutes, { prefix: '/api/admin' })
app.register(statusRoutes, { prefix: '/api/admin' })
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
