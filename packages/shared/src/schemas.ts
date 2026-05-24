import { z } from 'zod'
import { ACTION_TYPE, LISTING_STATUS, PERFORMED_BY } from './enums'

export const CreateListingSchema = z.object({
  category: z.string().min(1).default('fridge'),
  brand: z.string().min(1),
  condition: z.string().min(1),
  location: z.string().min(1),
  capacityLitres: z.number().int().positive().default(50),
  buyEnabled: z.boolean().default(false),
  buyPrice: z.number().positive().nullable().default(null),
  rentEnabled: z.boolean().default(true),
  rentPrice: z.number().positive().default(70),
  depositPrice: z.number().positive().default(40),
  deliveryAvailable: z.boolean().default(true),
  deliveryPrice: z.number().nonnegative().default(15),
  status: z.enum(LISTING_STATUS).default('available'),
  adminNote: z.string().nullable().default(null),
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
  location: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(6),
})

export const AdminListingQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(LISTING_STATUS).optional(),
  location: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(1000).default(20),
})

export const ActionTypeSchema = z.enum(ACTION_TYPE)
export const PerformedBySchema = z.enum(PERFORMED_BY)
