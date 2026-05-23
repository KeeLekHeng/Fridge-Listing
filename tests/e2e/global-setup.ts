import path from 'path'
import fs from 'fs'
import { PrismaClient } from '../../apps/api/src/generated/prisma'

const CODES = {
  buyRent: 'E2E-AVL-1',
  rentOnly: 'E2E-AVL-2',
  buyOnly: 'E2E-AVL-3',
  reserved: 'E2E-RES-1',
  unavailable: 'E2E-UNV-1',
}

export interface TestData {
  buyRent: { id: string; code: string; brand: string }
  rentOnly: { id: string; code: string; brand: string }
  buyOnly: { id: string; code: string; brand: string }
  reserved: { id: string; code: string; brand: string }
  unavailable: { id: string; code: string; brand: string }
}

const DATA_FILE = path.resolve(__dirname, '.test-data.json')

export default async function globalSetup() {
  const prisma = new PrismaClient()

  try {
    // Remove any previous E2E test listings
    await prisma.listing.deleteMany({
      where: { listingCode: { in: Object.values(CODES) } },
    })

    // Create fresh seed data
    const [buyRent, rentOnly, buyOnly, reserved, unavailable] = await Promise.all([
      prisma.listing.create({
        data: {
          listingCode: CODES.buyRent,
          brand: 'Samsung',
          condition: 'good',
          location: 'Tampines',
          status: 'available',
          buyEnabled: true,
          buyPrice: 150,
          rentEnabled: true,
          rentPrice: 70,
          depositPrice: 40,
          deliveryAvailable: true,
          deliveryPrice: 15,
        },
      }),
      prisma.listing.create({
        data: {
          listingCode: CODES.rentOnly,
          brand: 'LG',
          condition: 'excellent',
          location: 'Jurong West',
          status: 'available',
          buyEnabled: false,
          rentEnabled: true,
          rentPrice: 60,
          depositPrice: 40,
          deliveryAvailable: false,
          deliveryPrice: 15,
        },
      }),
      prisma.listing.create({
        data: {
          listingCode: CODES.buyOnly,
          brand: 'Hitachi',
          condition: 'good',
          location: 'Tampines',
          status: 'available',
          buyEnabled: true,
          buyPrice: 120,
          rentEnabled: false,
          rentPrice: 70,
          depositPrice: 40,
          deliveryAvailable: false,
          deliveryPrice: 15,
        },
      }),
      prisma.listing.create({
        data: {
          listingCode: CODES.reserved,
          brand: 'Toshiba',
          condition: 'good',
          location: 'Tampines',
          status: 'reserved',
          buyEnabled: true,
          buyPrice: 130,
          rentEnabled: true,
          rentPrice: 65,
          depositPrice: 40,
          deliveryAvailable: false,
          deliveryPrice: 15,
        },
      }),
      prisma.listing.create({
        data: {
          listingCode: CODES.unavailable,
          brand: 'Panasonic',
          condition: 'fair',
          location: 'Jurong West',
          status: 'unavailable',
          buyEnabled: false,
          rentEnabled: true,
          rentPrice: 55,
          depositPrice: 40,
          deliveryAvailable: false,
          deliveryPrice: 15,
        },
      }),
    ])

    const testData: TestData = {
      buyRent: { id: buyRent.id, code: buyRent.listingCode, brand: buyRent.brand },
      rentOnly: { id: rentOnly.id, code: rentOnly.listingCode, brand: rentOnly.brand },
      buyOnly: { id: buyOnly.id, code: buyOnly.listingCode, brand: buyOnly.brand },
      reserved: { id: reserved.id, code: reserved.listingCode, brand: reserved.brand },
      unavailable: { id: unavailable.id, code: unavailable.listingCode, brand: unavailable.brand },
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(testData, null, 2))
    console.log('✓ E2E seed complete')
  } finally {
    await prisma.$disconnect()
  }
}
