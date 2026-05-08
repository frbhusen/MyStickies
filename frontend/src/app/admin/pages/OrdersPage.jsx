import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAdminOrders, updateAdminOrderStatus } from '../../../features/adminOrders/api'

const STATUS_OPTIONS = ['pending', 'confirmed', 'shipped', 'delivered', 'canceled']

function unwrapListResponse(data) {
  return Array.isArray(data) ? data : data?.results || []
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  async function loadOrders() {
    setIsLoading(true)
    try {
      const data = await fetchAdminOrders()
      setOrders(unwrapListResponse(data))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  async function onStatusChange(orderId, status) {
    await updateAdminOrderStatus(orderId, status)
    await loadOrders()
  }

  return (
    <section className="panel stack">
      <h2 className="section-title">Orders</h2>
      {isLoading ? <p className="muted">Loading orders...</p> : null}
      {orders.map((order) => (
        <article key={order.id} className="card stack">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <strong>{order.order_number}</strong>
              <p className="muted" style={{ margin: '8px 0 0' }}>{order.customer_full_name} · {order.city}</p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <select value={order.status} onChange={(event) => onStatusChange(order.id, event.target.value)}>
                {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <Link className="btn secondary" to={`/admin/orders/${order.id}`}>Open</Link>
            </div>
          </div>
          <p className="muted" style={{ margin: 0 }}>Subtotal: {order.subtotal} · Shipping: {order.shipping_fee} · Total: {order.total}</p>
        </article>
      ))}
    </section>
  )
}
