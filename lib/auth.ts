// Authentication utilities and context for Google OAuth integration
import { User } from './types';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

class AuthService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  async checkAuthStatus(): Promise<{
    user: User | null;
    isAuthenticated: boolean;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/user`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data: { success: boolean; user?: User } = await response.json();
        // Only consider authenticated if success is true and user exists
        if (data.success && data.user) {
          return {
            user: data.user,
            isAuthenticated: true,
          };
        }
      }

      return { user: null, isAuthenticated: false };
    } catch (error) {
      console.error('Auth status check failed:', error);
      return { user: null, isAuthenticated: false };
    }
  }

  async getProfile(): Promise<User | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/user`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data: { success: boolean; user?: User } = await response.json();
        // Only return user if success is true and user exists
        if (data.success && data.user) {
          return data.user;
        }
      }

      return null;
    } catch (error) {
      console.error('Profile fetch failed:', error);
      return null;
    }
  }

  initiateGoogleLogin() {
    window.location.href = `${this.baseUrl}/api/auth/google`;
  }

  async logout(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/logout`, {
        method: 'GET',
        credentials: 'include',
      });

      return response.ok;
    } catch (error) {
      console.error('Logout failed:', error);
      return false;
    }
  }
}

export const authService = new AuthService();
