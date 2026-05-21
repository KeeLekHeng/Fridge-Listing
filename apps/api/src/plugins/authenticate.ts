import type { FastifyReply, FastifyRequest } from 'fastify'
import { verifyToken } from '../lib/jwt'

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const token = request.cookies?.auth_token
  if (!token) {
    return reply.status(401).send({ error: 'Unauthorized' })
  }
  try {
    const payload = verifyToken(token)
    request.user = payload
  } catch {
    return reply.status(401).send({ error: 'Unauthorized' })
  }
}
