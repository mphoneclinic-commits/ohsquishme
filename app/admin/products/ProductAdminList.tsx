'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import styles from './products.module.css'

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

function formatDateTime(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function normalizeFilter(value: string): ProductFilter {
  if (value === 'low-stock') return 'low-stock'
  if (value === 'out-of-stock') return 'out-of-stock'
  if (value === 'inactive') return 'inactive'
  return 'all'
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
  const [adjustments, setAdjustments] =
    useState<StockAdjustmentRow[]>(stockAdjustments || [])
  const [query, setQuery] = useState(initialQuery)
  const [filter, setFilter] = useState<ProductFilter>(normalizeFilter(initialFilter))
  const [createForm, setCreateForm] = useState<ProductFormState>(emptyForm)
  const [createImage, setCreateImage] = useState<File | null>(null)
  const [createMessage, setCreateMessage] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const nextQuery = searchParams.get('q') || ''
    const nextFilter = normalizeFilter(searchParams.get('filter') || 'all')

    if (nextQuery !== query) {
      setQuery(nextQuery)
    }

    if (nextFilter !== filter) {
      setFilter(nextFilter)
    }
  }, [searchParams])

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

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase()

    return products.filter((product) => {
      const stock = Number(product.stock || 0)
      const matchesQuery =
        !q ||
        [
          product.name || '',
          product.description || '',
          product.image_url || '',
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

  async function handleUpdateProduct(
    id: string,
    updates: Partial<ProductRow>
  ) {
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

    setProducts((current) =>
      current.map((product) =>
        product.id === id ? (data.product as ProductRow) : product
      )
    )
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
              placeholder="Image URL (optional)"
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
              Search, edit pricing, adjust stock and review recent stock history.
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

        <div className={styles.productList}>
          {filteredProducts.length === 0 ? (
            <div className={styles.emptyCard}>No matching products found.</div>
          ) : (
            filteredProducts.map((product) => (
              <EditableProductCard
                key={product.id}
                product={product}
                productAdjustments={getAdjustmentsForProduct(product.id)}
                onSave={handleUpdateProduct}
                onDelete={handleDeleteProduct}
                onAdjusted={(adjustment) =>
                  setAdjustments((current) => [adjustment, ...current])
                }
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
}: {
  product: ProductRow
  productAdjustments: StockAdjustmentRow[]
  onSave: (id: string, updates: Partial<ProductRow>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onAdjusted: (adjustment: StockAdjustmentRow) => void
}) {
  const [form, setForm] = useState<ProductFormState>(() => toFormState(product))
  const [saving, setSaving] = useState(false)

  const stockNumber = Number(form.stock || 0)
  const stockClass =
    stockNumber <= 0
      ? styles.stockBadgeOut
      : stockNumber <= 5
        ? styles.stockBadgeLow
        : styles.stockBadgeIn

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

  return (
    <article className={styles.productCard}>
      <div className={styles.productCardTop}>
        <div className={styles.productImageWrap}>
          {form.image_url ? (
            <img
              src={form.image_url}
              alt={form.name || 'Product image'}
              className={styles.productImage}
            />
          ) : (
            <div className={styles.imagePlaceholder}>No image</div>
          )}
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
              placeholder="Image URL"
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