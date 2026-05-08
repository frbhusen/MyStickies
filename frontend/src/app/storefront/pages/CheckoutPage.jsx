import { useMemo, useState } from 'react'
import { getCart, setCart } from '../../../features/cart/cartStore'
import { createOrder } from '../../../features/orders/api'
import { t } from '../../../lib/i18n'
import LazyImage from '../../../components/ui/LazyImage'

export default function CheckoutPage() {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [notes, setNotes] = useState('')
  const [cart, setCartState] = useState(getCart())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [lastOrder, setLastOrder] = useState(null)

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0), 0)
  }, [cart])

  function updateQuantity(index, quantity) {
    const next = [...cart]
    const safeQuantity = Math.max(1, Number(quantity || 1))
    next[index] = { ...next[index], quantity: safeQuantity }
    setCartState(next)
    setCart(next)
  }

  function removeItem(index) {
    const next = cart.filter((_, itemIndex) => itemIndex !== index)
    setCartState(next)
    setCart(next)
  }

  async function onSubmit(event) {
    event.preventDefault()
    setMessage('')
    if (!cart.length) {
      setMessage(t('cart_empty'))
      return
    }
    setIsSubmitting(true)
    try {
      const payload = {
        customer_full_name: fullName,
        phone_number: phone,
        city,
        notes,
        items: cart.map((item) => ({
          product_id: item.productId,
          variation_id: item.variationId,
          quantity: Number(item.quantity || 1),
        })),
      }
      const order = await createOrder(payload)
      setLastOrder(order)
      setMessage(t('checkout_success').replace('{order_number}', order.order_number))
      setCart([])
      setCartState([])
      setFullName('')
      setPhone('')
      setCity('')
      setNotes('')
    } catch (error) {
      setMessage(t('checkout_failed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="checkout-grid" style={{ marginTop: 24 }}>
      <div className="panel checkout-panel">
        <h1 className="section-title">{t('checkout_title')}</h1>
        <p className="muted">{t('checkout_description')}</p>
        {message ? <p className="muted" style={{ marginBottom: 0 }}>{message}</p> : null}
        {lastOrder?.whatsapp_link ? (
          <p style={{ marginBottom: 0 }}>
            <a className="btn secondary" href={lastOrder.whatsapp_link} target="_blank" rel="noreferrer">{t('checkout_whatsapp')}</a>
          </p>
        ) : null}
      </div>

      <div className="card stack checkout-cart">
        <h2 className="section-title">{t('nav_cart')}</h2>
        {!cart.length ? <p className="muted" style={{ margin: 0 }}>{t('cart_empty')}</p> : null}
        {cart.map((item, index) => (
          <article className="cart-item" key={`${item.productId}-${item.variationId || 'none'}-${index}`}>
            <div className="cart-item__image">
              {item.productImage ? <LazyImage src={item.productImage} alt={item.productName || 'Product'} /> : null}
            </div>
            <div className="cart-item__body">
              <strong>{item.productName || `Product #${item.productId}`}</strong>
              {item.variationName ? <div className="muted">{item.variationName}</div> : null}
              <p className="muted" style={{ margin: 0 }}>Unit: SYP {Number(item.unitPrice || 0).toFixed(2)}</p>
              <div className="cart-item__actions">
                <label className="muted">{t('cart_quantity')}</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(event) => updateQuantity(index, event.target.value)}
                  style={{ maxWidth: 120 }}
                />
                <button className="btn secondary" type="button" onClick={() => removeItem(index)}>{t('cart_remove')}</button>
              </div>
            </div>
          </article>
        ))}
        <p className="muted" style={{ margin: 0 }}>{t('cart_subtotal')}: SYP {subtotal.toFixed(2)}</p>
      </div>

      <form className="card checkout-form" onSubmit={onSubmit}>
        <div className="stack">
          <label className="muted">{t('checkout_full_name')}</label>
          <input className="input" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
          <label className="muted">{t('checkout_phone')}</label>
          <input className="input" value={phone} onChange={(event) => setPhone(event.target.value)} required />
          <label className="muted">{t('checkout_city')}</label>
          <input className="input" value={city} onChange={(event) => setCity(event.target.value)} required />
          <label className="muted">{t('checkout_notes')}</label>
          <textarea className="input" rows="3" value={notes} onChange={(event) => setNotes(event.target.value)} />
          <button className="btn" type="submit" disabled={isSubmitting || !cart.length}>
            {isSubmitting ? t('checkout_placing_order') : t('checkout_place_order')}
          </button>
        </div>
      </form>
    </section>
  )
}
