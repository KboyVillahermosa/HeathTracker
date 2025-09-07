-- Create hydration_logs table
CREATE TABLE IF NOT EXISTS hydration_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    amount_ml INTEGER NOT NULL CHECK (amount_ml > 0),
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    log_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create function to update log_date
CREATE OR REPLACE FUNCTION update_log_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.log_date = NEW.logged_at::DATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set log_date
CREATE TRIGGER set_hydration_log_date
    BEFORE INSERT OR UPDATE ON hydration_logs
    FOR EACH ROW EXECUTE FUNCTION update_log_date();

-- Create hydration_reminders table
CREATE TABLE hydration_reminders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    reminder_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
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

-- Enable RLS
ALTER TABLE hydration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their hydration logs" ON hydration_logs
    FOR ALL USING (profile_id = auth.uid());

CREATE POLICY "Users can manage their hydration reminders" ON hydration_reminders
    FOR ALL USING (profile_id = auth.uid());

CREATE POLICY "Users can manage their hydration settings" ON hydration_settings
    FOR ALL USING (profile_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_hydration_logs_profile_date ON hydration_logs(profile_id, log_date DESC);
CREATE INDEX idx_hydration_logs_logged_at ON hydration_logs(logged_at DESC);
CREATE INDEX idx_hydration_reminders_profile_active ON hydration_reminders(profile_id, is_active);

-- Add updated_at triggers
CREATE TRIGGER update_hydration_reminders_updated_at
    BEFORE UPDATE ON hydration_reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hydration_settings_updated_at
    BEFORE UPDATE ON hydration_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
