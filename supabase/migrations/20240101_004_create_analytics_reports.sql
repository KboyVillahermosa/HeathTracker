-- Create user_analytics table for aggregated stats
CREATE TABLE user_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    analytics_date DATE NOT NULL,
    
    -- Hydration analytics
    hydration_goal_ml INTEGER,
    hydration_actual_ml INTEGER,
    hydration_percentage DECIMAL(5,2),
    hydration_log_count INTEGER,
    
    -- Medication analytics
    total_scheduled_doses INTEGER,
    doses_taken INTEGER,
    doses_missed INTEGER,
    doses_skipped INTEGER,
    medication_adherence_percentage DECIMAL(5,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, analytics_date)
);

-- Create export_requests table for Premium users
CREATE TABLE export_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    export_type TEXT NOT NULL CHECK (export_type IN ('csv', 'pdf')),
    data_type TEXT NOT NULL CHECK (data_type IN ('hydration', 'medication', 'combined')),
    date_from DATE NOT NULL,
    date_to DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    file_url TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create app_settings table for user preferences
CREATE TABLE app_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- General settings
    units TEXT DEFAULT 'metric' CHECK (units IN ('metric', 'imperial')),
    time_format TEXT DEFAULT '24h' CHECK (time_format IN ('12h', '24h')),
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    language TEXT DEFAULT 'en',
    
    -- Notification settings
    notifications_enabled BOOLEAN DEFAULT true,
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    
    -- Premium settings
    biometric_lock_enabled BOOLEAN DEFAULT false,
    reminder_tone TEXT DEFAULT 'default',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id)
);

-- Create indexes
CREATE INDEX idx_user_analytics_profile_date ON user_analytics(profile_id, analytics_date DESC);
CREATE INDEX idx_export_requests_profile_status ON export_requests(profile_id, status);
CREATE INDEX idx_app_settings_profile ON app_settings(profile_id);

-- Enable RLS
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their analytics" ON user_analytics
    FOR SELECT USING (
        profile_id IN (
            SELECT id FROM profiles WHERE id = auth.uid()
            UNION
            SELECT owner_id FROM profile_members WHERE member_id = auth.uid() AND 'view' = ANY(permissions)
        )
    );

CREATE POLICY "Users can manage their export requests" ON export_requests
    FOR ALL USING (profile_id = auth.uid());

CREATE POLICY "Users can manage their app settings" ON app_settings
    FOR ALL USING (profile_id = auth.uid());

-- Add triggers
CREATE TRIGGER update_app_settings_updated_at
    BEFORE UPDATE ON app_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate weekly medication adherence
CREATE OR REPLACE FUNCTION calculate_medication_adherence(
    user_profile_id UUID,
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    medication_id UUID,
    medication_name TEXT,
    total_scheduled INTEGER,
    taken INTEGER,
    missed INTEGER,
    adherence_percentage DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id as medication_id,
        m.name as medication_name,
        COUNT(ml.*)::INTEGER as total_scheduled,
        COUNT(CASE WHEN ml.status = 'taken' THEN 1 END)::INTEGER as taken,
        COUNT(CASE WHEN ml.status = 'missed' THEN 1 END)::INTEGER as missed,
        ROUND(
            CASE 
                WHEN COUNT(ml.*) > 0 THEN 
                    (COUNT(CASE WHEN ml.status = 'taken' THEN 1 END) * 100.0 / COUNT(ml.*))
                ELSE 0 
            END, 2
        ) as adherence_percentage
    FROM medications m
    LEFT JOIN medication_logs ml ON ml.medication_id = m.id 
        AND ml.log_date BETWEEN start_date AND end_date
    WHERE m.profile_id = user_profile_id AND m.is_active = true
    GROUP BY m.id, m.name
    ORDER BY m.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate daily analytics
CREATE OR REPLACE FUNCTION generate_daily_analytics(
    target_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER AS $$
DECLARE
    profile_record RECORD;
    hydration_stats RECORD;
    medication_stats RECORD;
BEGIN
    FOR profile_record IN 
        SELECT id FROM profiles WHERE plan_type IN ('basic', 'premium')
    LOOP
        -- Get hydration stats
        SELECT * INTO hydration_stats 
        FROM get_daily_hydration_stats(profile_record.id, target_date);
        
        -- Get medication stats
        SELECT 
            COUNT(*) as total_scheduled,
            COUNT(CASE WHEN status = 'taken' THEN 1 END) as taken,
            COUNT(CASE WHEN status = 'missed' THEN 1 END) as missed,
            COUNT(CASE WHEN status = 'skipped' THEN 1 END) as skipped
        INTO medication_stats
        FROM medication_logs ml
        JOIN medications m ON m.id = ml.medication_id
        WHERE m.profile_id = profile_record.id 
            AND ml.log_date = target_date;
        
        -- Insert or update analytics
        INSERT INTO user_analytics (
            profile_id,
            analytics_date,
            hydration_goal_ml,
            hydration_actual_ml,
            hydration_percentage,
            hydration_log_count,
            total_scheduled_doses,
            doses_taken,
            doses_missed,
            doses_skipped,
            medication_adherence_percentage
        ) VALUES (
            profile_record.id,
            target_date,
            hydration_stats.goal_ml,
            hydration_stats.total_ml,
            hydration_stats.percentage,
            hydration_stats.log_count,
            COALESCE(medication_stats.total_scheduled, 0),
            COALESCE(medication_stats.taken, 0),
            COALESCE(medication_stats.missed, 0),
            COALESCE(medication_stats.skipped, 0),
            CASE 
                WHEN COALESCE(medication_stats.total_scheduled, 0) > 0 THEN
                    ROUND((COALESCE(medication_stats.taken, 0) * 100.0 / medication_stats.total_scheduled), 2)
                ELSE 0
            END
        )
        ON CONFLICT (profile_id, analytics_date) 
        DO UPDATE SET
            hydration_goal_ml = EXCLUDED.hydration_goal_ml,
            hydration_actual_ml = EXCLUDED.hydration_actual_ml,
            hydration_percentage = EXCLUDED.hydration_percentage,
            hydration_log_count = EXCLUDED.hydration_log_count,
            total_scheduled_doses = EXCLUDED.total_scheduled_doses,
            doses_taken = EXCLUDED.doses_taken,
            doses_missed = EXCLUDED.doses_missed,
            doses_skipped = EXCLUDED.doses_skipped,
            medication_adherence_percentage = EXCLUDED.medication_adherence_percentage;
    END LOOP;
    
    RETURN 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
