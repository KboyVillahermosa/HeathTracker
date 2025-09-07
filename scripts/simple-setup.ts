import { supabase } from '../lib/supabase'

async function createTables() {
  console.log('Setting up database tables...')
  
  // Create profiles table
  const { error: profilesError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        weight DECIMAL(5,2),
        gender TEXT CHECK (gender IN ('male', 'female', 'other')),
        activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
        plan_type TEXT DEFAULT 'basic' CHECK (plan_type IN ('basic', 'premium')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "Users can view own profile" ON profiles
        FOR SELECT USING (auth.uid() = id);
      
      CREATE POLICY "Users can update own profile" ON profiles
        FOR UPDATE USING (auth.uid() = id);
      
      CREATE POLICY "Users can insert own profile" ON profiles
        FOR INSERT WITH CHECK (auth.uid() = id);
    `
  })

  if (profilesError) {
    console.error('Error creating profiles table:', profilesError)
    return
  }

  // Create hydration_logs table
  const { error: hydrationError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS hydration_logs (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
        amount_ml INTEGER NOT NULL CHECK (amount_ml > 0),
        logged_at TIMESTAMPTZ DEFAULT NOW(),
        log_date DATE GENERATED ALWAYS AS (logged_at::DATE) STORED,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      ALTER TABLE hydration_logs ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "Users can manage their hydration logs" ON hydration_logs
        FOR ALL USING (profile_id = auth.uid());
    `
  })

  if (hydrationError) {
    console.error('Error creating hydration_logs table:', hydrationError)
    return
  }

  console.log('✓ Database setup completed!')
}

createTables()
