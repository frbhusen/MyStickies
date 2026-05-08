export function formatSyrianPhoneForWhatsApp(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (!digits) return ''

  let normalized = digits
  if (normalized.startsWith('09')) {
    normalized = normalized.slice(1)
  }
  if (normalized.startsWith('963')) {
    normalized = normalized.slice(3)
  }

  return `00963${normalized}`
}

export function buildWhatsAppLink(phone) {
  const digits = formatSyrianPhoneForWhatsApp(phone).replace(/^00/, '')
  return digits ? `https://wa.me/${digits}` : ''
}
