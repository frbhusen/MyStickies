import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import LazyImage from '../../../components/ui/LazyImage'
import { fetchProduct } from '../../../features/catalog/api'
import { addToCart } from '../../../features/cart/cartStore'
import { t } from '../../../lib/i18n'

export default function ProductPage() {
  const { slug } = useParams()
  const [product, setProduct] = useState(null)
  const [selectedVariationId, setSelectedVariationId] = useState(null)
  const [selectedImage, setSelectedImage] = useState('')
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchProduct(slug)
        setProduct(data)
        setSelectedVariationId(data?.variations?.[0]?.id ?? null)
        setSelectedImage(data?.images?.[0]?.public_url || '')
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [slug])

  const selectedVariation = useMemo(() => {
    if (!product?.variations?.length) return null
    return product.variations.find((variation) => variation.id === selectedVariationId) || product.variations[0]
  }, [product, selectedVariationId])

  const finalPrice = useMemo(() => {
    if (!product) return 0
    // When variation is selected, use its price as the final price (not additive)
    if (selectedVariation?.price_adjustment) {
      return Number(selectedVariation.price_adjustment).toFixed(2)
    }
    // Fall back to base price if no variation or no variation price
    return (product.effective_base_price || product.base_price || 0).toFixed(2)
  }, [product, selectedVariation])

  function handleAddToCart() {
    if (!product) return
    addToCart({
      productId: product.id,
      variationId: selectedVariation?.id || null,
      quantity,
      productName: product.name,
      productImage: selectedImage || product.images?.[0]?.public_url || '',
      productSlug: product.slug,
      variationName: selectedVariation?.name || '',
      unitPrice: Number(finalPrice),
    })
    alert(t('product_added_to_cart'))
  }

  if (!product) {
    return (
      <section className="hero-card" style={{ marginTop: 24 }}>
        <h1 className="section-title">{t('product_detail')}</h1>
        <p className="muted">{t('variation_placeholder')}</p>
      </section>
    )
  }

  return (
    <section className="product-page hero-card" style={{ marginTop: 24 }}>
      <div className="product-page__layout">
        <div className="product-page__gallery">
          <div className="product-page__main-image image-figure image-figure--portrait">
            <LazyImage src={selectedImage || product.images?.[0]?.public_url || ''} alt={product.name} />
          </div>
          {product.images?.length > 1 ? (
            <div className="product-page__thumbs">
              {product.images.map((image) => (
                <button
                  key={image.id}
                  type="button"
                  className={`product-page__thumb ${selectedImage === image.public_url ? 'is-active' : ''}`}
                  onClick={() => setSelectedImage(image.public_url)}
                >
                  <LazyImage src={image.public_url} alt={product.name} />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="product-page__content">
          <span className="chip hero-badge">✨ {t('product_detail')}</span>
          <h1 className="title hero-title" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}>{product.name}</h1>
          <p className="muted hero-subtitle" style={{ marginInlineStart: 0 }}>{product.short_description || product.description || t('variation_placeholder')}</p>

          <div className="product-page__price">SYP {finalPrice}</div>

          {product.variations && product.variations.length > 0 ? (
            <div className="variation-grid">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div className="section-heading" style={{ margin: 0, flex: 1 }}>✨ {t('product_select_variation')}</div>
              </div>
              <div className="variation-pills">
                {product.variations.map((variation) => (
                  <button
                    key={variation.id}
                    type="button"
                    className={`variation-pill ${selectedVariationId === variation.id ? 'is-active' : ''}`}
                    onClick={() => setSelectedVariationId(variation.id)}
                    title={`${variation.name} - SYP ${variation.price_adjustment}`}
                  >
                    <span>{variation.name}</span>
                    <small style={{ fontWeight: 600, color: 'var(--primary)' }}>SYP {variation.price_adjustment}</small>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="muted" style={{ marginTop: 16 }}>{t('product_no_variations')}</div>
          )}

          <div className="product-page__cta-row">
            <div className="quantity-stepper">
              <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button>
              <input type="number" min={1} value={quantity} onChange={(event) => setQuantity(Number(event.target.value || 1))} />
              <button type="button" onClick={() => setQuantity((value) => value + 1)}>+</button>
            </div>
            <button className="btn" onClick={handleAddToCart}>{t('product_add_to_cart')}</button>
          </div>
        </div>
      </div>
    </section>
  )
}
