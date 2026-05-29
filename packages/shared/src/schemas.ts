import { z } from 'zod'
import { ACTION_TYPE, LISTING_STATUS, PERFORMED_BY } from './enums'

export const CreateListingSchema = z.object({
  category: z.string().min(1).max(50).default('fridge'),
  brand: z.string().min(1).max(100),
  condition: z.string().min(1).max(50),
  location: z.string().min(1).max(150).transform(v => v.trim()),
  capacityLitres: z.number().int().positive().max(9999).default(50),
  buyEnabled: z.boolean().default(false),
  buyPrice: z.number().positive().max(999999).nullable().default(null),
  rentEnabled: z.boolean().default(true),
  rentPrice: z.number().positive().max(999999).default(70),
  depositPrice: z.number().positive().max(999999).default(40),
  deliveryAvailable: z.boolean().default(true),
  deliveryPrice: z.number().nonnegative().max(999999).default(15),
  status: z.enum(LISTING_STATUS).default('available'),
  adminNote: z.string().max(2000).nullable().default(null),
})

export const UpdateListingSchema = CreateListingSchema.partial()

export const StatusUpdateSchema = z.object({
  status: z.enum(LISTING_STATUS),
})

export const ActionHistoryQuerySchema = z.object({
  listingId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
})

export const ListingQuerySchema = z.object({
  buyEnabled: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  rentEnabled: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  location: z.string().transform(v => v.split(',').filter(Boolean)).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(6),
})

export const AdminListingQuerySchema = z.object({
  search: z.string().max(100).optional(),
  status: z.enum(LISTING_STATUS).optional(),
  location: z.string().max(150).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(1000).default(20),
})

export const ActionTypeSchema = z.enum(ACTION_TYPE)
export const PerformedBySchema = z.enum(PERFORMED_BY)
