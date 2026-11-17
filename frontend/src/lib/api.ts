const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  token?: string;
}

async function apiRequest<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, token } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  if (activeToken) {
    (config.headers as Record<string, string>)['Authorization'] = `Bearer ${activeToken}`;
  }

  if (typeof window !== 'undefined') {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        if (u.role) (config.headers as Record<string, string>)['x-user-role'] = u.role;
        if (u.refId) (config.headers as Record<string, string>)['x-user-id'] = String(u.refId);
      } catch {}
    }
  }

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const errData = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(errData.error || errData.message || `HTTP ${response.status}`);
  }

  return response.json();
}

async function apiUpload(endpoint: string, formData: FormData, token?: string): Promise<any> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// ==================== AUTH ====================
export const authAPI = {
  login: (email: string, password?: string) =>
    apiRequest('/auth/login', { method: 'POST', body: { email, password } }),
  register: (data: any) => apiRequest('/auth/register', { method: 'POST', body: data }),
  sync: (data: any, token?: string) => apiRequest('/auth/sync', { method: 'POST', body: data, token }),
  me: (token: string) => apiRequest('/auth/me', { token }),
};

// ==================== PATIENTS ====================
export const patientsAPI = {
  getAll: (token?: string, search?: string) =>
    apiRequest(`/patients${search ? `?search=${search}` : ''}`, { token }),
  getById: (id: number, token?: string) => apiRequest(`/patients/${id}`, { token }),
  create: (data: any, token?: string) => apiRequest('/patients', { method: 'POST', body: data, token }),
  update: (id: number, data: any, token?: string) =>
    apiRequest(`/patients/${id}`, { method: 'PUT', body: data, token }),
  delete: (id: number, token?: string) => apiRequest(`/patients/${id}`, { method: 'DELETE', token }),
  getAppointments: (id: number, token?: string) => apiRequest(`/patients/${id}/appointments`, { token }),
  getPrescriptions: (id: number, token?: string) => apiRequest(`/patients/${id}/prescriptions`, { token }),
  getBills: (id: number, token?: string) => apiRequest(`/patients/${id}/bills`, { token }),
};

// ==================== DOCTORS ====================
export const doctorsAPI = {
  getAll: (token?: string, filters?: Record<string, string>) => {
    const params = new URLSearchParams(filters || {}).toString();
    return apiRequest(`/doctors${params ? `?${params}` : ''}`, { token });
  },
  getById: (id: number, token?: string) => apiRequest(`/doctors/${id}`, { token }),
  create: (data: any, token?: string) => apiRequest('/doctors', { method: 'POST', body: data, token }),
  update: (id: number, data: any, token?: string) =>
    apiRequest(`/doctors/${id}`, { method: 'PUT', body: data, token }),
  delete: (id: number, token?: string) => apiRequest(`/doctors/${id}`, { method: 'DELETE', token }),
  getPhones: (id: number, token?: string) => apiRequest(`/doctors/${id}/phones`, { token }),
  addPhone: (id: number, phone: string, token?: string) =>
    apiRequest(`/doctors/${id}/phones`, { method: 'POST', body: { phone_no: phone }, token }),
  removePhone: (id: number, phone: string, token?: string) =>
    apiRequest(`/doctors/${id}/phones/${phone}`, { method: 'DELETE', token }),
  getAvailability: (id: number, token?: string, date?: string) =>
    apiRequest(`/doctors/${id}/availability${date ? `?date=${date}` : ''}`, { token }),
  getAppointments: (id: number, token?: string) => apiRequest(`/doctors/${id}/appointments`, { token }),
};

// ==================== AVAILABILITY ====================
export const availabilityAPI = {
  getAll: (token?: string, filters?: Record<string, string>) => {
    const params = new URLSearchParams(filters || {}).toString();
    return apiRequest(`/availability${params ? `?${params}` : ''}`, { token });
  },
  create: (data: any, token?: string) =>
    apiRequest('/availability', { method: 'POST', body: data, token }),
  update: (id: number, data: any, token?: string) =>
    apiRequest(`/availability/${id}`, { method: 'PUT', body: data, token }),
  delete: (id: number, token?: string) =>
    apiRequest(`/availability/${id}`, { method: 'DELETE', token }),
};

// ==================== APPOINTMENTS ====================
export const appointmentsAPI = {
  getAll: (token?: string, filters?: Record<string, string>) => {
    const params = new URLSearchParams(filters || {}).toString();
    return apiRequest(`/appointments${params ? `?${params}` : ''}`, { token });
  },
  getById: (id: number, token?: string) => apiRequest(`/appointments/${id}`, { token }),
  book: (data: any, token?: string) =>
    apiRequest('/appointments', { method: 'POST', body: data, token }),
  reschedule: (id: number, data: any, token?: string) =>
    apiRequest(`/appointments/${id}/reschedule`, { method: 'PUT', body: data, token }),
  cancel: (id: number, token?: string) =>
    apiRequest(`/appointments/${id}/cancel`, { method: 'PUT', token }),
  complete: (id: number, token?: string) =>
    apiRequest(`/appointments/${id}/complete`, { method: 'PUT', token }),
};

// ==================== PRESCRIPTIONS ====================
export const prescriptionsAPI = {
  getAll: (token?: string, filters?: Record<string, string>) => {
    const params = new URLSearchParams(filters || {}).toString();
    return apiRequest(`/prescriptions${params ? `?${params}` : ''}`, { token });
  },
  getById: (id: number, token?: string) => apiRequest(`/prescriptions/${id}`, { token }),
  create: (data: any, token?: string) =>
    apiRequest('/prescriptions', { method: 'POST', body: data, token }),
  update: (id: number, data: any, token?: string) =>
    apiRequest(`/prescriptions/${id}`, { method: 'PUT', body: data, token }),
  delete: (id: number, token?: string) =>
    apiRequest(`/prescriptions/${id}`, { method: 'DELETE', token }),
};

// ==================== MEDICINES ====================
export const medicinesAPI = {
  getAll: (token?: string, filters?: Record<string, string>) => {
    const params = new URLSearchParams(filters || {}).toString();
    return apiRequest(`/medicines${params ? `?${params}` : ''}`, { token });
  },
  getById: (id: number, token?: string) => apiRequest(`/medicines/${id}`, { token }),
  create: (data: any, token?: string) =>
    apiRequest('/medicines', { method: 'POST', body: data, token }),
  update: (id: number, data: any, token?: string) =>
    apiRequest(`/medicines/${id}`, { method: 'PUT', body: data, token }),
  delete: (id: number, token?: string) =>
    apiRequest(`/medicines/${id}`, { method: 'DELETE', token }),
  updateStock: (id: number, quantity: number, token?: string) =>
    apiRequest(`/medicines/${id}/stock`, { method: 'PUT', body: { quantity }, token }),
};

// ==================== BILLS ====================
export const billsAPI = {
  getAll: (token?: string, filters?: Record<string, string>) => {
    const params = new URLSearchParams(filters || {}).toString();
    return apiRequest(`/bills${params ? `?${params}` : ''}`, { token });
  },
  getById: (id: number, token?: string) => apiRequest(`/bills/${id}`, { token }),
  generate: (data: any, token?: string) =>
    apiRequest('/bills', { method: 'POST', body: data, token }),
  update: (id: number, data: any, token?: string) =>
    apiRequest(`/bills/${id}`, { method: 'PUT', body: data, token }),
};

// ==================== PAYMENTS ====================
export const paymentsAPI = {
  getAll: (token?: string, filters?: Record<string, string>) => {
    const params = new URLSearchParams(filters || {}).toString();
    return apiRequest(`/payments${params ? `?${params}` : ''}`, { token });
  },
  getById: (id: number, token?: string) => apiRequest(`/payments/${id}`, { token }),
  create: (data: any, token?: string) =>
    apiRequest('/payments', { method: 'POST', body: data, token }),
};

// ==================== REPORTS (MongoDB) ====================
export const reportsAPI = {
  getAll: (token?: string, filters?: Record<string, string>) => {
    const params = new URLSearchParams(filters || {}).toString();
    return apiRequest(`/reports${params ? `?${params}` : ''}`, { token });
  },
  getById: (id: string, token?: string) => apiRequest(`/reports/${id}`, { token }),
  create: (data: any, token?: string) =>
    apiRequest('/reports', { method: 'POST', body: data, token }),
  update: (id: string, data: any, token?: string) =>
    apiRequest(`/reports/${id}`, { method: 'PUT', body: data, token }),
  delete: (id: string, token?: string) =>
    apiRequest(`/reports/${id}`, { method: 'DELETE', token }),
  upload: (formData: FormData, token?: string) => apiUpload('/storage/upload', formData, token),
};

// ==================== REVIEWS (MongoDB) ====================
export const reviewsAPI = {
  getAll: (token?: string, filters?: Record<string, string>) => {
    const params = new URLSearchParams(filters || {}).toString();
    return apiRequest(`/reviews${params ? `?${params}` : ''}`, { token });
  },
  getDoctorStats: (doctorId: number, token?: string) =>
    apiRequest(`/reviews/doctor/${doctorId}/stats`, { token }),
  create: (data: any, token?: string) =>
    apiRequest('/reviews', { method: 'POST', body: data, token }),
  update: (id: string, data: any, token?: string) =>
    apiRequest(`/reviews/${id}`, { method: 'PUT', body: data, token }),
  delete: (id: string, token?: string) =>
    apiRequest(`/reviews/${id}`, { method: 'DELETE', token }),
};

// ==================== AUDIT (MongoDB) ====================
export const auditAPI = {
  getAll: (token?: string, filters?: Record<string, string>) => {
    const params = new URLSearchParams(filters || {}).toString();
    return apiRequest(`/audit${params ? `?${params}` : ''}`, { token });
  },
};

// ==================== ANALYTICS ====================
export const analyticsAPI = {
  getStats: (token?: string) => apiRequest('/analytics/stats', { token }),
  getMonthlyRevenue: (token?: string) => apiRequest('/analytics/monthly-revenue', { token }),
  getAppointmentTrends: (token?: string) => apiRequest('/analytics/appointment-trends', { token }),
  getDoctorPerformance: (token?: string) => apiRequest('/analytics/doctor-performance', { token }),
};

// ==================== SQL EXPLORER ====================
export const sqlExplorerAPI = {
  getQueries: (token?: string) => apiRequest('/sql-explorer/queries', { token }),
  execute: (queryId: string, token?: string) =>
    apiRequest(`/sql-explorer/execute/${queryId}`, { method: 'POST', token }),
};

// ==================== ACID LAB ====================
export const acidLabAPI = {
  getInfo: (token?: string) => apiRequest('/acid-lab/info', { token }),
  runAtomicitySuccess: (token?: string) =>
    apiRequest('/acid-lab/atomicity/success', { method: 'POST', token }),
  runAtomicityFailure: (token?: string) =>
    apiRequest('/acid-lab/atomicity/failure', { method: 'POST', token }),
  runConsistency: (token?: string) =>
    apiRequest('/acid-lab/consistency', { method: 'POST', token }),
  runIsolation: (token?: string) =>
    apiRequest('/acid-lab/isolation', { method: 'POST', token }),
  runDurability: (token?: string) =>
    apiRequest('/acid-lab/durability', { method: 'POST', token }),
};

// ==================== ROLES ====================
export const rolesAPI = {
  getInfo: (token?: string) => apiRequest('/roles', { token }),
  getComparison: (token?: string) => apiRequest('/roles/app-vs-db', { token }),
};

// ==================== VECTOR SEARCH ====================
export const vectorSearchAPI = {
  search: (query: string, token?: string) =>
    apiRequest('/vector-search/search', { method: 'POST', body: { query }, token }),
  embed: (data: any, token?: string) =>
    apiRequest('/vector-search/embed', { method: 'POST', body: data, token }),
  getEmbeddings: (token?: string) => apiRequest('/vector-search/embeddings', { token }),
};

