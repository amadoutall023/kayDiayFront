const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
const isLocalEnvironment = hostname === 'localhost' || hostname === '127.0.0.1';

export const API_BASE_URL = isLocalEnvironment
  ? 'http://localhost:3000/api'
  : 'https://kaydiayback.onrender.com/api';
