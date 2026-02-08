import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Log detailed error for debugging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      data: error.config?.data,
      status: error.response?.status,
      response: error.response?.data
    });

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  signup: async (userData) => {
    try {
      const response = await api.post('/users/signup', userData);
      
      // Store token if provided
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      
      return response.data;
    } catch (error) {
      console.error('Signup API Error:', error.response?.data);
      throw error;
    }
  },
  
  login: async (credentials) => {
    try {
      console.log('🔐 Attempting login with:', { email: credentials.email });
      
      const response = await api.post('/users/login', {
        email: credentials.email,
        password: credentials.password
      });
      
      console.log('✅ Login API Response:', response.data);
      
      // Store token if provided
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Login API Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },
  
  logout: async () => {
    try {
      const response = await api.post('/users/logout');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return response.data;
    } catch (error) {
      console.error('Logout API Error:', error.response?.data);
      // Clear local storage even if API call fails
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw error;
    }
  },
};

export default api;

// Additional API endpoints for products and inquiries
export const productAPI = {
  create: (data) => api.post('/products', data),
  getFarmerProducts: (params) => api.get('/products/farmer', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getAnalytics: () => api.get('/products/analytics')
};

export const inquiryAPI = {
  create: (data) => api.post('/inquiries', data),
  getFarmerInquiries: (params) => api.get('/inquiries/farmer', { params }),
  getMerchantInquiries: (params) => api.get('/inquiries/merchant', { params }),
  getInquiry: (id) => api.get(`/inquiries/${id}`),
  respond: (id, data) => api.put(`/inquiries/${id}/respond`, data),
  updateStatus: (id, data) => api.put(`/inquiries/${id}/status`, data)
};

// Merchant API endpoints
export const merchantAPI = {
  browseProducts: (params) => api.get('/merchant/products', { params }),
  getProductCategories: () => api.get('/merchant/products/categories'),
  getSearchSuggestions: (params) => api.get('/merchant/products/search', { params }),
  getFarmerProfile: (farmerId) => api.get(`/merchant/farmers/${farmerId}`),
  getAnalytics: () => api.get('/merchant/analytics'),
  getCart: () => api.get('/merchant/cart'),
  addToCart: (data) => api.post('/merchant/cart', data),
  updateCartItem: (data) => api.put('/merchant/cart', data),
  removeFromCart: (productId) => api.delete(`/merchant/cart/${productId}`),
  clearCart: () => api.delete('/merchant/cart'),
  getWishlist: () => api.get('/merchant/wishlist'),
  addToWishlist: (data) => api.post('/merchant/wishlist', data),
  removeFromWishlist: (productId) => api.delete(`/merchant/wishlist/${productId}`),
  clearWishlist: () => api.delete('/merchant/wishlist'),
  moveToCart: (data) => api.post('/merchant/wishlist/move-to-cart', data)
};

// Admin API endpoints
export const adminAPI = {
  getAnalytics: () => api.get('/admin/analytics'),
  getActivityDistribution: () => api.get('/admin/activity-distribution'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getTopPerformers: () => api.get('/admin/top-performers'),
  getActivities: (params) => api.get('/admin/activities', { params }),
  getTransactions: (params) => api.get('/admin/transactions', { params })
};

// Chat API endpoints
export const chatAPI = {
  getUserChats: () => api.get('/chat'),
  getUnreadCount: () => api.get('/chat/unread-count'),
  createChat: (data) => api.post('/chat', data),
  getChatMessages: (chatId) => api.get(`/chat/${chatId}`),
  sendMessage: (chatId, data) => api.post(`/chat/${chatId}/messages`, data)
};
