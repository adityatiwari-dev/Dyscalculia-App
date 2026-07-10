import axios from 'axios'
import { getToken } from '../auth'

const springClient = axios.create({
  baseURL: import.meta.env.VITE_PHASE2_API_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// Attach token if present
springClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: on 401 clear token and redirect to login
springClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status
    if (status === 401) {
      try {
        localStorage.removeItem('nc_token')
        localStorage.removeItem('nc_user')
        window.location = '/login'
      } catch (e) {}
    }
    return Promise.reject(err)
  }
)

export default springClient
