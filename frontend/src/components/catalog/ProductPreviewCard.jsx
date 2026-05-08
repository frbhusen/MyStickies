import React, { useMemo, useState } from 'react'
import LazyImage from '../ui/LazyImage'

export default function ProductPreviewCard({ product, categories = [], variations = [] }) {
  const category = categories.find((c) => c.id === product.category) || null
  const [selectedVariationId, setSelectedVariationId] = useState(product.variations?.[0]?.id ?? null)

  const variationOptions = product.variations || []

  const finalPrice = useMemo(() => {
    const base = Number(product.base_price || 0)
    const catAdj = Number(category?.price_adjustment || 0)
    const varPrice = Number((variationOptions.find((v) => v.id === selectedVariationId)?.price_adjustment) || 0)
    return (base + catAdj + varPrice).toFixed(2)
  }, [product, category, selectedVariationId, variationOptions])

  return (
    <div className="panel" style={{ width: '100%', maxWidth: 320 }}>
      <div style={{ marginBottom: 12 }} className="image-figure image-figure--portrait">
        {product.primary_image_url || (product.images && product.images[0] && product.images[0].public_url) ? (
          <LazyImage src={product.primary_image_url || (product.images && product.images[0] && product.images[0].public_url)} alt={product.name} />
        ) : null}
      </div>
      <h4 style={{ margin: '0 0 8px 0' }}>{product.name}</h4>
      <p className="muted" style={{ margin: 0 }}>Base: {product.base_price} · Category adj: {category?.price_adjustment ?? 0}</p>
      <label style={{ display: 'block', marginTop: 8 }}>
        Variation
        <select value={selectedVariationId ?? ''} onChange={(e) => setSelectedVariationId(Number(e.target.value))} style={{ width: '100%', marginTop: 6 }}>
          <option value="">(no variation)</option>
          {variationOptions.map((v) => (
            <option key={v.id} value={v.id}>{v.name} (+{v.price_adjustment})</option>
          ))}
        </select>
      </label>
      <div style={{ marginTop: 12 }}>
        <strong>Final price: {finalPrice}</strong>
      </div>
    </div>
  )
}
