import { apiRequest } from '../../lib/api/client'
import { endpoints } from '../../lib/api/endpoints'

export function fetchAdminOrders() {
  return apiRequest(endpoints.adminOrders)
}

export function fetchAdminOrder(id) {
  return apiRequest(`${endpoints.adminOrders}${id}/`)
}

export function updateAdminOrderStatus(id, status) {
  return apiRequest(`${endpoints.adminOrders}${id}/status/`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}
