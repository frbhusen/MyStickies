import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import LazyImage from '../../../components/ui/LazyImage'
import { fetchCategories, fetchProducts } from '../../../features/catalog/api'
import { addToCart, getCart } from '../../../features/cart/cartStore'
import { t } from '../../../lib/i18n'

function unwrapListResponse(data) {
  return Array.isArray(data) ? data : data?.results || []
}

export default function CatalogPage() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('all')
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    fetchCategories().then((data) => setCategories(unwrapListResponse(data)))
    const initialCart = getCart()
    setCartCount(initialCart.reduce((sum, item) => sum + Number(item.quantity || 0), 0))
  }, [])

  useEffect(() => {
    async function loadProducts() {
      const params = new URLSearchParams()
      if (selectedCategoryId !== 'all') params.set('category', selectedCategoryId)
      const data = await fetchProducts(params)
      setProducts(unwrapListResponse(data))
    }
    loadProducts()
  }, [selectedCategoryId])

  const categoryMap = useMemo(() => {
    const lookup = new Map()
    categories.forEach((category) => {
      lookup.set(category.id, category.name)
    })
    return lookup
  }, [categories])

  const visibleProducts = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter((product) => {
      const categoryName = String(categoryMap.get(product.category) || '').toLowerCase()
      return [product.name, product.slug, product.short_description, categoryName].some((value) =>
        String(value || '').toLowerCase().includes(q),
      )
    })
  }, [products, query, categoryMap])

  function handleAddToCart(product) {
    const updated = addToCart({
      productId: product.id,
      variationId: null,
      quantity: 1,
      productName: product.name,
      productImage: product.images?.[0]?.public_url || '',
      productSlug: product.slug,
      unitPrice: Number(product.effective_base_price ?? product.base_price ?? 0),
    })
    setCartCount(updated.reduce((sum, item) => sum + Number(item.quantity || 0), 0))
    setMessage(t('catalog_added_to_cart'))
  }

  return (
    <section className="catalog-page" style={{ marginTop: 24 }}>
      <section className="panel catalog-hero">
        <div>
          <span className="chip hero-badge">✨ {t('catalog_title')}</span>
          <h1 className="title hero-title" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>{t('catalog_title')}</h1>
          <p className="muted hero-subtitle" style={{ marginInlineStart: 0, maxWidth: 640 }}>{t('hero_sub')}</p>
        </div>
        <div className="catalog-hero__summary">
          <span className="chip">{cartCount} {t('nav_cart')}</span>
          <span className="muted">{visibleProducts.length} {t('catalog_featured_products')}</span>
        </div>
      </section>

      <section className="panel catalog-toolbar">
        <input
          className="input catalog-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('catalog_search')}
        />
        <div className="category-strip" role="tablist" aria-label="Categories">
          <button
            type="button"
            className={`category-pill ${selectedCategoryId === 'all' ? 'is-active' : ''}`}
            onClick={() => setSelectedCategoryId('all')}
          >
            {t('catalog_all_categories')}
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`category-pill ${selectedCategoryId === String(category.id) ? 'is-active' : ''}`}
              onClick={() => setSelectedCategoryId(String(category.id))}
            >
              {category.name}
            </button>
          ))}
        </div>
        <div className="catalog-toolbar__actions">
          <button className="btn secondary" type="button" onClick={() => setQuery('')}>
            {t('catalog_apply_filters')}
          </button>
        </div>
      </section>

      {message ? <div className="panel status-banner is-success"><p className="muted" style={{ margin: 0 }}>{message}</p></div> : null}

      <section className="grid cards">
        {visibleProducts.map((product) => {
          const hasVariations = Array.isArray(product.variations) && product.variations.length > 0
          return (
            <article key={product.id} className="card product-card">
              <div className="stack">
                <div className="image-figure image-figure--portrait product-card__image">
                  {product.images?.[0]?.public_url ? (
                    <LazyImage src={product.images[0].public_url} alt={product.name} />
                  ) : null}
                </div>
                <div className="product-card__title-row">
                  <strong>{product.name}</strong>
                  {product.is_most_sold ? <span className="chip chip--small">✨ {t('most_sold')}</span> : null}
                </div>
                <span className="muted">{t('catalog_choose_product')}</span>
                <span className="product-card__price">SYP {Number(product.effective_base_price ?? product.base_price ?? 0).toFixed(2)}</span>
                <span className="chip" style={{ width: 'fit-content' }}>{categoryMap.get(product.category) || 'Unassigned'}</span>
                {hasVariations ? (
                  <Link className="btn" to={`/product/${product.slug}`}>{t('catalog_view_details')}</Link>
                ) : (
                  <button className="btn" type="button" onClick={() => handleAddToCart(product)}>{t('product_add_to_cart')}</button>
                )}
              </div>
            </article>
          )
        })}
      </section>
    </section>
  )
}
