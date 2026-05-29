import type { FastifyInstance } from 'fastify'
import type { PublicListingDTO } from '@fridge/shared'
import { ListingQuerySchema } from '@fridge/shared'
import { Prisma } from '../generated/prisma'
import { prisma } from '../lib/prisma'

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
  createdAt: true,
  updatedAt: true,
  images: { select: IMAGE_SELECT, orderBy: { sortOrder: 'asc' as const } },
} satisfies Prisma.ListingSelect

type RawListing = Prisma.ListingGetPayload<{ select: typeof LISTING_SELECT }>

function toDTO(raw: RawListing): PublicListingDTO {
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
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    images: raw.images,
  }
}

export async function listingRoutes(app: FastifyInstance) {
  app.get('/listings', async (request, reply) => {
    const parsed = ListingQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      request.log.warn({ errors: parsed.error.flatten() }, 'Validation error')
      return reply.status(400).send({ error: 'Invalid request' })
    }

    const { buyEnabled, rentEnabled, location, page, limit } = parsed.data
    const where: Prisma.ListingWhereInput = {
      status: 'available',
      ...(buyEnabled !== undefined && { buyEnabled }),
      ...(rentEnabled !== undefined && { rentEnabled }),
      ...(location && location.length > 0 && { location: { in: location } }),
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

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: LISTING_SELECT,
    })

    if (!listing || listing.status !== 'available') {
      return reply.status(404).send({ error: 'Not found' })
    }

    return reply.send(toDTO(listing))
  })

  app.get('/listings/:id/recommendations', async (request, reply) => {
    const { id } = request.params as { id: string }

    const current = await prisma.listing.findUnique({
      where: { id, status: 'available' },
      select: { id: true, location: true, rentPrice: true, buyPrice: true },
    })

    if (!current) return reply.status(404).send({ error: 'Not found' })

    const available = await prisma.listing.findMany({
      where: { status: 'available', id: { not: id } },
      select: LISTING_SELECT,
    })

    const refPrice = current.buyPrice != null ? Number(current.buyPrice) : Number(current.rentPrice)

    const sorted = available
      .map((l) => {
        const price = l.buyPrice != null ? Number(l.buyPrice) : Number(l.rentPrice)
        return { listing: l, sameLocation: l.location === current.location, priceDiff: Math.abs(price - refPrice) }
      })
      .sort((a, b) => {
        if (a.sameLocation !== b.sameLocation) return a.sameLocation ? -1 : 1
        return a.priceDiff - b.priceDiff
      })
      .slice(0, 4)
      .map(({ listing }) => toDTO(listing))

    return reply.send(sorted)
  })
}
