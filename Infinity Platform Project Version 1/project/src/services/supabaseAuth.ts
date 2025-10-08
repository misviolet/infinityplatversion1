import { supabase, LoginUser } from '../lib/supabase';

class SupabaseAuthService {
  async validateCredentials(username: string, password: string): Promise<{ isValid: boolean; name?: string; role?: string }> {
    try {
      console.log('Attempting to validate credentials for username:', username);

      // Query the login table for matching credentials
      const { data, error } = await supabase
        .from('login')
        .select('*')
        .eq('user_name', username)
        .eq('password', password)
        .maybeSingle();

      console.log('Query result:', { data, error });

      // Check if there's an error
      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      // Check if no record was found
      if (!data) {
        console.log('No matching user found');
        return { isValid: false };
      }

      // Valid credentials found
      console.log('Valid credentials found for user:', data.name);
      return {
        isValid: true,
        name: data.name || username,
        role: data.role || 'User'
      };

    } catch (error) {
      console.error('Error validating credentials:', error);
      throw error;
    }
  }

  // Method to test the connection
  async testConnection(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('login')
        .select('count', { count: 'exact', head: true });
      
      return !error;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  // Method to get all users (for admin purposes)
  async getAllUsers(): Promise<LoginUser[]> {
    try {
      const { data, error } = await supabase
        .from('login')
        .select('*')
        .order('Name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Method to get all user names for dropdowns
  async getUserNames(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('login')
        .select('name')
        .order('name');

      if (error) throw error;
      return data?.map(user => user.name).filter(Boolean) || [];
    } catch (error) {
      console.error('Error fetching user names:', error);
      throw error;
    }
  }
}
export const supabaseAuth = new SupabaseAuthService();