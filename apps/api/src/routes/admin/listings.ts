import type { FastifyInstance } from 'fastify'
import type { AdminListingDTO } from '@fridge/shared'
import { CreateListingSchema, UpdateListingSchema, AdminListingQuerySchema } from '@fridge/shared'
import { Prisma } from '../../generated/prisma'
import { prisma } from '../../lib/prisma'
import { authenticate } from '../../plugins/authenticate'

const IMAGE_SELECT = {
  id: true,
  imageUrl: true,
  storageKey: true,
  sortOrder: true,
  createdAt: true,
} satisfies Prisma.ListingImageSelect

const LISTING_SELECT = {
  id: true,
  listingCode: true,
  category: true,
  brand: true,
  condition: true,
  location: true,
  capacityLitres: true,
  buyEnabled: true,
  buyPrice: true,
  rentEnabled: true,
  rentPrice: true,
  depositPrice: true,
  deliveryAvailable: true,
  deliveryPrice: true,
  status: true,
  adminNote: true,
  createdAt: true,
  updatedAt: true,
  images: { select: IMAGE_SELECT, orderBy: { sortOrder: 'asc' as const } },
} satisfies Prisma.ListingSelect

type RawListing = Prisma.ListingGetPayload<{ select: typeof LISTING_SELECT }>

function toDTO(raw: RawListing): AdminListingDTO {
  return {
    id: raw.id,
    listingCode: raw.listingCode,
    category: raw.category,
    brand: raw.brand,
    condition: raw.condition,
    location: raw.location,
    capacityLitres: raw.capacityLitres,
    buyEnabled: raw.buyEnabled,
    buyPrice: raw.buyPrice != null ? Number(raw.buyPrice) : null,
    rentEnabled: raw.rentEnabled,
    rentPrice: Number(raw.rentPrice),
    depositPrice: Number(raw.depositPrice),
    deliveryAvailable: raw.deliveryAvailable,
    deliveryPrice: Number(raw.deliveryPrice),
    status: raw.status,
    adminNote: raw.adminNote,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    images: raw.images,
  }
}

async function createWithCode(data: Omit<Prisma.ListingCreateInput, 'listingCode'>): Promise<RawListing> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const [row] = await prisma.$queryRaw<[{ max_num: number | null }]>`
      SELECT MAX(
        CASE WHEN "listingCode" ~ '^F-[0-9]+$'
        THEN CAST(SUBSTRING("listingCode" FROM 3) AS INTEGER)
        ELSE NULL END
      ) AS max_num FROM "Listing"
    `
    const listingCode = `F-${String((row.max_num ?? 0) + 1).padStart(4, '0')}`
    try {
      return await prisma.listing.create({ data: { ...data, listingCode }, select: LISTING_SELECT })
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') continue
      throw e
    }
  }
  throw new Error('Failed to generate unique listing code')
}

export async function adminListingRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  app.get('/listings', async (request, reply) => {
    const parsed = AdminListingQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      request.log.warn({ errors: parsed.error.flatten() }, 'Validation error')
      return reply.status(400).send({ error: 'Invalid request' })
    }

    const { search, status, location, page, limit } = parsed.data
    const where: Prisma.ListingWhereInput = {
      ...(status !== undefined && { status }),
      ...(location !== undefined && { location }),
      ...(search !== undefined && {
        OR: [
          { listingCode: { contains: search, mode: 'insensitive' } },
          { brand: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    const [total, rows] = await Promise.all([
      prisma.listing.count({ where }),
      prisma.listing.findMany({
        where,
        select: LISTING_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return reply.send({
      data: rows.map(toDTO),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  })

  app.get('/listings/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const listing = await prisma.listing.findUnique({ where: { id }, select: LISTING_SELECT })
    if (!listing) return reply.status(404).send({ error: 'Not found' })
    return reply.send(toDTO(listing))
  })

  app.post('/listings', async (request, reply) => {
    const parsed = CreateListingSchema.safeParse(request.body)
    if (!parsed.success) {
      request.log.warn({ errors: parsed.error.flatten() }, 'Validation error')
      return reply.status(400).send({ error: 'Invalid request' })
    }

    const { adminNote, buyPrice, ...rest } = parsed.data
    const listing = await createWithCode({
      ...rest,
      ...(adminNote !== null && { adminNote }),
      ...(buyPrice !== null && { buyPrice }),
    })

    return reply.status(201).send(toDTO(listing))
  })

  app.patch('/listings/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const rawBody = request.body
    if (typeof rawBody !== 'object' || rawBody === null || Array.isArray(rawBody)) {
      return reply.status(400).send({ error: 'Request body must be a JSON object' })
    }
    const parsed = UpdateListingSchema.safeParse(rawBody)
    if (!parsed.success) {
      request.log.warn({ errors: parsed.error.flatten() }, 'Validation error')
      return reply.status(400).send({ error: 'Invalid request' })
    }

    const existing = await prisma.listing.findUnique({ where: { id }, select: { id: true } })
    if (!existing) return reply.status(404).send({ error: 'Not found' })

    // Only update keys the caller explicitly sent — Zod applies defaults to absent keys,
    // so we intersect with rawBody keys to avoid overwriting fields with their defaults.
    const parsedAny = parsed.data as Record<string, unknown>
    const data = Object.fromEntries(
      Object.keys(rawBody as Record<string, unknown>)
        .filter((k) => k in parsedAny)
        .map((k) => [k, parsedAny[k]]),
    )

    const listing = await prisma.listing.update({
      where: { id },
      data,
      select: LISTING_SELECT,
    })

    return reply.send(toDTO(listing))
  })
}
