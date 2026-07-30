const BASE_URL = 'http://localhost:8080/api';

async function fetchAPI(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Fetch Error [${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  // Dashboard
  getStats: () => fetchAPI('/dashboard'),

  // Clients
  getClients: () => fetchAPI('/clients'),
  createClient: (client) => fetchAPI('/clients', { method: 'POST', body: client }),
  deleteClient: (id) => fetchAPI(`/clients/${id}`, { method: 'DELETE' }),

  // Cases
  getCases: () => fetchAPI('/cases'),
  createCase: (cs) => fetchAPI('/cases', { method: 'POST', body: cs }),
  updateCase: (id, cs) => fetchAPI(`/cases/${id}`, { method: 'PUT', body: cs }),
  deleteCase: (id) => fetchAPI(`/cases/${id}`, { method: 'DELETE' }),

  // Tasks
  getTasks: () => fetchAPI('/tasks'),
  createTask: (task) => fetchAPI('/tasks', { method: 'POST', body: task }),
  updateTask: (id, status) => fetchAPI(`/tasks/${id}`, { method: 'PUT', body: { status } }),
  deleteTask: (id) => fetchAPI(`/tasks/${id}`, { method: 'DELETE' }),

  // Billing
  getInvoices: () => fetchAPI('/invoices'),
  createInvoice: (inv) => fetchAPI('/invoices', { method: 'POST', body: inv }),
  updateInvoiceStatus: (id, status) => fetchAPI(`/invoices/${id}`, { method: 'PUT', body: { status } }),
  deleteInvoice: (id) => fetchAPI(`/invoices/${id}`, { method: 'DELETE' }),
};
