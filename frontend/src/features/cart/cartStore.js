import { readJSON, writeJSON } from '../../lib/storage/localStorage'

const STORAGE_KEY = 'my-stickies-cart'

export function getCart() {
  return readJSON(STORAGE_KEY, [])
}

export function setCart(items) {
  writeJSON(STORAGE_KEY, items)
}

export function addToCart(item) {
  const cart = getCart()
  const existingIndex = cart.findIndex(
    (entry) => entry.productId === item.productId && entry.variationId === item.variationId,
  )

  if (existingIndex >= 0) {
    cart[existingIndex] = {
      ...cart[existingIndex],
      ...item,
      quantity: Number(cart[existingIndex].quantity || 0) + Number(item.quantity || 0),
    }
  } else {
    cart.push({ ...item })
  }

  setCart(cart)
  try {
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: cart.reduce((s, i) => s + (i.quantity || 0), 0), items: cart } }))
  } catch (e) {}
  return cart
}
