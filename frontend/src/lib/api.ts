import axios from 'axios'

// All requests go through the Next.js BFF proxy, which attaches the httpOnly token.
// The baseURL is relative so it works in both browser and SSR contexts.
export const api = axios.create({
  baseURL: '/api/proxy',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
