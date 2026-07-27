import { http } from './client'

/** Maps to Spring Boot: GET /api/products/:id/reviews */
const reviewApi = {
  listByProduct: (productId) => http.get(`/api/products/${productId}/reviews`),
}

export default reviewApi
