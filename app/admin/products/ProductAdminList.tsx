'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import styles from './products.module.css'
import { formatDateTime } from '@/app/admin/utils'

type ProductImageRow = {
  id: string
  image_url: string | null
  sort_order: number | null
}

type ProductRow = {
  id: string
  name: string | null
  description: string | null
  price_retail: number | string | null
  price_wholesale: number | string | null
  stock: number | null
  image_url: string | null
  active: boolean | null
  created_at: string | null
  product_images?: ProductImageRow[] | null
}

type StockAdjustmentRow = {
  id: string
  product_id: string
  admin_user_id: string | null
  delta: number
  reason: string | null
  created_at: string | null
}

type ProductFormState = {
  name: string
  description: string
  price_retail: string
  price_wholesale: string
  stock: string
  image_url: string
  active: boolean
}

type ProductFilter = 'all' | 'low-stock' | 'out-of-stock' | 'inactive'

const emptyForm: ProductFormState = {
  name: '',
  description: '',
  price_retail: '',
  price_wholesale: '',
  stock: '',
  image_url: '',
  active: true,
}

function toFormState(product: ProductRow): ProductFormState {
  return {
    name: product.name ?? '',
    description: product.description ?? '',
    price_retail:
      product.price_retail === null || product.price_retail === undefined
        ? ''
        : String(product.price_retail),
    price_wholesale:
      product.price_wholesale === null || product.price_wholesale === undefined
        ? ''
        : String(product.price_wholesale),
    stock:
      product.stock === null || product.stock === undefined
        ? ''
        : String(product.stock),
    image_url: product.image_url ?? '',
    active: product.active ?? true,
  }
}

function normalizeMoneyInput(value: string) {
  return value.trim() === '' ? 0 : Number(value)
}

function normalizeStockInput(value: string) {
  return value.trim() === '' ? 0 : Number(value)
}

function formatMoney(value: string | number | null | undefined) {
  const num = Number(value || 0)
  return `$${num.toFixed(2)}`
}

function normalizeFilter(value: string): ProductFilter {
  if (value === 'low-stock') return 'low-stock'
  if (value === 'out-of-stock') return 'out-of-stock'
  if (value === 'inactive') return 'inactive'
  return 'all'
}

function getGalleryImages(product: ProductRow, fallbackImageUrl?: string) {
  const orderedExtras = [...(product.product_images || [])]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((item) => item.image_url)
    .filter((value): value is string => Boolean(value))

  const combined = [fallbackImageUrl ?? product.image_url, ...orderedExtras].filter(
    (value): value is string => Boolean(value)
  )

  return Array.from(new Set(combined))
}

export default function ProductAdminList({
  initialProducts,
  stockAdjustments,
  initialQuery = '',
  initialFilter = 'all',
}: {
  initialProducts: ProductRow[]
  stockAdjustments: StockAdjustmentRow[]
  initialQuery?: string
  initialFilter?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const safeInitialProducts = useMemo(
    () => (Array.isArray(initialProducts) ? initialProducts : []),
    [initialProducts]
  )

  const [products, setProducts] = useState<ProductRow[]>(safeInitialProducts)
  const [adjustments, setAdjustments] = useState<StockAdjustmentRow[]>(
    stockAdjustments || []
  )
  const [query, setQuery] = useState(initialQuery)
  const [filter, setFilter] = useState<ProductFilter>(
    normalizeFilter(initialFilter)
  )
  const [createForm, setCreateForm] = useState<ProductFormState>(emptyForm)
  const [createImage, setCreateImage] = useState<File | null>(null)
  const [createMessage, setCreateMessage] = useState('')
  const [creating, setCreating] = useState(false)
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const nextQuery = searchParams.get('q') || ''
    const nextFilter = normalizeFilter(searchParams.get('filter') || 'all')

    if (nextQuery !== query) setQuery(nextQuery)
    if (nextFilter !== filter) setFilter(nextFilter)
  }, [searchParams, query, filter])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      const trimmedQuery = query.trim()

      if (trimmedQuery) {
        params.set('q', trimmedQuery)
      } else {
        params.delete('q')
      }

      if (filter !== 'all') {
        params.set('filter', filter)
      } else {
        params.delete('filter')
      }

      const next = params.toString()
      const current = searchParams.toString()

      if (next !== current) {
        router.replace(next ? `${pathname}?${next}` : pathname, {
          scroll: false,
        })
      }
    }, 250)

    return () => window.clearTimeout(timer)
  }, [query, filter, pathname, router, searchParams])

  useEffect(() => {
    setCurrentPage(1)
  }, [query, filter, pageSize])

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase()

    return products.filter((product) => {
      const stock = Number(product.stock || 0)
      const gallerySearchText = getGalleryImages(product).join(' ')

      const matchesQuery =
        !q ||
        [
          product.name || '',
          product.description || '',
          product.image_url || '',
          gallerySearchText,
          String(product.price_retail || ''),
          String(product.price_wholesale || ''),
          String(product.stock || ''),
          product.active ? 'active' : 'inactive',
        ]
          .join(' ')
          .toLowerCase()
          .includes(q)

      const matchesFilter =
        filter === 'low-stock'
          ? stock > 0 && stock <= 3
          : filter === 'out-of-stock'
            ? stock <= 0
            : filter === 'inactive'
              ? !product.active
              : true

      return matchesQuery && matchesFilter
    })
  }, [products, query, filter])

  const stats = useMemo(() => {
    const total = products.length
    const active = products.filter((product) => !!product.active).length
    const inactive = products.filter((product) => !product.active).length
    const lowStock = products.filter((product) => {
      const stock = Number(product.stock || 0)
      return stock > 0 && stock <= 5
    }).length
    const outOfStock = products.filter(
      (product) => Number(product.stock || 0) <= 0
    ).length

    return {
      total,
      active,
      inactive,
      lowStock,
      outOfStock,
    }
  }, [products])

  const totalPages = useMemo(() => {
    if (pageSize === -1) return 1
    return Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  }, [filteredProducts.length, pageSize])

  useEffect(() => {
    setCurrentPage((current) => Math.min(current, totalPages))
  }, [totalPages])

  const paginatedProducts = useMemo(() => {
    if (pageSize === -1) return filteredProducts

    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return filteredProducts.slice(start, end)
  }, [filteredProducts, currentPage, pageSize])

  function mergeProductUpdate(updated: ProductRow) {
    setProducts((current) =>
      current.map((product) =>
        product.id === updated.id
          ? {
              ...product,
              ...updated,
              product_images: updated.product_images ?? product.product_images ?? [],
            }
          : product
      )
    )
  }

  async function uploadImage(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/admin/products/upload', {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Image upload failed')
    }

    return String(data.url || '')
  }

  async function handleCreateProduct() {
    setCreating(true)
    setCreateMessage('')

    try {
      const trimmedName = createForm.name.trim()

      if (!trimmedName) {
        setCreateMessage('Product name is required')
        setCreating(false)
        return
      }

      let imageUrl = createForm.image_url.trim()

      if (createImage) {
        imageUrl = await uploadImage(createImage)
      }

      const payload = {
        name: trimmedName,
        description: createForm.description.trim() || null,
        price_retail: normalizeMoneyInput(createForm.price_retail),
        price_wholesale: normalizeMoneyInput(createForm.price_wholesale),
        stock: normalizeStockInput(createForm.stock),
        image_url: imageUrl || null,
        active: createForm.active,
      }

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setCreateMessage(data.error || 'Failed to create product')
        setCreating(false)
        return
      }

      setProducts((current) => [data.product as ProductRow, ...current])
      setCreateForm(emptyForm)
      setCreateImage(null)
      setCreateMessage('Product created')
    } catch (error) {
      setCreateMessage(
        error instanceof Error ? error.message : 'Failed to create product'
      )
    } finally {
      setCreating(false)
    }
  }

  async function handleUpdateProduct(id: string, updates: Partial<ProductRow>) {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })

    const data = await res.json()

    if (!res.ok) {
      alert(data.error || 'Failed to update product')
      return
    }

    mergeProductUpdate(data.product as ProductRow)
  }

  async function handleDeleteProduct(id: string) {
    const confirmed = window.confirm(
      'Delete this product? This cannot be undone.'
    )

    if (!confirmed) return

    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'DELETE',
    })

    const data = await res.json()

    if (!res.ok) {
      alert(data.error || 'Failed to delete product')
      return
    }

    setProducts((current) => current.filter((product) => product.id !== id))
    setAdjustments((current) =>
      current.filter((adjustment) => adjustment.product_id !== id)
    )
  }

  async function handleAddGalleryImage(productId: string, imageUrl: string) {
    const res = await fetch(`/api/admin/products/${productId}/images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Failed to add gallery image')
    }

    mergeProductUpdate(data.product as ProductRow)
  }

  async function handleGalleryAction(
    productId: string,
    imageId: string,
    action: 'set_featured' | 'move_left' | 'move_right'
  ) {
    const res = await fetch(`/api/admin/products/${productId}/images/${imageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Failed to update gallery image')
    }

    mergeProductUpdate(data.product as ProductRow)
  }

  async function handleDeleteGalleryImage(productId: string, imageId: string) {
    const res = await fetch(`/api/admin/products/${productId}/images/${imageId}`, {
      method: 'DELETE',
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete gallery image')
    }

    mergeProductUpdate(data.product as ProductRow)
  }

  function getAdjustmentsForProduct(productId: string) {
    return adjustments.filter((item) => item.product_id === productId).slice(0, 5)
  }

  return (
    <div className={styles.layout}>
      <section className={styles.summaryGrid}>
        <SummaryCard label="Total Products" value={stats.total} />
        <SummaryCard label="Active" value={stats.active} />
        <SummaryCard label="Inactive" value={stats.inactive} />
        <SummaryCard label="Low Stock" value={stats.lowStock} />
        <SummaryCard label="Out of Stock" value={stats.outOfStock} />
      </section>

      <section className={styles.createCard}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionEyebrow}>Admin</p>
            <h2 className={styles.sectionTitle}>Create product</h2>
            <p className={styles.sectionText}>
              Add a new storefront item with image, pricing and stock.
            </p>
          </div>
        </div>

        <div className={styles.createGrid}>
          <div className={styles.createMain}>
            <input
              type="text"
              placeholder="Product name"
              value={createForm.name}
              onChange={(e) =>
                setCreateForm((current) => ({
                  ...current,
                  name: e.target.value,
                }))
              }
              className={styles.input}
            />

            <textarea
              placeholder="Description"
              value={createForm.description}
              onChange={(e) =>
                setCreateForm((current) => ({
                  ...current,
                  description: e.target.value,
                }))
              }
              className={styles.textarea}
            />

            <div className={styles.metricsRow}>
              <input
                type="number"
                step="0.05"
                placeholder="Retail price"
                value={createForm.price_retail}
                onChange={(e) =>
                  setCreateForm((current) => ({
                    ...current,
                    price_retail: e.target.value,
                  }))
                }
                className={styles.input}
              />

              <input
                type="number"
                step="0.05"
                placeholder="Wholesale price"
                value={createForm.price_wholesale}
                onChange={(e) =>
                  setCreateForm((current) => ({
                    ...current,
                    price_wholesale: e.target.value,
                  }))
                }
                className={styles.input}
              />

              <input
                type="number"
                placeholder="Stock"
                value={createForm.stock}
                onChange={(e) =>
                  setCreateForm((current) => ({
                    ...current,
                    stock: e.target.value,
                  }))
                }
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.createSide}>
            <input
              type="text"
              placeholder="Featured image URL (optional)"
              value={createForm.image_url}
              onChange={(e) =>
                setCreateForm((current) => ({
                  ...current,
                  image_url: e.target.value,
                }))
              }
              className={styles.input}
            />

            <label className={styles.filePicker}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null
                  setCreateImage(file)
                }}
                className={styles.hiddenFileInput}
              />
              <span className={styles.filePickerButton}>Choose image</span>
              <span className={styles.filePickerText}>
                {createImage ? createImage.name : 'No file selected'}
              </span>
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={!!createForm.active}
                onChange={(e) =>
                  setCreateForm((current) => ({
                    ...current,
                    active: e.target.checked,
                  }))
                }
              />
              Active product
            </label>

            <button
              type="button"
              onClick={handleCreateProduct}
              disabled={creating}
              className={styles.primaryButton}
            >
              {creating ? 'Creating...' : 'Create product'}
            </button>

            {createMessage ? (
              <div className={styles.message}>{createMessage}</div>
            ) : null}
          </div>
        </div>
      </section>

      <section className={styles.listSection}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionEyebrow}>Manage</p>
            <h2 className={styles.sectionTitle}>Existing products</h2>
            <p className={styles.sectionText}>
              Search, edit pricing, adjust stock, manage gallery images and review stock history.
            </p>
          </div>
        </div>

        <div className={styles.listToolbar}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, description, stock or price..."
            className={styles.input}
          />

          <select
            value={filter}
            onChange={(e) => setFilter(normalizeFilter(e.target.value))}
            className={styles.input}
          >
            <option value="all">All products</option>
            <option value="low-stock">Low stock</option>
            <option value="out-of-stock">Out of stock</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className={styles.paginationBar}>
          <label className={styles.paginationControl}>
            <span>Show</span>
            <select
              value={String(pageSize)}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className={styles.input}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="-1">All</option>
            </select>
          </label>

          <div className={styles.paginationMeta}>
            {filteredProducts.length === 0
              ? 'No results'
              : pageSize === -1
                ? `Showing all ${filteredProducts.length} products`
                : `Page ${currentPage} of ${totalPages} · ${filteredProducts.length} results`}
          </div>

          <div className={styles.paginationActions}>
            <button
              type="button"
              onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
              disabled={pageSize === -1 || currentPage <= 1}
              className={styles.secondaryButton}
            >
              Prev
            </button>

            <button
              type="button"
              onClick={() =>
                setCurrentPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={pageSize === -1 || currentPage >= totalPages}
              className={styles.secondaryButton}
            >
              Next
            </button>
          </div>
        </div>

        <div className={styles.productList}>
          {filteredProducts.length === 0 ? (
            <div className={styles.emptyCard}>No matching products found.</div>
          ) : (
            paginatedProducts.map((product) => (
              <EditableProductCard
                key={product.id}
                product={product}
                productAdjustments={getAdjustmentsForProduct(product.id)}
                onSave={handleUpdateProduct}
                onDelete={handleDeleteProduct}
                onAdjusted={(adjustment) =>
                  setAdjustments((current) => [adjustment, ...current])
                }
                uploadImage={uploadImage}
                onAddGalleryImage={handleAddGalleryImage}
                onGalleryAction={handleGalleryAction}
                onDeleteGalleryImage={handleDeleteGalleryImage}
              />
            ))
          )}
        </div>
      </section>
    </div>
  )
}

function SummaryCard({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className={styles.summaryCard}>
      <div className={styles.summaryLabel}>{label}</div>
      <div className={styles.summaryValue}>{value}</div>
    </div>
  )
}

function EditableProductCard({
  product,
  productAdjustments,
  onSave,
  onDelete,
  onAdjusted,
  uploadImage,
  onAddGalleryImage,
  onGalleryAction,
  onDeleteGalleryImage,
}: {
  product: ProductRow
  productAdjustments: StockAdjustmentRow[]
  onSave: (id: string, updates: Partial<ProductRow>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onAdjusted: (adjustment: StockAdjustmentRow) => void
  uploadImage: (file: File) => Promise<string>
  onAddGalleryImage: (productId: string, imageUrl: string) => Promise<void>
  onGalleryAction: (
    productId: string,
    imageId: string,
    action: 'set_featured' | 'move_left' | 'move_right'
  ) => Promise<void>
  onDeleteGalleryImage: (productId: string, imageId: string) => Promise<void>
}) {
  const [form, setForm] = useState<ProductFormState>(() => toFormState(product))
  const [saving, setSaving] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [galleryUrl, setGalleryUrl] = useState('')
  const [galleryFile, setGalleryFile] = useState<File | null>(null)
  const [galleryBusy, setGalleryBusy] = useState(false)

  useEffect(() => {
    setForm(toFormState(product))
    setActiveImageIndex(0)
  }, [product])

  const stockNumber = Number(form.stock || 0)
  const stockClass =
    stockNumber <= 0
      ? styles.stockBadgeOut
      : stockNumber <= 5
        ? styles.stockBadgeLow
        : styles.stockBadgeIn

  const fallbackImageUrl = form.image_url || product.image_url || undefined

  const galleryImages = useMemo(
    () => getGalleryImages(product, fallbackImageUrl),
    [product, fallbackImageUrl]
  )

  const sortedGalleryRows = useMemo(
    () =>
      [...(product.product_images || [])].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      ),
    [product.product_images]
  )

  const activeImage =
    galleryImages[activeImageIndex] || form.image_url || product.image_url || null

  function goPrevImage() {
    if (galleryImages.length <= 1) return
    setActiveImageIndex((current) =>
      current === 0 ? galleryImages.length - 1 : current - 1
    )
  }

  function goNextImage() {
    if (galleryImages.length <= 1) return
    setActiveImageIndex((current) =>
      current === galleryImages.length - 1 ? 0 : current + 1
    )
  }

  async function handleSave() {
    const trimmedName = form.name.trim()

    if (!trimmedName) {
      alert('Name is required')
      return
    }

    setSaving(true)

    try {
      await onSave(product.id, {
        name: trimmedName,
        description: form.description.trim() || null,
        price_retail: normalizeMoneyInput(form.price_retail),
        price_wholesale: normalizeMoneyInput(form.price_wholesale),
        stock: normalizeStockInput(form.stock),
        image_url: form.image_url.trim() || null,
        active: !!form.active,
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleAddGallery() {
    const trimmedUrl = galleryUrl.trim()

    if (!trimmedUrl && !galleryFile) {
      alert('Choose an image file or paste an image URL')
      return
    }

    setGalleryBusy(true)

    try {
      let finalUrl = trimmedUrl

      if (galleryFile) {
        finalUrl = await uploadImage(galleryFile)
      }

      await onAddGalleryImage(product.id, finalUrl)

      setGalleryUrl('')
      setGalleryFile(null)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to add gallery image')
    } finally {
      setGalleryBusy(false)
    }
  }

  async function handleSetFeatured(imageId: string) {
    setGalleryBusy(true)
    try {
      await onGalleryAction(product.id, imageId, 'set_featured')
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to set featured image')
    } finally {
      setGalleryBusy(false)
    }
  }

  async function handleMove(imageId: string, action: 'move_left' | 'move_right') {
    setGalleryBusy(true)
    try {
      await onGalleryAction(product.id, imageId, action)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to reorder image')
    } finally {
      setGalleryBusy(false)
    }
  }

  async function handleDeleteGallery(imageId: string) {
    const confirmed = window.confirm('Delete this gallery image?')
    if (!confirmed) return

    setGalleryBusy(true)
    try {
      await onDeleteGalleryImage(product.id, imageId)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete gallery image')
    } finally {
      setGalleryBusy(false)
    }
  }

  return (
    <article className={styles.productCard}>
      <div className={styles.productCardTop}>
        <div className={styles.productGallery}>
          <div className={styles.productImageWrap}>
            {activeImage ? (
              <>
                <img
                  src={activeImage}
                  alt={form.name || 'Product image'}
                  className={styles.productImage}
                />

                {galleryImages.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={goPrevImage}
                      className={`${styles.galleryArrow} ${styles.galleryArrowLeft}`}
                      aria-label="Previous image"
                    >
                      ‹
                    </button>

                    <button
                      type="button"
                      onClick={goNextImage}
                      className={`${styles.galleryArrow} ${styles.galleryArrowRight}`}
                      aria-label="Next image"
                    >
                      ›
                    </button>
                  </>
                ) : null}
              </>
            ) : (
              <div className={styles.imagePlaceholder}>No image</div>
            )}
          </div>

          {galleryImages.length > 1 ? (
            <div className={styles.galleryThumbRow}>
              {galleryImages.map((imageUrl, index) => (
                <button
                  key={`${imageUrl}-${index}`}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  className={
                    index === activeImageIndex
                      ? `${styles.galleryThumbButton} ${styles.galleryThumbButtonActive}`
                      : styles.galleryThumbButton
                  }
                  aria-label={`View image ${index + 1}`}
                >
                  <img
                    src={imageUrl}
                    alt={`${form.name || 'Product'} thumbnail ${index + 1}`}
                    className={styles.galleryThumbImage}
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className={styles.productContent}>
          <div className={styles.productHeader}>
            <div className={styles.productHeaderText}>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((current) => ({ ...current, name: e.target.value }))
                }
                className={styles.nameInput}
              />

              <span className={form.active ? styles.activeBadge : styles.inactiveBadge}>
                {form.active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <span className={stockClass}>
              {stockNumber <= 0
                ? 'Out of stock'
                : stockNumber <= 5
                  ? `Low stock · ${stockNumber}`
                  : `In stock · ${stockNumber}`}
            </span>
          </div>

          <div className={styles.metricCards}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Retail</span>
              <input
                type="number"
                step="0.05"
                value={form.price_retail || ''}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    price_retail: e.target.value,
                  }))
                }
                className={styles.metricInput}
              />
              <span className={styles.metricValuePreview}>
                {formatMoney(form.price_retail)}
              </span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Wholesale</span>
              <input
                type="number"
                step="0.05"
                value={form.price_wholesale || ''}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    price_wholesale: e.target.value,
                  }))
                }
                className={styles.metricInput}
              />
              <span className={styles.metricValuePreview}>
                {formatMoney(form.price_wholesale)}
              </span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Stock</span>
              <input
                type="number"
                value={form.stock || ''}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    stock: e.target.value,
                  }))
                }
                className={styles.metricInput}
              />
              <span className={styles.metricValuePreview}>
                {normalizeStockInput(form.stock)}
              </span>
            </div>
          </div>

          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                description: e.target.value,
              }))
            }
            className={styles.textarea}
            placeholder="Description"
          />

          <div className={styles.metaRow}>
            <input
              type="text"
              value={form.image_url}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  image_url: e.target.value,
                }))
              }
              className={styles.input}
              placeholder="Featured image URL"
            />

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={!!form.active}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    active: e.target.checked,
                  }))
                }
              />
              Active
            </label>
          </div>

          <div className={styles.galleryManager}>
            <div className={styles.galleryManagerHeader}>
              <div>
                <div className={styles.galleryManagerTitle}>Gallery management</div>
                <div className={styles.galleryManagerText}>
                  Add, reorder, delete and choose the featured image.
                </div>
              </div>
            </div>

            <div className={styles.galleryAddGrid}>
              <input
                type="text"
                value={galleryUrl}
                onChange={(e) => setGalleryUrl(e.target.value)}
                placeholder="Paste image URL"
                className={styles.input}
              />

              <label className={styles.filePicker}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null
                    setGalleryFile(file)
                  }}
                  className={styles.hiddenFileInput}
                />
                <span className={styles.filePickerButton}>Choose image</span>
                <span className={styles.filePickerText}>
                  {galleryFile ? galleryFile.name : 'No file selected'}
                </span>
              </label>

              <button
                type="button"
                onClick={handleAddGallery}
                disabled={galleryBusy}
                className={styles.primaryButton}
              >
                {galleryBusy ? 'Working...' : 'Add to gallery'}
              </button>
            </div>

            {sortedGalleryRows.length > 0 ? (
              <div className={styles.galleryManageList}>
                {sortedGalleryRows.map((image, index) => {
                  const imageUrl = image.image_url || ''
                  const isFeatured = imageUrl === (product.image_url || '')

                  return (
                    <div key={image.id} className={styles.galleryManageRow}>
                      <div className={styles.galleryManagePreview}>
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={`${form.name || 'Product'} gallery ${index + 1}`}
                            className={styles.galleryManageImage}
                          />
                        ) : (
                          <div className={styles.galleryManagePlaceholder}>No image</div>
                        )}
                      </div>

                      <div className={styles.galleryManageContent}>
                        <div className={styles.galleryManageMeta}>
                          <span
                            className={
                              isFeatured
                                ? styles.featuredBadge
                                : styles.galleryIndexBadge
                            }
                          >
                            {isFeatured ? 'Featured' : `Image ${index + 1}`}
                          </span>
                          <span className={styles.galleryManageUrl}>{imageUrl}</span>
                        </div>

                        <div className={styles.galleryManageActions}>
                          <button
                            type="button"
                            onClick={() => handleSetFeatured(image.id)}
                            disabled={galleryBusy || isFeatured}
                            className={styles.secondaryButton}
                          >
                            Set featured
                          </button>

                          <button
                            type="button"
                            onClick={() => handleMove(image.id, 'move_left')}
                            disabled={galleryBusy || index === 0}
                            className={styles.secondaryButton}
                          >
                            ←
                          </button>

                          <button
                            type="button"
                            onClick={() => handleMove(image.id, 'move_right')}
                            disabled={galleryBusy || index === sortedGalleryRows.length - 1}
                            className={styles.secondaryButton}
                          >
                            →
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteGallery(image.id)}
                            disabled={galleryBusy}
                            className={styles.dangerButton}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className={styles.galleryEmpty}>No gallery images yet.</div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.cardActions}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={styles.primaryButton}
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>

        <button
          type="button"
          onClick={() => onDelete(product.id)}
          className={styles.dangerButton}
        >
          Delete
        </button>
      </div>

      <StockAdjuster
        productId={product.id}
        currentStock={Number(form.stock || 0)}
        onAdjusted={(nextStock, adjustment) => {
          setForm((current) => ({
            ...current,
            stock: String(nextStock),
          }))
          onAdjusted(adjustment)
        }}
      />

      <div className={styles.historyBlock}>
        <h3 className={styles.historyTitle}>Recent stock adjustments</h3>

        {productAdjustments.length === 0 ? (
          <div className={styles.historyEmpty}>No stock history yet.</div>
        ) : (
          <div className={styles.historyList}>
            {productAdjustments.map((item) => (
              <div key={item.id} className={styles.historyRow}>
                <div className={styles.historyDelta}>
                  {item.delta > 0 ? `+${item.delta}` : item.delta}
                </div>
                <div className={styles.historyReason}>{item.reason || '—'}</div>
                <div className={styles.historyDate}>
                  {formatDateTime(item.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

function StockAdjuster({
  productId,
  currentStock,
  onAdjusted,
}: {
  productId: string
  currentStock: number
  onAdjusted: (nextStock: number, adjustment: StockAdjustmentRow) => void
}) {
  const [delta, setDelta] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdjust() {
    const parsed = Number(delta)

    if (!Number.isInteger(parsed) || parsed === 0) {
      alert('Enter a non-zero whole number')
      return
    }

    setSaving(true)

    try {
      const res = await fetch(`/api/admin/products/${productId}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delta: parsed,
          reason,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Failed to adjust stock')
        return
      }

      onAdjusted(Number(data.stock || currentStock), {
        id: crypto.randomUUID(),
        product_id: productId,
        admin_user_id: null,
        delta: parsed,
        reason: reason || null,
        created_at: new Date().toISOString(),
      })

      setDelta('')
      setReason('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.stockAdjustBox}>
      <div className={styles.stockAdjustGrid}>
        <input
          type="number"
          value={delta}
          onChange={(e) => setDelta(e.target.value)}
          placeholder="Stock delta (+5 / -2)"
          className={styles.input}
        />

        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (damage, manual sale, restock)"
          className={styles.input}
        />

        <button
          type="button"
          onClick={handleAdjust}
          disabled={saving}
          className={styles.primaryButton}
        >
          {saving ? 'Updating...' : 'Adjust stock'}
        </button>
      </div>
    </div>
  )
}