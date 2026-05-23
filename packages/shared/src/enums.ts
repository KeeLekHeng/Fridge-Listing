export const LISTING_STATUS = ['available', 'reserved', 'rented', 'sold', 'unavailable'] as const
export type ListingStatus = (typeof LISTING_STATUS)[number]

export const ACTION_TYPE = ['status_change', 'price_update', 'note_update', 'image_upload', 'image_delete'] as const
export type ActionType = (typeof ACTION_TYPE)[number]

export const PERFORMED_BY = ['admin_web', 'telegram_bot'] as const
export type PerformedBy = (typeof PERFORMED_BY)[number]
