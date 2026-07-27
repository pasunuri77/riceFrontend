import { http } from './client'

/** Maps to Spring Boot: GET /api/brands */
const brandApi = {
  list: () => http.get('/api/brands'),
}

export default brandApi
