import { apiRequest } from '../../lib/api/client'
import { endpoints } from '../../lib/api/endpoints'

export function createOrder(payload) {
  return apiRequest(endpoints.orders, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
