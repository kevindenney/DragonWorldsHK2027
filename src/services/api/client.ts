import { apiConfig } from '../../config/firebase';
import { 
  User, 
  OAuthLoginResponse, 
  AuthProvider, 
  LinkedProvider,
  AccountLinkingRequest 
} from '../../types/auth';

/**
 * API Response wrapper
 */
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * HTTP Client configuration
 */
class ApiClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseURL = `${apiConfig.baseURL}/api/${apiConfig.apiVersion}`;
    this.timeout = apiConfig.timeout;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string) {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Clear authentication token
   */
  clearAuthToken() {
    delete this.defaultHeaders['Authorization'];
  }

  /**
   * Make HTTP request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      timeout: this.timeout,
    };

    try {
      if (__DEV__) {
        console.log(`🌐 API ${config.method || 'GET'}: ${url}`);
        if (config.body) {
          console.log('📤 Request Body:', config.body);
        }
      }

      const response = await fetch(url, config);
      const data = await response.json();

      if (__DEV__) {
        console.log(`📥 API Response (${response.status}):`, data);
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || 'Request failed',
          data: data
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message
      };
    } catch (error) {
      console.error('API Request Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

/**
 * Authentication API client
 */
export class AuthApiClient extends ApiClient {
  
  /**
   * Login with Google OAuth
   */
  async loginWithGoogle(idToken: string): Promise<ApiResponse<OAuthLoginResponse>> {
    return this.post('/auth/oauth/google', { idToken });
  }

  /**
   * Login with Apple OAuth
   */
  async loginWithApple(idToken: string): Promise<ApiResponse<OAuthLoginResponse>> {
    return this.post('/auth/oauth/apple', { idToken });
  }

  /**
   * Register with email/password
   */
  async register(userData: {
    email: string;
    password: string;
    displayName: string;
    phoneNumber?: string;
  }): Promise<ApiResponse<OAuthLoginResponse>> {
    return this.post('/auth/register', userData);
  }

  /**
   * Login with email/password
   */
  async login(credentials: {
    email: string;
    password: string;
  }): Promise<ApiResponse<OAuthLoginResponse>> {
    return this.post('/auth/login', credentials);
  }

  /**
   * Logout user
   */
  async logout(): Promise<ApiResponse<void>> {
    return this.post('/auth/logout');
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<ApiResponse<void>> {
    return this.post('/auth/reset-password', { email });
  }

  /**
   * Change password
   */
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<void>> {
    return this.post('/auth/change-password', data);
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<ApiResponse<void>> {
    return this.post('/auth/verify-email', { token });
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<ApiResponse<{ accessToken: string; expiresIn: number }>> {
    return this.post('/auth/refresh-token');
  }

  /**
   * Get OAuth configuration
   */
  async getOAuthConfig(): Promise<ApiResponse<any>> {
    return this.get('/auth/oauth/config');
  }

  /**
   * Get available OAuth providers
   */
  async getAvailableProviders(): Promise<ApiResponse<{
    providers: Array<{
      provider: string;
      name: string;
      enabled: boolean;
      clientId?: string;
    }>;
    count: number;
  }>> {
    return this.get('/auth/oauth/providers/available');
  }

  /**
   * Link OAuth provider to account
   */
  async linkProvider(request: AccountLinkingRequest): Promise<ApiResponse<User>> {
    return this.post('/auth/oauth/link', request);
  }

  /**
   * Unlink OAuth provider from account
   */
  async unlinkProvider(provider: AuthProvider): Promise<ApiResponse<User>> {
    return this.delete(`/auth/oauth/unlink/${provider}`);
  }

  /**
   * Get user's linked providers
   */
  async getUserProviders(): Promise<ApiResponse<{
    providers: LinkedProvider[];
    hasPassword: boolean;
    canUnlinkProviders: boolean;
  }>> {
    return this.get('/auth/oauth/providers');
  }

  /**
   * Set primary OAuth provider
   */
  async setPrimaryProvider(provider: AuthProvider): Promise<ApiResponse<User>> {
    return this.put('/auth/oauth/primary', { provider });
  }
}

/**
 * User API client
 */
export class UserApiClient extends ApiClient {

  /**
   * Get user profile
   */
  async getProfile(): Promise<ApiResponse<User>> {
    return this.get('/users/profile');
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return this.put('/users/profile', data);
  }

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(file: File | Blob): Promise<ApiResponse<{ photoURL: string }>> {
    const formData = new FormData();
    formData.append('avatar', file);

    // Create headers without Content-Type for FormData (browser sets boundary automatically)
    const { 'Content-Type': _, ...headersWithoutContentType } = this.defaultHeaders;

    return this.request('/users/profile/avatar', {
      method: 'POST',
      body: formData,
      headers: headersWithoutContentType,
    });
  }

  /**
   * Delete user account
   */
  async deleteAccount(): Promise<ApiResponse<void>> {
    return this.delete('/users/profile');
  }
}

// Export singleton instances
export const authApi = new AuthApiClient();
export const userApi = new UserApiClient();

// Export default client
export default new ApiClient();