import type { FastifyInstance } from 'fastify'
import { StatusUpdateSchema, ActionHistoryQuerySchema } from '@fridge/shared'
import { prisma } from '../../lib/prisma'
import { authenticate } from '../../plugins/authenticate'
import { changeListingStatus } from '../../services/listing'

export async function statusRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  app.patch('/listings/:id/status', async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = StatusUpdateSchema.safeParse(request.body)
    if (!parsed.success) {
      request.log.warn({ errors: parsed.error.flatten() }, 'Validation error')
      return reply.status(400).send({ error: 'Invalid request' })
    }

    const { status } = parsed.data

    const existing = await prisma.listing.findUnique({
      where: { id },
      select: { id: true, status: true },
    })
    if (!existing) return reply.status(404).send({ error: 'Not found' })

    const updated = await changeListingStatus(id, existing.status, status, 'admin_web')

    return reply.send({ id: updated.id, status: updated.status })
  })

  app.get('/action-history', async (request, reply) => {
    const parsed = ActionHistoryQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      request.log.warn({ errors: parsed.error.flatten() }, 'Validation error')
      return reply.status(400).send({ error: 'Invalid request' })
    }

    const { listingId, page, limit } = parsed.data
    const where = listingId ? { listingId } : {}

    const [total, rows] = await Promise.all([
      prisma.listingActionHistory.count({ where }),
      prisma.listingActionHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return reply.send({
      data: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  })
}
