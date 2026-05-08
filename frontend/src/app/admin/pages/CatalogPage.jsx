import { useEffect, useMemo, useState } from 'react'
import {
  createAdminCategory,
  createAdminProduct,
  createAdminVariation,
  fetchAdminCategories,
  fetchAdminProducts,
  fetchAdminVariations,
  updateAdminCategory,
  updateAdminProduct,
  updateAdminVariation,
  uploadProductCsv,
  deleteAdminProduct,
  deleteAdminCategory,
  deleteAdminVariation,
} from '../../../features/adminCatalog/api'
import Modal from '../../../components/ui/Modal'
import LazyImage from '../../../components/ui/LazyImage'
import ProductPreviewCard from '../../../components/catalog/ProductPreviewCard'
import './styles/catalog.css'

function unwrapListResponse(data) {
  return Array.isArray(data) ? data : data?.results || []
}

function parseJsonObject(text) {
  try {
    return JSON.parse(text || '{}')
  } catch {
    return {}
  }
}

export default function CatalogPage() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [variations, setVariations] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')

  const [newCategory, setNewCategory] = useState({
    name: '', slug: '', parent: '', description: '', image_url: '', price_adjustment: '0', sort_order: '0',
  })
  const [newProduct, setNewProduct] = useState({
    category: '', name: '', slug: '', base_price: '0', image_url: '', sort_order: '0', variation_ids: [],
  })
  const [newVariation, setNewVariation] = useState({
    name: '', slug: '', price_adjustment: '0', sort_order: '0', attributes: '{}', is_active: true,
  })
  

  const [categoryEdits, setCategoryEdits] = useState({})
  const [productEdits, setProductEdits] = useState({})
  const [variationEdits, setVariationEdits] = useState({})
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState(null)
  const [modalPayload, setModalPayload] = useState(null)
  const [draggingId, setDraggingId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const [selectedProductIds, setSelectedProductIds] = useState([])
  const [csvFile, setCsvFile] = useState(null)
  const [isCsvUploading, setIsCsvUploading] = useState(false)
  const [csvReport, setCsvReport] = useState(null)

  async function refreshData() {
    setIsLoading(true)
    try {
      const [categoriesData, productsData, variationsData] = await Promise.all([
        fetchAdminCategories(),
        fetchAdminProducts(selectedCategoryId === 'all' ? {} : { category: selectedCategoryId }),
        fetchAdminVariations(),
      ])
      setCategories(unwrapListResponse(categoriesData))
      setProducts(unwrapListResponse(productsData))
      setVariations(unwrapListResponse(variationsData))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshData()
  }, [selectedCategoryId])

  const categoryMap = useMemo(() => {
    const lookup = new Map()
    categories.forEach((category) => lookup.set(category.id, category.name))
    return lookup
  }, [categories])

  const sortedProducts = useMemo(() => [...products].sort((left, right) => {
    const sortDiff = Number(left.sort_order || 0) - Number(right.sort_order || 0)
    if (sortDiff !== 0) return sortDiff
    return String(left.name).localeCompare(String(right.name))
  }), [products])

  const sortedCategories = useMemo(() => [...categories].sort((left, right) => {
    const sortDiff = Number(left.sort_order || 0) - Number(right.sort_order || 0)
    if (sortDiff !== 0) return sortDiff
    return String(left.name).localeCompare(String(right.name))
  }), [categories])

  const sortedVariations = useMemo(() => [...variations].sort((left, right) => {
    const sortDiff = Number(left.sort_order || 0) - Number(right.sort_order || 0)
    if (sortDiff !== 0) return sortDiff
    return String(left.name).localeCompare(String(right.name))
  }), [variations])

  const totalBaseValue = useMemo(() => {
    return products.reduce((sum, product) => sum + Number(product.base_price || 0), 0)
  }, [products])

  const isErrorMessage = useMemo(() => /fail|error/i.test(message), [message])

  async function handleCreateCategory(event) {
    event.preventDefault()
    setMessage('')
    await createAdminCategory({
      name: newCategory.name,
      slug: newCategory.slug,
      description: newCategory.description,
      image_url: newCategory.image_url,
      price_adjustment: newCategory.price_adjustment,
      parent: newCategory.parent || null,
      is_active: true,
      sort_order: newCategory.sort_order,
    })
    setNewCategory({ name: '', slug: '', parent: '', description: '', image_url: '', price_adjustment: '0', sort_order: '0' })
    setMessage('Category created.')
    await refreshData()
  }

  async function handleCreateProduct(event) {
    event.preventDefault()
    setMessage('')
    await createAdminProduct({
      category: Number(newProduct.category),
      name: newProduct.name,
      slug: newProduct.slug,
      image_url: newProduct.image_url,
      base_price: newProduct.base_price,
      is_most_sold: !!newProduct.is_most_sold,
      short_description: '',
      description: '',
      is_active: true,
      is_featured: false,
      sort_order: newProduct.sort_order,
      variation_ids: newProduct.variation_ids.map(Number),
    })
    setNewProduct({ category: '', name: '', slug: '', base_price: '0', image_url: '', sort_order: '0', variation_ids: [] })
    setMessage('Product created.')
    await refreshData()
  }

  async function handleCreateVariation(event) {
    event.preventDefault()
    setMessage('')
    await createAdminVariation({
      name: newVariation.name,
      slug: newVariation.slug,
      price_adjustment: newVariation.price_adjustment,
      attributes: parseJsonObject(newVariation.attributes),
      is_active: newVariation.is_active,
      sort_order: newVariation.sort_order,
    })
    setNewVariation({ name: '', slug: '', price_adjustment: '0', sort_order: '0', attributes: '{}', is_active: true })
    setMessage('Variation created.')
    await refreshData()
  }

  async function handleModalSave() {
    setMessage('')
    try {
      if (modalType === 'product') {
        const payload = modalPayload
        if (payload.id) {
          await updateAdminProduct(payload.id, payload)
          setMessage('Product updated.')
        } else {
          await createAdminProduct(payload)
          setMessage('Product created.')
        }
      }
      if (modalType === 'category') {
        const payload = modalPayload
        if (payload.id) {
          await updateAdminCategory(payload.id, payload)
          setMessage('Category updated.')
        } else {
          await createAdminCategory(payload)
          setMessage('Category created.')
        }
      }
      if (modalType === 'variation') {
        const payload = modalPayload
        if (payload.id) {
          await updateAdminVariation(payload.id, payload)
          setMessage('Variation updated.')
        } else {
          await createAdminVariation(payload)
          setMessage('Variation created.')
        }
      }
      closeModal()
      await refreshData()
    } catch (err) {
      setMessage('Save failed')
    }
  }

  async function handleSaveCategory(categoryId) {
    const draft = categoryEdits[categoryId]
    if (!draft) return
    setMessage('')
    await updateAdminCategory(categoryId, {
      name: draft.name,
      slug: draft.slug,
      parent: draft.parent || null,
      description: draft.description,
      image_url: draft.image_url ?? '',
      price_adjustment: draft.price_adjustment,
      is_active: draft.is_active,
      sort_order: Number(draft.sort_order ?? 0),
    })
    setMessage('Category updated.')
    await refreshData()
  }

  async function handleSaveProduct(productId) {
    const draft = productEdits[productId]
    if (!draft) return
    setMessage('')
    await updateAdminProduct(productId, {
      category: Number(draft.category),
      name: draft.name,
      slug: draft.slug,
      short_description: draft.short_description,
      description: draft.description,
      base_price: draft.base_price,
      is_active: draft.is_active,
      is_featured: draft.is_featured,
      is_most_sold: !!draft.is_most_sold,
      sort_order: Number(draft.sort_order ?? 0),
      variation_ids: (draft.variation_ids || []).map(Number),
    })
    setMessage('Product updated.')
    await refreshData()
  }

  async function handleSaveVariation(variationId) {
    const draft = variationEdits[variationId]
    if (!draft) return
    setMessage('')
    await updateAdminVariation(variationId, {
      name: draft.name,
      slug: draft.slug,
      price_adjustment: draft.price_adjustment,
      attributes: parseJsonObject(draft.attributes),
      is_active: draft.is_active,
      sort_order: Number(draft.sort_order ?? 0),
    })
    setMessage('Variation updated.')
    await refreshData()
  }

  function openEditModal(type, item = null) {
    setModalType(type)
    if (type === 'product' && item) {
      setModalPayload({
        ...item,
        image_url: item.image_url || item.primary_image_url || '',
      })
    } else {
      setModalPayload(item)
    }
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setModalType(null)
    setModalPayload(null)
  }

  async function handleDeleteProduct(id) {
    if (!window.confirm('Delete this product? This action cannot be undone.')) return
    await deleteAdminProduct(id)
    setSelectedProductIds((prev) => prev.filter((selectedId) => selectedId !== id))
    setMessage('Product deleted.')
    await refreshData()
  }

  function handleSelectAllProducts() {
    setSelectedProductIds(sortedProducts.map((product) => product.id))
  }

  function handleDeselectAllProducts() {
    setSelectedProductIds([])
  }

  function handleToggleProductSelection(productId) {
    setSelectedProductIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId)
      }
      return [...prev, productId]
    })
  }

  async function handleDeleteSelectedProducts() {
    if (selectedProductIds.length === 0) {
      setMessage('No products selected.')
      return
    }

    if (!window.confirm(`Delete ${selectedProductIds.length} selected product(s)? This action cannot be undone.`)) {
      return
    }

    try {
      await Promise.all(selectedProductIds.map((id) => deleteAdminProduct(id)))
      setSelectedProductIds([])
      setMessage(`${selectedProductIds.length} product(s) deleted.`)
      await refreshData()
    } catch (err) {
      setMessage('Failed to delete one or more selected products.')
    }
  }

  async function handleDeleteCategory(id) {
    if (!window.confirm('Delete this category? This action cannot be undone.')) return
    await deleteAdminCategory(id)
    setMessage('Category deleted.')
    await refreshData()
  }

  async function handleDeleteVariation(id) {
    if (!window.confirm('Delete this variation? This action cannot be undone.')) return
    await deleteAdminVariation(id)
    setMessage('Variation deleted.')
    await refreshData()
  }

  async function handleCopyProduct(product) {
    const copyPayload = {
      ...product,
      id: undefined,
      name: `${product.name} copy`,
      slug: `${product.slug}-copy`,
    }
    setModalType('product')
    setModalPayload(copyPayload)
    setModalOpen(true)
  }

  async function handleMoveProduct(product, delta) {
    const updated = { ...product, sort_order: Number(product.sort_order || 0) + delta }
    await updateAdminProduct(product.id, { sort_order: updated.sort_order })
    setMessage('Product order updated.')
    await refreshData()
  }

  async function handleToggleMostSold(product) {
    await updateAdminProduct(product.id, { is_most_sold: !product.is_most_sold })
    setMessage(product.is_most_sold ? 'Removed from most sold.' : 'Marked as most sold.')
    await refreshData()
  }

  function onDragStart(event, product) {
    setDraggingId(product.id)
    try {
      event.dataTransfer.setData('text/plain', String(product.id))
      event.dataTransfer.effectAllowed = 'move'
    } catch (e) {}
  }

  function onDragOver(event, product) {
    event.preventDefault()
    setDragOverId(product.id)
    event.dataTransfer.dropEffect = 'move'
  }

  function onDragLeave() {
    setDragOverId(null)
  }

  async function onDrop(event, targetProduct) {
    event.preventDefault()
    const draggedId = draggingId || Number(event.dataTransfer.getData('text/plain'))
    setDraggingId(null)
    setDragOverId(null)
    if (!draggedId || draggedId === targetProduct.id) return

    // Compute new order: move dragged item to position of targetProduct
    const list = [...sortedProducts]
    const fromIndex = list.findIndex((p) => p.id === draggedId)
    const toIndex = list.findIndex((p) => p.id === targetProduct.id)
    if (fromIndex === -1 || toIndex === -1) return
    const [moved] = list.splice(fromIndex, 1)
    list.splice(toIndex, 0, moved)

    // Reassign sort_order sequentially (10,20,30...) to allow gaps later
    const updated = list.map((p, idx) => ({ ...p, sort_order: (idx + 1) * 10 }))

    // Persist changes for those where sort_order changed
    const toPersist = updated.filter((p, idx) => Number(products.find((x) => x.id === p.id)?.sort_order || 0) !== p.sort_order)
    try {
      await Promise.all(toPersist.map((p) => updateAdminProduct(p.id, { sort_order: p.sort_order })))
      setMessage('Order updated.')
    } catch (err) {
      setMessage('Failed to persist order.')
    }
    await refreshData()
  }

  function handleCsvFileSelected(event) {
    const file = event.target.files?.[0]
    if (!file) {
      setCsvFile(null)
      return
    }
    setCsvFile(file)
    setCsvReport(null)
  }

  async function handleCsvUpload(event) {
    event.preventDefault()
    if (!csvFile) {
      setMessage('Choose a CSV file first.')
      return
    }

    setIsCsvUploading(true)
    setMessage('')
    try {
      const result = await uploadProductCsv(csvFile)
      setCsvReport(result)
      setMessage(`CSV processed. Created: ${result.created}, Updated: ${result.updated}, Errors: ${result.errors.length}`)
      setCsvFile(null)
      await refreshData()
    } catch (err) {
      let reason = 'CSV upload failed. Please verify file format and try again.'
      if (err?.message) {
        try {
          const payload = JSON.parse(err.message)
          reason = payload.detail || reason
        } catch {
          reason = err.message
        }
      }
      setMessage(reason)
    } finally {
      setIsCsvUploading(false)
    }
  }

  return (
    <section className="grid" style={{ gap: 24 }}>
      <Modal title={modalType ? `${modalType[0].toUpperCase() + modalType.slice(1)} editor` : ''} open={modalOpen} onClose={closeModal}>
        {modalType === 'product' && (
          <div className="stack">
            <label className="muted">Name</label>
            <input className="input" value={modalPayload?.name ?? ''} onChange={(e) => setModalPayload((p) => ({ ...(p || {}), name: e.target.value }))} />
            <label className="muted">Slug</label>
            <input className="input" value={modalPayload?.slug ?? ''} onChange={(e) => setModalPayload((p) => ({ ...(p || {}), slug: e.target.value }))} />
            <label className="muted">Google Drive image URL</label>
            <input className="input" value={modalPayload?.image_url ?? ''} onChange={(e) => setModalPayload((p) => ({ ...(p || {}), image_url: e.target.value }))} />
            <label style={{display:'flex',alignItems:'center',gap:8}}>
              <input type="checkbox" checked={!!modalPayload?.is_most_sold} onChange={(e) => setModalPayload((p) => ({ ...(p || {}), is_most_sold: e.target.checked }))} />
              <span className="muted">Mark as most sold</span>
            </label>
            <label className="muted">Category</label>
            <select value={modalPayload?.category ?? ''} onChange={(e) => setModalPayload((p) => ({ ...(p || {}), category: Number(e.target.value) }))}>
              <option value="">Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <label className="muted">Base price</label>
            <input className="input" type="number" value={modalPayload?.base_price ?? 0} onChange={(e) => setModalPayload((p) => ({ ...(p || {}), base_price: e.target.value }))} />
            <label className="muted">Assign variations
              <select multiple value={(modalPayload?.variation_ids || []).map(String)} onChange={(e) => setModalPayload((p) => ({ ...(p || {}), variation_ids: Array.from(e.target.selectedOptions, (o) => Number(o.value)) }))} style={{ minHeight: 120 }}>
                {variations.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" type="button" onClick={handleModalSave}>Save</button>
              <button className="btn secondary" type="button" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        )}
        {modalType === 'category' && (
          <div className="stack">
            <label className="muted">Name</label>
            <input className="input" value={modalPayload?.name ?? ''} onChange={(e) => setModalPayload((p) => ({ ...(p || {}), name: e.target.value }))} />
            <label className="muted">Slug</label>
            <input className="input" value={modalPayload?.slug ?? ''} onChange={(e) => setModalPayload((p) => ({ ...(p || {}), slug: e.target.value }))} />
            <label className="muted">Parent</label>
            <select value={modalPayload?.parent ?? ''} onChange={(e) => setModalPayload((p) => ({ ...(p || {}), parent: e.target.value }))}>
              <option value="">No parent</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <label className="muted">Image URL</label>
            <input className="input" value={modalPayload?.image_url ?? ''} onChange={(e) => setModalPayload((p) => ({ ...(p || {}), image_url: e.target.value }))} />
            <label className="muted">Price adjustment</label>
            <input className="input" type="number" value={modalPayload?.price_adjustment ?? 0} onChange={(e) => setModalPayload((p) => ({ ...(p || {}), price_adjustment: e.target.value }))} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" onClick={handleModalSave}>Save</button>
              <button className="btn secondary" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        )}
        {modalType === 'variation' && (
          <div className="stack">
            <label className="muted">Name</label>
            <input className="input" value={modalPayload?.name ?? ''} onChange={(e) => setModalPayload((p) => ({ ...(p || {}), name: e.target.value }))} />
            <label className="muted">Slug</label>
            <input className="input" value={modalPayload?.slug ?? ''} onChange={(e) => setModalPayload((p) => ({ ...(p || {}), slug: e.target.value }))} />
            <label className="muted">Price adjustment</label>
            <input className="input" type="number" value={modalPayload?.price_adjustment ?? 0} onChange={(e) => setModalPayload((p) => ({ ...(p || {}), price_adjustment: e.target.value }))} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" onClick={handleModalSave}>Save</button>
              <button className="btn secondary" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        )}
      </Modal>
      <section className="hero-card">
        <div className="grid" style={{ gap: 10 }}>
          <span className="chip" style={{ width: 'fit-content' }}>Catalog studio</span>
          <h2 className="title" style={{ fontSize: '2rem', margin: 0 }}>Manage prices, categories, and reusable variations from one place.</h2>
          <p className="muted" style={{ margin: 0, maxWidth: 840 }}>
            Edit product ordering, attach category price adjustments, and assign variations that apply across every product that uses them.
          </p>
        </div>
      </section>

      <div className="stats-grid">
        <article className="metric-card">
          <p className="metric-label">Products</p>
          <p className="metric-value">{products.length}</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Categories</p>
          <p className="metric-value">{categories.length}</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Variations</p>
          <p className="metric-value">{variations.length}</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Total Base Value</p>
          <p className="metric-value">SYP {totalBaseValue.toFixed(2)}</p>
        </article>
      </div>

      {message ? <div className={`panel status-banner ${isErrorMessage ? 'is-error' : 'is-success'}`}><p className="muted" style={{ margin: 0 }}>{message}</p></div> : null}

      <div className="grid cards" style={{ alignItems: 'start' }}>
        <form className="card stack" onSubmit={handleCreateCategory}>
          <h3 className="section-title">Create category</h3>
          <label className="muted">Name</label>
          <input className="input" value={newCategory.name} onChange={(e) => setNewCategory((v) => ({ ...v, name: e.target.value }))} required />
          <label className="muted">Slug</label>
          <input className="input" value={newCategory.slug} onChange={(e) => setNewCategory((v) => ({ ...v, slug: e.target.value }))} required />
          <label className="muted">Parent</label>
          <select value={newCategory.parent} onChange={(e) => setNewCategory((v) => ({ ...v, parent: e.target.value }))}>
            <option value="">No parent</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <label className="muted">Description</label>
          <input className="input" value={newCategory.description} onChange={(e) => setNewCategory((v) => ({ ...v, description: e.target.value }))} />
          <label className="muted">Google Drive image link</label>
          <input className="input" value={newCategory.image_url} onChange={(e) => setNewCategory((v) => ({ ...v, image_url: e.target.value }))} />
          <label className="muted">Category price</label>
          <input className="input" type="number" min="0" step="0.01" value={newCategory.price_adjustment} onChange={(e) => setNewCategory((v) => ({ ...v, price_adjustment: e.target.value }))} />
          <label className="muted">Sort order</label>
          <input className="input" type="number" min="0" step="1" value={newCategory.sort_order} onChange={(e) => setNewCategory((v) => ({ ...v, sort_order: e.target.value }))} />
          <button className="btn" type="submit">Add category</button>
        </form>

        <form className="card stack" onSubmit={handleCreateProduct}>
          <h3 className="section-title">Create product</h3>
          <label className="muted">Category</label>
          <select value={newProduct.category} onChange={(e) => setNewProduct((v) => ({ ...v, category: e.target.value }))} required>
            <option value="">Select category</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <label className="muted">Name</label>
          <input className="input" value={newProduct.name} onChange={(e) => setNewProduct((v) => ({ ...v, name: e.target.value }))} required />
          <label className="muted">Slug</label>
          <input className="input" value={newProduct.slug} onChange={(e) => setNewProduct((v) => ({ ...v, slug: e.target.value }))} required />
          <label className="muted">Base price</label>
          <input className="input" type="number" min="0" step="0.01" value={newProduct.base_price} onChange={(e) => setNewProduct((v) => ({ ...v, base_price: e.target.value }))} required />
          <label className="muted">Sort order</label>
          <input className="input" type="number" min="0" step="1" value={newProduct.sort_order} onChange={(e) => setNewProduct((v) => ({ ...v, sort_order: e.target.value }))} />
          <label className="muted" style={{ display: 'grid', gap: 8 }}>
            Assign variations
            <select multiple value={newProduct.variation_ids} onChange={(e) => setNewProduct((v) => ({
              ...v,
              variation_ids: Array.from(e.target.selectedOptions, (option) => option.value),
            }))} style={{ minHeight: 140 }}>
              {variations.map((variation) => <option key={variation.id} value={variation.id}>{variation.name}</option>)}
            </select>
          </label>
          <button className="btn" type="submit">Add product</button>
        </form>

        <form className="card stack" onSubmit={handleCreateVariation}>
          <h3 className="section-title">Create variation</h3>
          <label className="muted">Name</label>
          <input className="input" value={newVariation.name} onChange={(e) => setNewVariation((v) => ({ ...v, name: e.target.value }))} required />
          <label className="muted">Slug</label>
          <input className="input" value={newVariation.slug} onChange={(e) => setNewVariation((v) => ({ ...v, slug: e.target.value }))} required />
          <label className="muted">Variation price</label>
          <input className="input" type="number" min="0" step="0.01" value={newVariation.price_adjustment} onChange={(e) => setNewVariation((v) => ({ ...v, price_adjustment: e.target.value }))} required />
          <label className="muted">Sort order</label>
          <input className="input" type="number" min="0" step="1" value={newVariation.sort_order} onChange={(e) => setNewVariation((v) => ({ ...v, sort_order: e.target.value }))} />
          <label className="muted">Attributes JSON</label>
          <textarea className="input" rows="3" value={newVariation.attributes} onChange={(e) => setNewVariation((v) => ({ ...v, attributes: e.target.value }))} />
          <button className="btn" type="submit">Add variation</button>
        </form>
      </div>

      <div className="panel stack">
        <h3 className="section-title">CSV bulk import</h3>
        <p className="muted" style={{ margin: 0 }}>
          The CSV should include these headers (synonyms accepted):
        </p>
        <ul style={{ marginTop: 8 }}>
          <li><strong>name</strong> — product name</li>
          <li><strong>slug</strong> — product slug (unique)</li>
          <li><strong>price</strong> or <strong>base_price</strong> — product price</li>
          <li><strong>category</strong> or <strong>category_id</strong> — id, slug, name, or a path like "Parent &gt; Child"</li>
          <li><strong>variations</strong> — comma/semicolon list of variation ids, slugs, or names</li>
          <li><strong>image_url</strong> or <strong>google_drive_image_url</strong> — public Google Drive or image URL</li>
        </ul>
        <p className="muted" style={{ margin: 0 }}>
          Other columns are optional and ignored (short_description, description, flags). Example CSV row:
        </p>
        <pre style={{ background: '#f6f7f8', padding: 8, borderRadius: 6, marginTop: 8 }}>
name,slug,price,category,variations,image_url
Sticker A,sticker-a,170,Stickers &gt; A5,"small,blue",https://lh3.googleusercontent.com/.../image.jpg
        </pre>
        <form className="csv-upload-form" onSubmit={handleCsvUpload}>
          <label className="muted">CSV file</label>
          <input
            className="input"
            type="file"
            accept=".csv,text/csv"
            onChange={handleCsvFileSelected}
            onClick={(e) => {
              e.currentTarget.value = null
            }}
          />
          <div className="csv-upload-actions">
            <p className="muted" style={{ margin: 0 }}>{csvFile ? `Selected: ${csvFile.name}` : 'No file selected yet.'}</p>
            <button className="btn" type="submit" disabled={!csvFile || isCsvUploading}>
              {isCsvUploading ? 'Uploading...' : 'Upload CSV'}
            </button>
          </div>
        </form>
        {csvReport ? (
          <div className="csv-report">
            <div className="csv-report-grid">
              <p className="muted" style={{ margin: 0 }}>Created: <strong>{csvReport.created || 0}</strong></p>
              <p className="muted" style={{ margin: 0 }}>Updated: <strong>{csvReport.updated || 0}</strong></p>
              <p className="muted" style={{ margin: 0 }}>Errors: <strong>{(csvReport.errors || []).length}</strong></p>
            </div>
            {Array.isArray(csvReport.errors) && csvReport.errors.length > 0 ? (
              <ul className="csv-errors">
                {csvReport.errors.slice(0, 5).map((errorItem, index) => (
                  <li key={index}>{typeof errorItem === 'string' ? errorItem : JSON.stringify(errorItem)}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="panel stack">
        <h3 className="section-title">Product controls</h3>
        <div className="grid cards" style={{ alignItems: 'center' }}>
          <select value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)}>
            <option value="all">All categories</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn secondary" type="button" onClick={handleSelectAllProducts}>Select all</button>
            <button className="btn secondary" type="button" onClick={handleDeselectAllProducts}>Deselect all</button>
            <button className="btn danger" type="button" onClick={handleDeleteSelectedProducts} disabled={selectedProductIds.length === 0}>Delete selected ({selectedProductIds.length})</button>
          </div>
          <p className="muted" style={{ margin: 0 }}>Lower sort numbers appear first. Category pricing is added to product base price automatically.</p>
        </div>
      </div>

      <div className="panel stack">
        <h3 className="section-title">Current products ({sortedProducts.length})</h3>
        {isLoading ? <p className="muted">Loading...</p> : null}
        <div className="product-list">
          {sortedProducts.map((product) => (
            <div
              className={`product-row ${draggingId === product.id ? 'dragging' : ''} ${dragOverId === product.id ? 'drag-over' : ''}`}
              key={product.id}
              draggable={true}
              onDragStart={(e) => onDragStart(e, product)}
              onDragOver={(e) => onDragOver(e, product)}
              onDrop={(e) => onDrop(e, product)}
              onDragLeave={onDragLeave}
            >
              <input
                type="checkbox"
                checked={selectedProductIds.includes(product.id)}
                onChange={() => handleToggleProductSelection(product.id)}
              />
              <div>
                <LazyImage className="thumb" src={product.primary_image_url || (product.images && product.images[0] && product.images[0].public_url) || product.image_url || ''} alt="" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div className="name">{product.name}</div>
                    <div className="meta">Slug: {product.slug || '—'}</div>
                    <div className="meta">{product.short_description || ''}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="price">SYP {Number(product.base_price || 0).toFixed(2)}</div>
                    <div className="meta">{product.discount || 0}%</div>
                  </div>
                </div>
                <div style={{ marginTop: 6 }} className="meta">{categoryMap.get(product.category) || 'Unassigned'}</div>
              </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="meta">Effective: <strong>SYP {(Number(((product.effective_base_price ?? product.base_price) || 0))).toFixed(2)}</strong></div>
                <div className="meta">Variations: {(product.variations || []).map((v) => v.name).join(', ') || '—'}</div>
              </div>
              <div className="product-actions">
                <button className="btn small" type="button" onClick={() => openEditModal('product', product)}>Edit</button>
                <button className="btn small" type="button" onClick={() => handleCopyProduct(product)}>Copy</button>
                <button className={`btn secondary small ${product.is_most_sold ? 'is-active' : ''}`} type="button" onClick={() => handleToggleMostSold(product)}>
                  {product.is_most_sold ? '★ Most sold' : '☆ Most sold'}
                </button>
                <button className="btn secondary small" type="button" onClick={() => handleMoveProduct(product, -1)}>▲</button>
                <button className="btn secondary small" type="button" onClick={() => handleMoveProduct(product, 1)}>▼</button>
                <button className="btn danger small" type="button" onClick={() => handleDeleteProduct(product.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel stack">
        <h3 className="section-title">Current categories ({sortedCategories.length})</h3>
        {sortedCategories.map((category) => (
          <article className="card" key={category.id}>
            <div className="stack">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{category.name}</strong>
                  <div className="meta">Slug: {category.slug || '—'}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn" type="button" onClick={() => openEditModal('category', category)}>Edit</button>
                  <button className="btn danger" type="button" onClick={() => handleDeleteCategory(category.id)}>Delete</button>
                </div>
              </div>
              <p className="muted" style={{ margin: 0 }}>
                Parent: {category.parent || 'none'} · Category price: {category.price_adjustment || 0}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="panel stack">
        <h3 className="section-title">Current variations ({sortedVariations.length})</h3>
        {sortedVariations.map((variation) => (
          <article className="card" key={variation.id}>
            <div className="stack">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{variation.name}</strong>
                  <div className="meta">Slug: {variation.slug || '—'}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn" type="button" onClick={() => openEditModal('variation', variation)}>Edit</button>
                  <button className="btn danger" type="button" onClick={() => handleDeleteVariation(variation.id)}>Delete</button>
                </div>
              </div>
              <p className="muted" style={{ margin: 0 }}>Price: {variation.price_adjustment}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}