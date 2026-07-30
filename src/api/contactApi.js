import { http } from './client'

const contactApi = {
  sendMessage: (data) => http.post('/api/contact', {
    name: data.name,
    email: data.email,
    subject: data.subject,
    message: data.message,
  }),
}

export default contactApi
