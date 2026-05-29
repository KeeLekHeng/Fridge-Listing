import type { FastifyInstance } from 'fastify'
import bcrypt from 'bcrypt'
import { prisma } from '../../lib/prisma'
import { signToken } from '../../lib/jwt'
import { authenticate } from '../../plugins/authenticate'

const COOKIE_NAME = 'auth_token'
const COOKIE_OPTS = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict' as const,
  path: '/',
}

export async function authRoutes(app: FastifyInstance) {
  app.post('/login', {
    config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const { username, password } = request.body as { username?: string; password?: string }

    if (!username || !password) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

    const token = signToken({ userId: user.id, role: user.role })
    reply.setCookie(COOKIE_NAME, token, {
      ...COOKIE_OPTS,
      maxAge: 60 * 60 * 24, // 1 day in seconds
    })

    return reply.status(200).send({ ok: true })
  })

  app.post('/logout', { preHandler: authenticate }, async (_request, reply) => {
    reply.clearCookie(COOKIE_NAME, { path: '/' })
    return reply.status(200).send({ ok: true })
  })

  app.get('/me', { preHandler: authenticate }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user!.userId },
      select: { id: true, username: true, role: true },
    })
    if (!user) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }
    return reply.send(user)
  })
}
