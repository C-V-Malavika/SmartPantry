// src/services/api.ts
export interface User {
  id: number;
  email: string;
  name: string;
  is_admin?: boolean;
  created_at: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  admin_secret_key?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

class ApiService {
  private baseURL = 'http://localhost:8000';
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (this.token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${this.token}`,
      };
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        let message = "Request failed";

        // FastAPI validation error format
        if (Array.isArray(errorData.detail)) {
          message = errorData.detail[0]?.msg || message;
        }
        // Standard FastAPI error
        else if (typeof errorData.detail === "string") {
          message = errorData.detail;
        }

        if (message.includes(":")) {
          message = message.split(":")[1].trim();
        } else {
          message = message;
        }

        throw new Error(message);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  async login(loginData: LoginData): Promise<AuthResponse> {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
    });
  }

  async signup(signupData: SignupData): Promise<User> {
    return this.request('/register', {
      method: 'POST',
      body: JSON.stringify(signupData),
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request('/users/me');
  }

  isAuthenticated(): boolean {
    // Check both instance token and localStorage
    const token = this.token || localStorage.getItem('auth_token');
    return !!token;
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }

  async uploadImage(file: File, folder: 'ingredients' | 'food', name: string): Promise<{ filename: string; path: string; url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    formData.append('name', name);

    // Get fresh token from localStorage
    const token = localStorage.getItem('auth_token') || this.token;

    const url = `${this.baseURL}/admin/upload-image`;
    const config: RequestInit = {
      method: 'POST',
      body: formData,
      headers: {},
    };

    // Don't set Content-Type for FormData - browser will set it with boundary
    if (token) {
      config.headers = {
        'Authorization': `Bearer ${token}`,
      };
    } else {
      throw new Error('Not authenticated. Please log in again.');
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.detail || 'Failed to upload image';
        throw new Error(message);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }
}

export const apiService = new ApiService();