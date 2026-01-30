import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';

// Helper function to fetch profile with retry
async function fetchProfileWithRetry(userId: string, maxRetries = 3, delayMs = 500): Promise<any> {
  for (let i = 0; i < maxRetries; i++) {
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error) {
      return profile;
    }

    // If last attempt, throw error
    if (i === maxRetries - 1) {
      throw new Error(`Profile fetch failed after ${maxRetries} attempts: ${error.message}`);
    }

    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}

export const authService = {
  async login(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Login failed');

    const profile = await fetchProfileWithRetry(data.user.id);

    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role as UserRole,
      avatarUrl: profile.avatar_url || undefined
    };
  },

  async register(name: string, email: string, role: UserRole, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role }
      }
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Registration failed');

    const userId = data.user.id;

    // Manually create user profile in case trigger didn't fire
    try {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email,
          name,
          role: role as UserRole,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
        });

      if (insertError) {
        console.warn('Insert error (might be duplicate):', insertError);
        // If it's a duplicate key error, that's ok - the trigger already created it
        // Otherwise throw
        if (!insertError.message.includes('duplicate')) {
          throw insertError;
        }
      }
    } catch (err) {
      console.error('Error creating user profile:', err);
      // Don't fail - try to fetch the profile instead
    }

    // Fetch the created profile
    const profile = await fetchProfileWithRetry(userId, 3, 200);

    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role as UserRole,
      avatarUrl: profile.avatar_url || undefined
    };
  },

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  getCurrentUser(): User | null {
    return null;
  },

  async refreshCurrentUser(): Promise<User | null> {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) return null;

    try {
      const profile = await fetchProfileWithRetry(session.user.id, 2, 300);
      return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role as UserRole,
        avatarUrl: profile.avatar_url || undefined
      };
    } catch (err) {
      console.error('Error refreshing user:', err);
      return null;
    }
  },

  // Dev-only: Quick login with email only (for dev menu)
  async devLogin(email: string, password: string = 'password123'): Promise<User> {
    return this.login(email, password);
  }
};
