import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api' || 'https://greentrace-updated.onrender.com/api',
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

  googleAuth: async (payload) => {
    try {
      const response = await api.post('/users/google-auth', payload);

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }

      return response.data;
    } catch (error) {
      console.error('Google Auth API Error:', error.response?.data);
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

// Merchant community API endpoints
export const merchantCommunityAPI = {
  getMerchants: (params) => api.get('/merchant-community/merchants', { params }),
  getListings: (params) => api.get('/merchant-community/listings', { params }),
  createListing: (data) => api.post('/merchant-community/listings', data),
  updateListing: (listingId, data) => api.put(`/merchant-community/listings/${listingId}`, data),
  deleteListing: (listingId) => api.delete(`/merchant-community/listings/${listingId}`),
  getChats: () => api.get('/merchant-community/chats'),
  createChat: (data) => api.post('/merchant-community/chats', data),
  getChatMessages: (chatId) => api.get(`/merchant-community/chats/${chatId}`),
  sendMessage: (chatId, data) => api.post(`/merchant-community/chats/${chatId}/messages`, data)
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

export const assistantAPI = {
  chat: (data) => api.post('/assistant/chat', data),
  transcribeAudio: (data) => api.post('/assistant/transcribe', data)
};

// Equipment API endpoints
export const equipmentAPI = {
  // Equipment CRUD
  create: (formData) => api.post('/equipment', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getMyEquipment: (params) => api.get('/equipment/my-equipment', { params }),
  browseEquipment: (params) => api.get('/equipment/browse', { params }),
  getEquipmentById: (id) => api.get(`/equipment/${id}`),
  update: (id, formData) => api.put(`/equipment/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateStatus: (id, data) => api.patch(`/equipment/${id}/status`, data),
  delete: (id) => api.delete(`/equipment/${id}`),
  getAnalytics: () => api.get('/equipment/analytics'),

  // Bookings
  createBooking: (data) => api.post('/equipment/bookings', data),
  getMyBookings: (params) => api.get('/equipment/bookings/my-bookings', { params }),
  getBookingRequests: (params) => api.get('/equipment/bookings/requests', { params }),
  getBookingById: (id) => api.get(`/equipment/bookings/${id}`),
  updateBookingStatus: (id, data) => api.patch(`/equipment/bookings/${id}/status`, data),
  checkAvailability: (params) => api.get('/equipment/bookings/check-availability', { params }),
  getRenterAnalytics: () => api.get('/equipment/bookings/renter-analytics'),

  // Reviews
  createReview: (data) => api.post('/equipment/reviews', data),
  getEquipmentReviews: (equipmentId, params) => api.get(`/equipment/reviews/${equipmentId}`, { params }),
  getMyReviews: (params) => api.get('/equipment/reviews/my-reviews', { params }),
  canReview: (bookingId) => api.get(`/equipment/reviews/can-review/${bookingId}`),

  // Chats
  getEquipmentChats: () => api.get('/equipment/chats'),
  getUnreadCount: () => api.get('/equipment/chats/unread'),
  createEquipmentChat: (data) => api.post('/equipment/chats', data),
  getChatMessages: (chatId) => api.get(`/equipment/chats/${chatId}`),
  sendMessage: (chatId, data) => api.post(`/equipment/chats/${chatId}/messages`, data)
};

// Market price API endpoints
export const marketPriceAPI = {
  getLive: (params) => api.get('/market-prices/live', { params }),
  getCommodities: (params) => api.get('/market-prices/commodities', { params }),
  getOptions: (params) => api.get('/market-prices/options', { params }),
  geocode: (params) => api.get('/market-prices/geocode', { params }),
};

export const farmerAPI = {
  getGovernmentSchemes: (params) => api.get('/users/government-schemes', { params }),
};
