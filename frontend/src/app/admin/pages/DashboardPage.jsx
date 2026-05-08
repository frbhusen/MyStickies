import { Link } from 'react-router-dom'

export default function DashboardPage() {
  return (
    <section className="grid cards">
      <article className="card"><strong>Catalog management</strong><p className="muted">CSV import, product edits, image sync, and category tree maintenance.</p><p><Link className="btn secondary" to="/admin/catalog">Open catalog tools</Link></p></article>
      <article className="card"><strong>Order management</strong><p className="muted">Status pipeline from Pending to Delivered with WhatsApp shortcuts.</p><p><Link className="btn secondary" to="/admin/orders">Open orders</Link></p></article>
      <article className="card"><strong>Google Drive sync</strong><p className="muted">Manual links or service-account powered folder synchronization.</p></article>
    </section>
  )
}
