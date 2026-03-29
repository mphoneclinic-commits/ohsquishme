'use client'

import { useMemo, useState } from 'react'
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

type ProductFormState = {
  name: string
  description: string
  price_retail: string
  price_wholesale: string
  stock: string
  image_url: string
  active: boolean
}

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

function formatMoney(value: string) {
  const num = normalizeMoneyInput(value)
  return `$${num.toFixed(2)}`
}

export default function ProductAdminList({
  initialProducts,
}: {
  initialProducts: ProductRow[]
}) {
  const safeInitialProducts = useMemo(
    () => (Array.isArray(initialProducts) ? initialProducts : []),
    [initialProducts]
  )

  const [products, setProducts] = useState<ProductRow[]>(safeInitialProducts)
  const [query, setQuery] = useState('')
  const [createForm, setCreateForm] = useState<ProductFormState>(emptyForm)
  const [createImage, setCreateImage] = useState<File | null>(null)
  const [createMessage, setCreateMessage] = useState('')
  const [creating, setCreating] = useState(false)

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products

    return products.filter((product) =>
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
    )
  }, [products, query])

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
        description: createForm.description.trim(),
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
            <h2 className={styles.sectionTitle}>Create Product</h2>
            <p className={styles.sectionText}>
              Add a new product to the storefront.
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

            {createImage ? (
              <div className={styles.message}>Selected: {createImage.name}</div>
            ) : null}

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
              {creating ? 'Creating...' : 'Create Product'}
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
            <h2 className={styles.sectionTitle}>Existing Products</h2>
            <p className={styles.sectionText}>
              Update pricing, stock, status, and images.
            </p>
          </div>
        </div>

        <div className={styles.listToolbar}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, description, stock, price..."
            className={styles.input}
          />
        </div>

        <div className={styles.productList}>
          {filteredProducts.length === 0 ? (
            <div className={styles.emptyCard}>No matching products found.</div>
          ) : (
            filteredProducts.map((product) => (
              <EditableProductCard
                key={product.id}
                product={product}
                onSave={handleUpdateProduct}
                onDelete={handleDeleteProduct}
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
  onSave,
  onDelete,
}: {
  product: ProductRow
  onSave: (id: string, updates: Partial<ProductRow>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [form, setForm] = useState<ProductFormState>(() => toFormState(product))
  const [saving, setSaving] = useState(false)

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
            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm((current) => ({ ...current, name: e.target.value }))
              }
              className={styles.nameInput}
            />

            <span
              className={
                form.active ? styles.activeBadge : styles.inactiveBadge
              }
            >
              {form.active ? 'Active' : 'Inactive'}
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
          {saving ? 'Saving...' : 'Save Changes'}
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
        onAdjusted={(nextStock) =>
          setForm((current) => ({
            ...current,
            stock: String(nextStock),
          }))
        }
      />
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
  onAdjusted: (nextStock: number) => void
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

      onAdjusted(Number(data.stock || currentStock))
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
          {saving ? 'Updating...' : 'Adjust Stock'}
        </button>
      </div>
    </div>
  )
}