export interface ImageDTO {
  id: string
  imageUrl: string
  storageKey: string
  sortOrder: number
  createdAt: string | Date
}

export interface AdminListingDTO {
  id: string
  listingCode: string
  category: string
  brand: string
  condition: string
  location: string
  capacityLitres: number
  buyEnabled: boolean
  buyPrice: number | null
  rentEnabled: boolean
  rentPrice: number
  depositPrice: number
  deliveryAvailable: boolean
  deliveryPrice: number
  status: string
  adminNote: string | null
  createdAt: string | Date
  updatedAt: string | Date
  images: ImageDTO[]
}

export type PublicListingDTO = Omit<AdminListingDTO, 'adminNote'>
