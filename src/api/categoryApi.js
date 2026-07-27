import { http } from './client'

/** Maps to Spring Boot: GET /api/categories */
const categoryApi = {
  list: () => http.get('/api/categories'),
}

export default categoryApi
