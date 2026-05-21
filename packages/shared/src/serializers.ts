import type { AdminListingDTO, PublicListingDTO } from './types'

export function toPublicListing(listing: AdminListingDTO): PublicListingDTO {
  const { adminNote: _adminNote, ...rest } = listing
  return rest
}

export function toAdminListing(listing: AdminListingDTO): AdminListingDTO {
  return listing
}
