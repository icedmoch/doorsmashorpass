/**
 * API Service Layer
 * Centralized API calls to the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ==================== HELPER FUNCTIONS ====================

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `API Error: ${response.status}`);
  }
  return response.json();
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return handleResponse<T>(response);
}

// ==================== NUTRITION API ====================

export interface FoodItem {
  id: number;
  name: string;
  calories: number;
  protein: number;
  total_carb: number;
  total_fat: number;
  serving_size: string;
  location?: string;
  date?: string;
  meal_type?: string;
  sodium?: number;
  dietary_fiber?: number;
  sugars?: number;
}

export interface MealEntry {
  id: number;
  profile_id: string;
  food_item_id: number;
  meal_category: string;
  entry_date: string;
  servings: number;
  food_name?: string;
  calories?: number;
  protein?: number;
  total_carb?: number;
  total_fat?: number;
  serving_size?: string;
  location?: string;
}

export interface DailyTotals {
  date: string;
  calories: number;
  total_fat: number;
  sodium: number;
  total_carb: number;
  dietary_fiber: number;
  sugars: number;
  protein: number;
  meal_count: number;
}

export interface MealsByCategory {
  Breakfast: MealEntry[];
  Lunch: MealEntry[];
  Dinner: MealEntry[];
}

export interface UserProfile {
  id: string;
  age: number;
  sex: string;
  height_cm: number;
  weight_kg: number;
  activity_level: number;
  bmr: number;
  tdee: number;
  email?: string;
  full_name?: string;
}

// Nutrition API calls
export const nutritionApi = {
  // Food items
  async searchFoodItems(query: string, limit: number = 50, date?: string): Promise<FoodItem[]> {
    // Empty query is allowed - it returns all items (filtered by date if provided)
    const params = new URLSearchParams({ q: query || "", limit: limit.toString() });
    if (date) {
      params.append('date', date);
    }
    return apiRequest(`/api/nutrition/food-items/search?${params.toString()}`);
  },

  async getAvailableDates(): Promise<{ dates: string[]; count: number }> {
    return apiRequest('/api/nutrition/food-items/available-dates');
  },

  async getFoodItem(id: number): Promise<FoodItem> {
    return apiRequest(`/api/nutrition/food-items/${id}`);
  },

  async listFoodItems(limit: number = 100, offset: number = 0): Promise<FoodItem[]> {
    return apiRequest(`/api/nutrition/food-items?limit=${limit}&offset=${offset}`);
  },

  async getMenuByLocationDate(location: string, date: string): Promise<{ [key: string]: FoodItem[] }> {
    return apiRequest(`/api/nutrition/food-items/location/${encodeURIComponent(location)}/date/${date}`);
  },

  async createFoodItem(data: Partial<FoodItem>): Promise<FoodItem> {
    return apiRequest('/api/nutrition/food-items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Meal entries
  async createMealEntry(data: {
    profile_id: string;
    food_item_id: number;
    meal_category: string;
    servings?: number;
    entry_date?: string;
  }): Promise<MealEntry> {
    return apiRequest('/api/nutrition/meals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMealEntry(id: number): Promise<MealEntry> {
    return apiRequest(`/api/nutrition/meals/${id}`);
  },

  async updateMealEntry(id: number, servings: number): Promise<MealEntry> {
    return apiRequest(`/api/nutrition/meals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ servings }),
    });
  },

  async deleteMealEntry(id: number): Promise<void> {
    return apiRequest(`/api/nutrition/meals/${id}`, {
      method: 'DELETE',
    });
  },

  async getTodaysMeals(userId: string): Promise<MealsByCategory> {
    return apiRequest(`/api/nutrition/meals/user/${userId}/today`);
  },

  async getMealsByDate(userId: string, date: string): Promise<MealsByCategory> {
    return apiRequest(`/api/nutrition/meals/user/${userId}/date/${date}`);
  },

  async getMealHistory(userId: string, days: number = 7): Promise<{
    profile_id: string;
    start_date: string;
    end_date: string;
    meals_by_date: { [date: string]: MealsByCategory };
    daily_totals: { [date: string]: DailyTotals };
  }> {
    return apiRequest(`/api/nutrition/meals/user/${userId}/history?days=${days}`);
  },

  // Nutrition totals
  async getTodaysTotals(userId: string): Promise<DailyTotals> {
    return apiRequest(`/api/nutrition/totals/user/${userId}/today`);
  },

  async getDailyTotals(userId: string, date: string): Promise<DailyTotals> {
    return apiRequest(`/api/nutrition/totals/user/${userId}/date/${date}`);
  },

  // User profile
  async getProfile(userId: string): Promise<UserProfile> {
    return apiRequest(`/api/nutrition/profiles/${userId}`);
  },

  async createOrUpdateProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    return apiRequest(`/api/nutrition/profiles/${userId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    return apiRequest(`/api/nutrition/profiles/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// ==================== ORDERS API ====================

export interface OrderItem {
  food_item_id: number;
  quantity: number;
}

export interface Order {
  id: string;
  user_id: string;
  delivery_location: string;
  delivery_time?: string;
  special_instructions?: string;
  status: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  created_at: string;
  updated_at: string;
  items?: OrderItemDetail[];
}

export interface OrderItemDetail {
  id: string;
  order_id: string;
  food_item_id: number;
  food_item_name: string;
  quantity: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  created_at: string;
}

// Orders API calls
export const ordersApi = {
  async createOrder(data: {
    user_id: string;
    delivery_location: string;
    delivery_time?: string;
    special_instructions?: string;
    items: OrderItem[];
  }): Promise<Order> {
    return apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getOrder(orderId: string): Promise<Order> {
    return apiRequest(`/orders/${orderId}`);
  },

  async listOrders(params?: {
    user_id?: string;
    status?: string;
    limit?: number;
  }): Promise<Order[]> {
    const searchParams = new URLSearchParams();
    if (params?.user_id) searchParams.append('user_id', params.user_id);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    
    const query = searchParams.toString();
    return apiRequest(`/orders${query ? '?' + query : ''}`);
  },

  async getUserOrders(userId: string, status?: string, limit: number = 20): Promise<Order[]> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (status) params.append('status', status);
    return apiRequest(`/users/${userId}/orders?${params.toString()}`);
  },

  async updateOrder(orderId: string, data: {
    delivery_location?: string;
    delivery_time?: string;
    special_instructions?: string;
  }): Promise<Order> {
    return apiRequest(`/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    return apiRequest(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async addOrderItem(orderId: string, item: OrderItem): Promise<Order> {
    return apiRequest(`/orders/${orderId}/items`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  async deleteOrderItem(orderId: string, itemId: string): Promise<void> {
    return apiRequest(`/orders/${orderId}/items/${itemId}`, {
      method: 'DELETE',
    });
  },

  async cancelOrder(orderId: string): Promise<void> {
    return apiRequest(`/orders/${orderId}`, {
      method: 'DELETE',
    });
  },
};

export default {
  nutritionApi,
  ordersApi,
};
