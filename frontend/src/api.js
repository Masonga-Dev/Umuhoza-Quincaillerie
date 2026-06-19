import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:4000/api',
});

// Auto-attach token; strip Content-Type for FormData so browser sets the multipart boundary
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('umuhoza_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    // Let the browser set Content-Type with the correct multipart boundary
    delete config.headers['Content-Type'];
  } else {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

// On 401, clear stored credentials and redirect to login
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('umuhoza_token');
      localStorage.removeItem('umuhoza_user');
      if (window.location.pathname !== '/admin') {
        window.location.href = '/admin';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
