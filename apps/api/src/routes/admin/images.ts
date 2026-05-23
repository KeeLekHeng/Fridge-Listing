import type { FastifyInstance } from 'fastify'
import { randomUUID } from 'crypto'
import sharp from 'sharp'
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { Prisma } from '../../generated/prisma'
import { prisma } from '../../lib/prisma'
import { authenticate } from '../../plugins/authenticate'
import { s3, BUCKET, PUBLIC_BASE_URL } from '../../lib/s3'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2 MB
const MAX_IMAGES = 3
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const

function detectMimeType(buf: Buffer): string | null {
  if (buf.length < 12) return null
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png'
  // WebP: RIFF????WEBP
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return 'image/webp'
  return null
}

const IMAGE_SELECT = {
  id: true,
  imageUrl: true,
  storageKey: true,
  sortOrder: true,
  createdAt: true,
} satisfies Prisma.ListingImageSelect

export async function imageRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  app.post('/listings/:id/images', async (request, reply) => {
    const { id } = request.params as { id: string }

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { id: true, _count: { select: { images: true } } },
    })
    if (!listing) return reply.status(404).send({ error: 'Not found' })

    const existingCount = listing._count.images
    if (existingCount >= MAX_IMAGES) {
      return reply.status(400).send({ error: `Listing already has ${MAX_IMAGES} images` })
    }

    // Collect all file parts
    const rawFiles: Buffer[] = []
    for await (const part of request.parts()) {
      if (part.type !== 'file') continue
      const chunks: Buffer[] = []
      let size = 0
      for await (const chunk of part.file) {
        size += chunk.length
        if (size > MAX_FILE_SIZE) {
          // Drain the stream before returning
          part.file.resume()
          return reply.status(400).send({ error: 'File too large (max 2 MB)' })
        }
        chunks.push(chunk)
      }
      rawFiles.push(Buffer.concat(chunks))
    }

    if (rawFiles.length === 0) return reply.status(400).send({ error: 'No files provided' })
    if (existingCount + rawFiles.length > MAX_IMAGES) {
      return reply.status(400).send({ error: `Upload would exceed ${MAX_IMAGES}-image limit` })
    }

    // Validate MIME via magic bytes (before any sharp processing)
    for (const buf of rawFiles) {
      const mime = detectMimeType(buf)
      if (!mime || !(ALLOWED_MIMES as readonly string[]).includes(mime)) {
        return reply.status(400).send({ error: 'Unsupported file type (jpeg, png, webp only)' })
      }
    }

    // Process and upload each file
    const created: Prisma.ListingImageCreateManyInput[] = []
    for (let i = 0; i < rawFiles.length; i++) {
      const processed = await sharp(rawFiles[i])
        .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer()

      const storageKey = `listings/${id}/${randomUUID()}.webp`
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: storageKey,
        Body: processed,
        ContentType: 'image/webp',
      }))

      created.push({
        listingId: id,
        imageUrl: `${PUBLIC_BASE_URL}${storageKey}`,
        storageKey,
        sortOrder: existingCount + i,
      })
    }

    await prisma.$transaction([
      prisma.listingImage.createMany({ data: created }),
      prisma.listingActionHistory.create({
        data: {
          listingId: id,
          actionType: 'image_upload',
          newValue: `${rawFiles.length} image${rawFiles.length === 1 ? '' : 's'} uploaded`,
          performedBy: 'admin_web',
        },
      }),
    ])

    const images = await prisma.listingImage.findMany({
      where: { listingId: id },
      select: IMAGE_SELECT,
      orderBy: { sortOrder: 'asc' },
    })

    return reply.send(images)
  })

  app.delete('/listings/:id/images/:imageId', async (request, reply) => {
    const { id, imageId } = request.params as { id: string; imageId: string }

    const image = await prisma.listingImage.findUnique({
      where: { id: imageId, listingId: id },
      select: { id: true, storageKey: true },
    })
    if (!image) return reply.status(404).send({ error: 'Not found' })

    try {
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: image.storageKey }))
    } catch (err) {
      app.log.error({ err, storageKey: image.storageKey }, 'Storage deletion failed')
    }

    await prisma.$transaction([
      prisma.listingImage.delete({ where: { id: imageId } }),
      prisma.listingActionHistory.create({
        data: {
          listingId: id,
          actionType: 'image_delete',
          oldValue: imageId,
          performedBy: 'admin_web',
        },
      }),
    ])

    return reply.status(204).send()
  })
}
