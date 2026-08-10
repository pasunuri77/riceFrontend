import { http } from './client'

/** Maps to Spring Boot: GET/POST /api/products/:id/reviews */
const reviewApi = {
  listByProduct: (productId) => http.get(`/api/products/${productId}/reviews`),
  submit: (productId, { rating, comment }) =>
    http.post(`/api/products/${productId}/reviews`, { rating, comment }),
}

export default reviewApi
