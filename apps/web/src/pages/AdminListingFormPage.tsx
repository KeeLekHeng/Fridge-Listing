import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import type { AdminListingDTO, ListingStatus, ImageDTO } from '@fridge/shared'
import { CreateListingSchema, LISTING_STATUS } from '@fridge/shared'
import { api } from '../lib/api'

const STATUS_LABELS: Record<ListingStatus, string> = {
  available: 'Available',
  reserved: 'Reserved',
  rented: 'Rented',
  sold: 'Sold',
  unavailable: 'Unavailable',
}

interface FormState {
  brand: string
  condition: string
  location: string
  capacityLitres: string
  buyEnabled: boolean
  buyPrice: string
  rentEnabled: boolean
  rentPrice: string
  depositPrice: string
  deliveryAvailable: boolean
  deliveryPrice: string
  status: ListingStatus
  adminNote: string
}

const DEFAULT_FORM: FormState = {
  brand: '',
  condition: '',
  location: '',
  capacityLitres: '50',
  buyEnabled: false,
  buyPrice: '',
  rentEnabled: true,
  rentPrice: '70',
  depositPrice: '40',
  deliveryAvailable: true,
  deliveryPrice: '15',
  status: 'available',
  adminNote: '',
}

function listingToForm(l: AdminListingDTO): FormState {
  return {
    brand: l.brand,
    condition: l.condition,
    location: l.location,
    capacityLitres: String(l.capacityLitres),
    buyEnabled: l.buyEnabled,
    buyPrice: l.buyPrice != null ? String(l.buyPrice) : '',
    rentEnabled: l.rentEnabled,
    rentPrice: String(l.rentPrice),
    depositPrice: String(l.depositPrice),
    deliveryAvailable: l.deliveryAvailable,
    deliveryPrice: String(l.deliveryPrice),
    status: l.status as ListingStatus,
    adminNote: l.adminNote ?? '',
  }
}

function safeFloat(value: string, fallback: number): number {
  const n = parseFloat(value)
  return isNaN(n) ? fallback : n
}

function parseForm(state: FormState) {
  return {
    category: 'fridge',
    brand: state.brand,
    condition: state.condition,
    location: state.location,
    capacityLitres: parseInt(state.capacityLitres, 10) || 50,
    buyEnabled: state.buyEnabled,
    buyPrice: state.buyEnabled && state.buyPrice !== '' ? parseFloat(state.buyPrice) : null,
    rentEnabled: state.rentEnabled,
    rentPrice: safeFloat(state.rentPrice, 70),
    depositPrice: safeFloat(state.depositPrice, 40),
    deliveryAvailable: state.deliveryAvailable,
    deliveryPrice: safeFloat(state.deliveryPrice, 15),
    status: state.status,
    adminNote: state.adminNote !== '' ? state.adminNote : null,
  }
}

type FieldErrors = Record<string, string[]>

export function AdminListingFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [images, setImages] = useState<ImageDTO[]>([])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!id) return
    api.admin.listings.get(id)
      .then(l => {
        setForm(listingToForm(l))
        setImages(l.images.slice().sort((a, b) => a.sortOrder - b.sortOrder))
      })
      .finally(() => setLoading(false))
  }, [id])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
    setFieldErrors(prev => ({ ...prev, [key]: [] }))
  }

  async function handleDeleteImage(imageId: string) {
    if (!id) return
    setDeletingId(imageId)
    try {
      await api.admin.listings.deleteImage(id, imageId)
      setImages(prev => prev.filter(img => img.id !== imageId))
    } catch {
      setSubmitError('Failed to delete image')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    e.target.value = ''

    const totalAfter = images.length + (isEdit ? 0 : pendingFiles.length) + files.length
    if (totalAfter > 3) {
      setSubmitError('Maximum 3 images allowed')
      return
    }

    if (isEdit && id) {
      for (let i = 0; i < files.length; i++) {
        setUploadingIdx(i)
        try {
          const updated = await api.admin.listings.uploadImage(id, files[i])
          setImages(updated.slice().sort((a, b) => a.sortOrder - b.sortOrder))
        } catch {
          setSubmitError('Failed to upload image')
          break
        }
      }
      setUploadingIdx(null)
    } else {
      setPendingFiles(prev => [...prev, ...files].slice(0, 3 - images.length))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    const parsed = CreateListingSchema.safeParse(parseForm(form))
    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors as FieldErrors)
      return
    }

    setSaving(true)
    try {
      if (isEdit && id) {
        await api.admin.listings.update(id, parsed.data)
        navigate('/manage', { replace: true })
      } else {
        const created = await api.admin.listings.create(parsed.data)
        // Upload pending files; on failure navigate to edit so retry is a PATCH not a second POST
        let uploadFailed = false
        for (let i = 0; i < pendingFiles.length; i++) {
          setUploadingIdx(i)
          try {
            await api.admin.listings.uploadImage(created.id, pendingFiles[i])
          } catch {
            uploadFailed = true
            setUploadingIdx(null)
            break
          }
        }
        setUploadingIdx(null)
        if (uploadFailed) {
          navigate(`/manage/listings/${created.id}/edit`, { replace: true })
        } else {
          navigate('/manage', { replace: true })
        }
      }
    } catch {
      setSubmitError('Save failed — please try again')
    } finally {
      setSaving(false)
    }
  }

  const totalImages = images.length + (isEdit ? 0 : pendingFiles.length)
  const canAddMore = totalImages < 3

  if (loading) return <FormSkeleton />

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-line px-5 h-14 flex items-center gap-3">
        <Link
          to="/manage"
          className="text-ink-3 text-[13px] hover:text-ink transition-colors"
        >
          ← Dashboard
        </Link>
        <span className="text-ink-5">/</span>
        <h1 className="text-[15px] font-semibold text-ink tracking-[-0.01em]">
          {isEdit ? 'Edit listing' : 'Create listing'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-[680px] mx-auto px-5 py-6 flex flex-col gap-6">
        {submitError && (
          <div role="alert" className="px-4 py-3 rounded-input bg-red-50 border border-red-200 text-red-700 text-[13px]">
            {submitError}
          </div>
        )}

        {/* Read-only listing code (edit only) */}
        {isEdit && id && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-input bg-surface border border-line">
            <span className="text-[12px] text-ink-3 font-medium w-24 shrink-0">Listing code</span>
            <span className="text-[13px] font-mono text-ink-3">
              {form.brand ? `(edit: ${id})` : id}
            </span>
          </div>
        )}

        {/* Core fields */}
        <Section title="Details">
          <Field label="Brand" error={fieldErrors.brand?.[0]}>
            <input
              type="text"
              value={form.brand}
              onChange={e => set('brand', e.target.value)}
              placeholder="e.g. Panasonic"
              className={inputCls(!!fieldErrors.brand?.[0])}
            />
          </Field>
          <Field label="Condition" error={fieldErrors.condition?.[0]}>
            <input
              type="text"
              value={form.condition}
              onChange={e => set('condition', e.target.value)}
              placeholder="e.g. Like new"
              list="condition-options"
              className={inputCls(!!fieldErrors.condition?.[0])}
            />
            <datalist id="condition-options">
              <option value="Brand new" />
              <option value="Like new" />
              <option value="Good" />
              <option value="Fair" />
            </datalist>
          </Field>
          <Field label="Location" error={fieldErrors.location?.[0]}>
            <input
              type="text"
              value={form.location}
              onChange={e => set('location', e.target.value)}
              placeholder="e.g. Eusoff Hall"
              className={inputCls(!!fieldErrors.location?.[0])}
            />
          </Field>
          <Field label="Capacity (litres)" error={fieldErrors.capacityLitres?.[0]}>
            <input
              type="number"
              min="1"
              step="1"
              value={form.capacityLitres}
              onChange={e => set('capacityLitres', e.target.value)}
              className={inputCls(!!fieldErrors.capacityLitres?.[0])}
            />
          </Field>
          <Field label="Status" error={fieldErrors.status?.[0]}>
            <select
              value={form.status}
              onChange={e => set('status', e.target.value as ListingStatus)}
              className={inputCls(!!fieldErrors.status?.[0])}
            >
              {LISTING_STATUS.map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </Field>
          <Field label="Admin note" error={fieldErrors.adminNote?.[0]}>
            <textarea
              value={form.adminNote}
              onChange={e => set('adminNote', e.target.value)}
              placeholder="Internal note (not shown to buyers)"
              rows={2}
              className={inputCls(false) + ' resize-none'}
            />
          </Field>
        </Section>

        {/* Pricing */}
        <Section title="Pricing">
          {/* Buy */}
          <div className="flex items-center gap-3 py-1">
            <input
              id="buyEnabled"
              type="checkbox"
              checked={form.buyEnabled}
              onChange={e => set('buyEnabled', e.target.checked)}
              className="w-4 h-4 rounded accent-ink"
            />
            <label htmlFor="buyEnabled" className="text-[14px] text-ink font-medium cursor-pointer">
              Buy enabled
            </label>
          </div>
          {form.buyEnabled && (
            <Field label="Buy price ($)" error={fieldErrors.buyPrice?.[0]}>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.buyPrice}
                onChange={e => set('buyPrice', e.target.value)}
                placeholder="e.g. 200"
                className={inputCls(!!fieldErrors.buyPrice?.[0])}
              />
            </Field>
          )}

          {/* Rent */}
          <div className="flex items-center gap-3 py-1 mt-2">
            <input
              id="rentEnabled"
              type="checkbox"
              checked={form.rentEnabled}
              onChange={e => set('rentEnabled', e.target.checked)}
              className="w-4 h-4 rounded accent-ink"
            />
            <label htmlFor="rentEnabled" className="text-[14px] text-ink font-medium cursor-pointer">
              Rent enabled
            </label>
          </div>
          {form.rentEnabled && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Rent price ($/sem)" error={fieldErrors.rentPrice?.[0]}>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.rentPrice}
                  onChange={e => set('rentPrice', e.target.value)}
                  className={inputCls(!!fieldErrors.rentPrice?.[0])}
                />
              </Field>
              <Field label="Deposit ($)" error={fieldErrors.depositPrice?.[0]}>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.depositPrice}
                  onChange={e => set('depositPrice', e.target.value)}
                  className={inputCls(!!fieldErrors.depositPrice?.[0])}
                />
              </Field>
            </div>
          )}

          {/* Delivery */}
          <div className="flex items-center gap-3 py-1 mt-2">
            <input
              id="deliveryAvailable"
              type="checkbox"
              checked={form.deliveryAvailable}
              onChange={e => set('deliveryAvailable', e.target.checked)}
              className="w-4 h-4 rounded accent-ink"
            />
            <label htmlFor="deliveryAvailable" className="text-[14px] text-ink font-medium cursor-pointer">
              Delivery available
            </label>
          </div>
          {form.deliveryAvailable && (
            <Field label="Delivery price ($)" error={fieldErrors.deliveryPrice?.[0]}>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.deliveryPrice}
                onChange={e => set('deliveryPrice', e.target.value)}
                className={inputCls(!!fieldErrors.deliveryPrice?.[0])}
              />
            </Field>
          )}
        </Section>

        {/* Images */}
        <Section title="Images">
          <p className="text-[12px] text-ink-3 -mt-1 mb-2">{totalImages}/3 images</p>

          {/* Existing images */}
          {images.length > 0 && (
            <div className="flex gap-3 flex-wrap mb-3">
              {images.map(img => (
                <div key={img.id} className="relative w-[88px] h-[88px] rounded-[10px] overflow-hidden bg-surface border border-line">
                  <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(img.id)}
                    disabled={deletingId === img.id}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity text-white text-[11px] font-medium disabled:opacity-100"
                  >
                    {deletingId === img.id ? '…' : 'Delete'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Pending files (create mode) */}
          {!isEdit && pendingFiles.length > 0 && (
            <div className="flex gap-3 flex-wrap mb-3">
              {pendingFiles.map((f, i) => (
                <div key={i} className="relative w-[88px] h-[88px] rounded-[10px] overflow-hidden bg-surface border border-line">
                  <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPendingFiles(prev => prev.filter((_, j) => j !== i))}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity text-white text-[11px] font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!canAddMore || uploadingIdx !== null}
            className="px-4 py-2 rounded-input border border-dashed border-line-strong text-[13px] text-ink-3 hover:text-ink hover:border-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {uploadingIdx !== null ? 'Uploading…' : canAddMore ? '+ Add photo' : 'Limit reached (3/3)'}
          </button>
        </Section>

        {/* Submit */}
        <div className="flex items-center gap-3 pb-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-btn bg-ink text-white text-[14px] font-semibold disabled:opacity-60 transition-opacity"
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create listing'}
          </button>
          <Link
            to="/manage"
            className="px-6 py-3 rounded-btn border border-line text-[14px] text-ink-3 hover:text-ink transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-card border border-line p-5 flex flex-col gap-3">
      <h2 className="text-[14px] font-semibold text-ink tracking-[-0.01em] border-b border-line pb-2 -mx-5 px-5">
        {title}
      </h2>
      {children}
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[12.5px] font-medium text-ink-3">{label}</label>
      {children}
      {error && <p className="text-[12px] text-red-500">{error}</p>}
    </div>
  )
}

function inputCls(hasError: boolean) {
  return [
    'w-full px-3 py-2 rounded-input border bg-white text-[13.5px] text-ink',
    'placeholder:text-ink-4 focus:outline-none focus:ring-2 focus:ring-accent',
    hasError ? 'border-red-400' : 'border-line',
  ].join(' ')
}

function FormSkeleton() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="sticky top-0 z-30 bg-white border-b border-line h-14" />
      <div className="max-w-[680px] mx-auto px-5 py-6 animate-pulse flex flex-col gap-4">
        <div className="h-40 bg-white rounded-card border border-line" />
        <div className="h-64 bg-white rounded-card border border-line" />
        <div className="h-28 bg-white rounded-card border border-line" />
      </div>
    </div>
  )
}
