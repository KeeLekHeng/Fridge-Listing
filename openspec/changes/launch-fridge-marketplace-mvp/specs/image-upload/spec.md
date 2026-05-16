## ADDED Requirements

### Requirement: Image upload endpoint accepts up to 3 files as multipart form
`POST /api/admin/listings/:id/images` SHALL accept a `multipart/form-data` request containing up to 3 image files per request.

#### Scenario: Upload of 2 images succeeds
- **WHEN** `POST /api/admin/listings/:id/images` is called with 2 valid image files and a valid JWT
- **THEN** HTTP 200 is returned with the updated image list containing 2 entries

### Requirement: File MIME type is validated server-side
The server SHALL validate that each uploaded file has a MIME type of `image/jpeg`, `image/png`, or `image/webp`. Files with any other MIME type SHALL be rejected with HTTP 400 before any processing occurs.

#### Scenario: PDF file is rejected
- **WHEN** the admin uploads a `.pdf` file
- **THEN** HTTP 400 is returned and no file is written to storage

### Requirement: File size is validated before processing
The server SHALL validate that each uploaded file does not exceed 2 MB. Files exceeding this limit SHALL be rejected with HTTP 400 before any processing begins.

#### Scenario: Oversized file is rejected before processing
- **WHEN** the admin uploads a 3 MB JPEG
- **THEN** HTTP 400 is returned and no sharp processing or storage upload occurs

### Requirement: Three-image limit is enforced before upload
If a listing already has 3 images, the upload SHALL be rejected with HTTP 400 before any file processing or storage write occurs.

#### Scenario: Fourth image is rejected when limit is reached
- **WHEN** a listing already has 3 images and the admin attempts to upload another
- **THEN** HTTP 400 is returned with a message indicating the limit is reached and no file is processed or stored

### Requirement: Images are processed with sharp before storage
Before uploading, the server SHALL process each accepted file using the `sharp` library: resize to a maximum of 1200px on the longest dimension (maintaining aspect ratio) and convert to WebP format at quality 80. The processed WebP output is what gets uploaded — the original file is never stored.

#### Scenario: PNG input is stored as WebP
- **WHEN** the admin uploads a valid PNG file
- **THEN** the file stored in object storage has a `.webp` extension and the `imageUrl` in the response ends in `.webp`

#### Scenario: Large image is resized before storage
- **WHEN** the admin uploads a valid JPEG that is 2400px wide
- **THEN** the stored WebP file is at most 1200px on its longest dimension

### Requirement: Processed files are uploaded to S3-compatible storage
The processed WebP buffer SHALL be uploaded to Supabase Storage using the AWS SDK (`@aws-sdk/client-s3`).

#### Scenario: File appears in storage after upload
- **WHEN** a valid image is uploaded successfully
- **THEN** a corresponding object exists in Supabase Storage at the expected key path

### Requirement: Storage key format is listings/listingId/uuid.webp
The storage key for each image SHALL follow the format: `listings/<listingId>/<uuid>.webp`. The extension SHALL always be `.webp` regardless of the original file format.

#### Scenario: Storage key follows the correct format
- **WHEN** an image is uploaded to listing `F-0001`
- **THEN** the `storageKey` in the database row matches the pattern `listings/<listingId>/<uuid>.webp`

### Requirement: ListingImage row is written after successful upload
After a successful upload, the server SHALL write one `ListingImage` row per file containing `listingId`, `imageUrl`, `storageKey` (the `.webp` key), and `sortOrder` (0-based index in the batch).

#### Scenario: ListingImage row exists after upload
- **WHEN** 2 images are successfully uploaded
- **THEN** 2 `ListingImage` rows exist in the database with correct `imageUrl`, `storageKey`, and `sortOrder` values of 0 and 1

### Requirement: PostgreSQL stores only image URL and storage key — not binary data
PostgreSQL SHALL NOT store image binary data. Only `imageUrl`, `storageKey`, and `sortOrder` SHALL be persisted in the `ListingImage` table.

#### Scenario: ListingImage schema has no binary column
- **WHEN** the Prisma schema is inspected
- **THEN** the `ListingImage` model contains no `Bytes` or `blob` type field

### Requirement: Image deletion removes the file from storage and the database row
`DELETE /api/admin/listings/:id/images/:imageId` SHALL delete the object from Supabase Storage using the `storageKey`, then delete the `ListingImage` database row. If storage deletion fails, the error SHALL be logged and the database row SHALL still be deleted. HTTP 204 SHALL be returned.

#### Scenario: Image deletion frees storage and removes database row
- **WHEN** `DELETE /api/admin/listings/F-0001/images/img-abc` is called with a valid JWT
- **THEN** the object is deleted from Supabase Storage, the `ListingImage` row is deleted, and HTTP 204 is returned

#### Scenario: Database row is deleted even if storage deletion fails
- **WHEN** the Supabase Storage deletion call fails and `DELETE /api/admin/listings/:id/images/:imageId` is called
- **THEN** the error is logged, the `ListingImage` row is still deleted, and HTTP 204 is returned

### Requirement: Image upload endpoint requires authentication
The image upload and delete endpoints SHALL require a valid JWT cookie. Requests without valid auth SHALL return HTTP 401.

#### Scenario: Unauthenticated upload is rejected
- **WHEN** `POST /api/admin/listings/:id/images` is called without an `auth_token` cookie
- **THEN** HTTP 401 is returned

### Requirement: imageUrl is always the public CDN URL
The `imageUrl` stored and returned in responses SHALL always be the public CDN URL constructed from `STORAGE_PUBLIC_BASE_URL/<storageKey>`. Pre-signed URLs or internal storage endpoints SHALL NOT be exposed.

#### Scenario: imageUrl uses the public base URL
- **WHEN** an image is uploaded and the listing is fetched
- **THEN** the `imageUrl` in the response starts with the value of `STORAGE_PUBLIC_BASE_URL`

### Requirement: Storage budget targets 300 KB per processed image
The implementation SHALL target a maximum stored size of approximately 300 KB per processed image. At 3 images per listing and up to 200 listings, total object storage usage SHALL stay well under 200 MB, leaving comfortable headroom within Supabase Storage's free tier (1 GB).

#### Scenario: Processed image is significantly smaller than input
- **WHEN** a 2 MB JPEG is uploaded and processed
- **THEN** the stored WebP file is no larger than 500 KB
