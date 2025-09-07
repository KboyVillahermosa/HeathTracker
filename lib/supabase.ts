import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://hlltepsgicnvdzxdozpv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsbHRlcHNnaWNudmR6eGRvenB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMjU4NjEsImV4cCI6MjA3MjgwMTg2MX0.rF_tLRyAv8e-cIDtXKWw_HGAbX-bOuhIyg3CEP4ElZk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
