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
export const FIXTURE_IMAGE = path.resolve(__dirname, 'fixtures/test-image.jpg')

// Minimal 1×1 white JPEG generated via System.Drawing — real file for upload tests
const FIXTURE_JPEG_B64 =
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsK' +
  'CwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQU' +
  'FBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDASIA' +
  'AhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9' +
  'AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6' +
  'Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ip' +
  'qrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEB' +
  'AQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdh' +
  'cRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldY' +
  'WVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPE' +
  'xcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9U6KKKAP/2Q=='

export default async function globalSetup() {
  const prisma = new PrismaClient()

  try {
    // Remove any previous E2E test listings (seeded codes + create-test brand)
    await prisma.listing.deleteMany({
      where: {
        OR: [
          { listingCode: { in: Object.values(CODES) } },
          { brand: 'TestBrand-E2E' },
        ],
      },
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

    // Write real JPEG fixture for image-upload E2E test
    fs.mkdirSync(path.dirname(FIXTURE_IMAGE), { recursive: true })
    fs.writeFileSync(FIXTURE_IMAGE, Buffer.from(FIXTURE_JPEG_B64, 'base64'))

    console.log('✓ E2E seed complete')
  } finally {
    await prisma.$disconnect()
  }
}
