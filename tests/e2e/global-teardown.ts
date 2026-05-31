import { PrismaClient } from '../../apps/api/src/generated/prisma'

const CODES = [
  'E2E-AVL-1',
  'E2E-AVL-2',
  'E2E-AVL-3',
  'E2E-RES-1',
  'E2E-UNV-1',
]

export default async function globalTeardown() {
  const prisma = new PrismaClient()
  try {
    await prisma.listing.deleteMany({
      where: {
        OR: [
          { listingCode: { in: CODES } },
          { brand: 'TestBrand-E2E' },
        ],
      },
    })
    console.log('✓ E2E teardown complete')
  } finally {
    await prisma.$disconnect()
  }
}
