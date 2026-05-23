import { prisma } from '../lib/prisma'

export async function findListingByCode(code: string) {
  return prisma.listing.findFirst({
    where: { listingCode: { equals: code, mode: 'insensitive' } },
  })
}

export async function changeListingStatus(
  id: string,
  oldStatus: string,
  newStatus: string,
  performedBy: string,
) {
  const [updated] = await prisma.$transaction([
    prisma.listing.update({ where: { id }, data: { status: newStatus } }),
    prisma.listingActionHistory.create({
      data: { listingId: id, actionType: 'status_change', oldValue: oldStatus, newValue: newStatus, performedBy },
    }),
  ])
  return updated
}

export async function changeListingPrices(
  id: string,
  prices: { buyPrice?: number | null; rentPrice?: number; depositPrice?: number; deliveryPrice?: number },
  performedBy: string,
) {
  const summary = Object.entries(prices)
    .map(([k, v]) => `${k}=${v}`)
    .join(' ')

  const [updated] = await prisma.$transaction([
    prisma.listing.update({ where: { id }, data: prices }),
    prisma.listingActionHistory.create({
      data: { listingId: id, actionType: 'price_update', newValue: summary, performedBy },
    }),
  ])
  return updated
}

export async function changeListingNote(id: string, note: string, performedBy: string) {
  const [updated] = await prisma.$transaction([
    prisma.listing.update({ where: { id }, data: { adminNote: note } }),
    prisma.listingActionHistory.create({
      data: { listingId: id, actionType: 'note_update', newValue: note, performedBy },
    }),
  ])
  return updated
}
