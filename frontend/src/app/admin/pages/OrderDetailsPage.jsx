import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchAdminOrder, updateAdminOrderStatus } from '../../../features/adminOrders/api'

export default function OrderDetailsPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)

  async function loadOrder() {
    const data = await fetchAdminOrder(id)
    setOrder(data)
  }

  useEffect(() => {
    loadOrder()
  }, [id])

  async function onStatusChange(event) {
    await updateAdminOrderStatus(id, event.target.value)
    await loadOrder()
  }

  if (!order) {
    return <section className="panel"><p className="muted">Loading order...</p></section>
  }

  return (
    <section className="panel stack">
      <h2 className="section-title">Order details · {order.order_number}</h2>
      <p className="muted" style={{ margin: 0 }}>{order.customer_full_name} · {order.city} · {order.phone_number}</p>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <label htmlFor="order-status" className="muted">Status</label>
        <select id="order-status" value={order.status} onChange={onStatusChange}>
          <option value="pending">pending</option>
          <option value="confirmed">confirmed</option>
          <option value="shipped">shipped</option>
          <option value="delivered">delivered</option>
          <option value="canceled">canceled</option>
        </select>
      </div>
      <a className="btn secondary" href={order.whatsapp_link} target="_blank" rel="noreferrer">
        Click to WhatsApp
      </a>
      <div className="stack">
        {order.items?.map((item) => (
          <article className="card" key={item.id}>
            <strong>{item.product_name}</strong>
            <p className="muted" style={{ margin: '8px 0 0' }}>
              {item.variation_name || 'default'} · Qty {item.quantity} · Unit {item.unit_price} · Total {item.line_total}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
