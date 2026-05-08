import { apiRequest } from '../../lib/api/client'
import { endpoints } from '../../lib/api/endpoints'

export function fetchCategories() {
  return apiRequest(endpoints.categories)
}

export function fetchProducts(params = new URLSearchParams()) {
  const query = params.toString() ? `?${params.toString()}` : ''
  return apiRequest(`${endpoints.products}${query}`)
}

export async function fetchProduct(slug) {
  const params = new URLSearchParams({ slug })
  const data = await apiRequest(`${endpoints.products}?${params.toString()}`)
  // DRF list response may be paginated
  const items = Array.isArray(data) ? data : data?.results || []
  return items[0] || null
}

export function fetchMostSold(params = new URLSearchParams()) {
  const q = params.toString() ? `?${params.toString()}` : ''
  return apiRequest(`${endpoints.products}${q}`)
}

export function fetchSearch(query) {
  const params = new URLSearchParams({ q: query })
  return apiRequest(`${endpoints.search}?${params.toString()}`)
}
