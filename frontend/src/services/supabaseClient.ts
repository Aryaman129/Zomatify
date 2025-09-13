import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client using environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase credentials are missing. Make sure to set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in your .env file');
}

// Create client with explicit storage configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-application-name': 'zomatify'
    }
  }
});

// Types for the realtime subscription
export type RealtimeSubscriptionCallback = (payload: any) => void;

type PostgresChangesFilter = {
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema: string;
  table: string;
  filter?: string;
};

// Add Supabase realtime subscription for notifications
export const subscribeToRealtimeUpdates = (
  tableName: string, 
  callback: RealtimeSubscriptionCallback,
  options?: { filter?: string }
) => {
  // Create a unique channel ID
  const channelId = `public:${tableName}:${Date.now()}`;
  
  // Create the subscription with optional filter
  const filter: PostgresChangesFilter = { 
    event: '*', 
    schema: 'public', 
    table: tableName 
  };
  
  if (options?.filter) {
    filter.filter = options.filter;
  }
  
  // Create the channel and subscribe
  const channel = supabase.channel(channelId);
  
  // Use type assertion to work around TypeScript constraints
  // This is safe because we're using the documented Supabase API
  channel.on(
    'postgres_changes' as any, 
    filter,
    callback
  );
  
  // Subscribe to the channel
  channel.subscribe();

  // Return cleanup function
  return () => {
    supabase.removeChannel(channel);
  };
};

export default supabase;
