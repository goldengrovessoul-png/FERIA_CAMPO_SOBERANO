const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = {
  async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('fcs_token');
    const isFormData = options.body instanceof FormData;
    
    const headers: any = {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    } else {
      // Importante: Al enviar FormData, NO debemos poner Content-Type manualmente
      // para que el navegador ponga el boundary correcto.
      delete headers['Content-Type'];
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error en la petición');
    }

    return data;
  },

  get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint: string, body: any, options: any = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options
    });
  },

  put(endpoint: string, body: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  },
};
