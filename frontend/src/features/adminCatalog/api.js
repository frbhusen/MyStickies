import { apiRequest } from '../../lib/api/client'
import { endpoints } from '../../lib/api/endpoints'

export function fetchAdminCategories() {
  return apiRequest(endpoints.adminCategories)
}

export function createAdminCategory(payload) {
  return apiRequest(endpoints.adminCategories, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateAdminCategory(id, payload) {
  return apiRequest(`${endpoints.adminCategories}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function fetchAdminProducts(params = {}) {
  const query = new URLSearchParams()
  if (params.category) {
    query.set('category', params.category)
  }
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return apiRequest(`${endpoints.adminProducts}${suffix}`)
}

export function fetchAdminVariations() {
  return apiRequest(endpoints.adminVariations)
}

export function createAdminProduct(payload) {
  return apiRequest(endpoints.adminProducts, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateAdminProduct(id, payload) {
  return apiRequest(`${endpoints.adminProducts}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function updateAdminVariation(id, payload) {
  return apiRequest(`${endpoints.adminVariations}${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function createAdminVariation(payload) {
  return apiRequest(endpoints.adminVariations, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function createAdminProductImage(payload) {
  return apiRequest(endpoints.adminImages, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function uploadProductCsv(file) {
  const formData = new FormData()
  formData.append('file', file)
  return apiRequest(`${endpoints.adminProducts}bulk-import/`, {
    method: 'POST',
    body: formData,
  })
}

export function deleteAdminProduct(id) {
  return apiRequest(`${endpoints.adminProducts}${id}/`, {
    method: 'DELETE',
  })
}

export function deleteAdminCategory(id) {
  return apiRequest(`${endpoints.adminCategories}${id}/`, {
    method: 'DELETE',
  })
}

export function deleteAdminVariation(id) {
  return apiRequest(`${endpoints.adminVariations}${id}/`, {
    method: 'DELETE',
  })
}
