-- Create hydration_logs table
CREATE TABLE hydration_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    amount_ml INTEGER NOT NULL CHECK (amount_ml > 0),
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    log_date DATE GENERATED ALWAYS AS (logged_at::DATE) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create hydration_reminders table
CREATE TABLE hydration_reminders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    reminder_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create hydration_streaks table (Premium feature)
CREATE TABLE hydration_streaks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    streak_start_date DATE NOT NULL,
    streak_end_date DATE,
    streak_length INTEGER DEFAULT 1,
    is_current BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_hydration_logs_profile_date ON hydration_logs(profile_id, log_date DESC);
CREATE INDEX idx_hydration_logs_logged_at ON hydration_logs(logged_at DESC);
CREATE INDEX idx_hydration_reminders_profile_active ON hydration_reminders(profile_id, is_active);
CREATE INDEX idx_hydration_streaks_profile_current ON hydration_streaks(profile_id, is_current);

-- Enable RLS
ALTER TABLE hydration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their hydration logs" ON hydration_logs
    FOR ALL USING (
        profile_id IN (
            SELECT id FROM profiles WHERE id = auth.uid()
            UNION
            SELECT owner_id FROM profile_members WHERE member_id = auth.uid() AND 'view' = ANY(permissions)
        )
    );

CREATE POLICY "Users can manage their hydration reminders" ON hydration_reminders
    FOR ALL USING (
        profile_id IN (
            SELECT id FROM profiles WHERE id = auth.uid()
            UNION
            SELECT owner_id FROM profile_members WHERE member_id = auth.uid() AND 'edit' = ANY(permissions)
        )
    );

CREATE POLICY "Users can view their hydration streaks" ON hydration_streaks
    FOR SELECT USING (
        profile_id IN (
            SELECT id FROM profiles WHERE id = auth.uid()
            UNION
            SELECT owner_id FROM profile_members WHERE member_id = auth.uid() AND 'view' = ANY(permissions)
        )
    );

-- Add updated_at triggers
CREATE TRIGGER update_hydration_reminders_updated_at
    BEFORE UPDATE ON hydration_reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hydration_streaks_updated_at
    BEFORE UPDATE ON hydration_streaks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate daily hydration percentage
CREATE OR REPLACE FUNCTION get_daily_hydration_stats(
    user_profile_id UUID,
    target_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_ml INTEGER,
    goal_ml INTEGER,
    percentage DECIMAL(5,2),
    log_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(hl.amount_ml), 0)::INTEGER as total_ml,
        hs.daily_goal_ml as goal_ml,
        ROUND(
            CASE 
                WHEN hs.daily_goal_ml > 0 THEN 
                    (COALESCE(SUM(hl.amount_ml), 0) * 100.0 / hs.daily_goal_ml)
                ELSE 0 
            END, 2
        ) as percentage,
        COUNT(hl.id)::INTEGER as log_count
    FROM hydration_settings hs
    LEFT JOIN hydration_logs hl ON hl.profile_id = hs.profile_id 
        AND hl.log_date = target_date
    WHERE hs.profile_id = user_profile_id
    GROUP BY hs.daily_goal_ml;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
