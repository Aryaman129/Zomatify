import { User } from '@supabase/supabase-js';

export type AuthUser = User;

export interface AuthContextType {
  user: AuthUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
 