-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    weight DECIMAL(5,2), -- in kg
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
    plan_type TEXT DEFAULT 'basic' CHECK (plan_type IN ('basic', 'premium')),
    trial_started_at TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('inactive', 'trial', 'active', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profile_members table for caregiver sharing (Premium feature)
CREATE TABLE profile_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    member_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    member_name TEXT NOT NULL,
    relationship TEXT, -- 'parent', 'child', 'spouse', 'caregiver', etc.
    permissions TEXT[] DEFAULT ARRAY['view'], -- 'view', 'remind', 'edit'
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(owner_id, member_id)
);

-- Create hydration_settings table
CREATE TABLE hydration_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    daily_goal_ml INTEGER DEFAULT 2000,
    goal_type TEXT DEFAULT 'manual' CHECK (goal_type IN ('manual', 'auto')),
    reminder_count INTEGER DEFAULT 6,
    reminder_start_time TIME DEFAULT '08:00',
    reminder_end_time TIME DEFAULT '22:00',
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id)
);

-- Create RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Profile members policies
CREATE POLICY "Users can view their profile memberships" ON profile_members
    FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = member_id);

CREATE POLICY "Users can manage their profile memberships" ON profile_members
    FOR ALL USING (auth.uid() = owner_id);

-- Hydration settings policies
CREATE POLICY "Users can manage their hydration settings" ON hydration_settings
    FOR ALL USING (
        profile_id IN (
            SELECT id FROM profiles WHERE id = auth.uid()
            UNION
            SELECT owner_id FROM profile_members WHERE member_id = auth.uid() AND 'edit' = ANY(permissions)
        )
    );

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email)
    VALUES (NEW.id, NEW.email);
    
    INSERT INTO hydration_settings (profile_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hydration_settings_updated_at
    BEFORE UPDATE ON hydration_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
