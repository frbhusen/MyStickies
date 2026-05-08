import { apiRequest } from '../../lib/api/client'
import { endpoints } from '../../lib/api/endpoints'

export function createGuestOrder(payload) {
  return apiRequest(endpoints.orders, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
