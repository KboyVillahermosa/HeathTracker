-- Create common_medicines table for suggestions
CREATE TABLE common_medicines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT, -- 'pain_relief', 'antibiotics', 'vitamins', etc.
    common_dosages TEXT[], -- ['500mg', '250mg', '1000mg']
    default_form TEXT DEFAULT 'pill',
    search_terms TEXT[], -- for better search
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert common medicines
INSERT INTO common_medicines (name, category, common_dosages, default_form, search_terms) VALUES
-- Pain Relief
('Ibuprofen', 'pain_relief', ARRAY['200mg', '400mg', '600mg'], 'tablet', ARRAY['advil', 'motrin']),
('Acetaminophen', 'pain_relief', ARRAY['325mg', '500mg', '650mg'], 'tablet', ARRAY['tylenol', 'paracetamol']),
('Aspirin', 'pain_relief', ARRAY['81mg', '325mg'], 'tablet', ARRAY['bayer']),

-- Vitamins
('Vitamin D3', 'vitamins', ARRAY['1000 IU', '2000 IU', '5000 IU'], 'capsule', ARRAY['cholecalciferol']),
('Vitamin C', 'vitamins', ARRAY['500mg', '1000mg'], 'tablet', ARRAY['ascorbic acid']),
('Multivitamin', 'vitamins', ARRAY['1 tablet'], 'tablet', ARRAY['multi']),
('Vitamin B12', 'vitamins', ARRAY['1000mcg', '2500mcg'], 'tablet', ARRAY['cobalamin']),

-- Blood Pressure
('Lisinopril', 'blood_pressure', ARRAY['5mg', '10mg', '20mg'], 'tablet', ARRAY['ace inhibitor']),
('Amlodipine', 'blood_pressure', ARRAY['2.5mg', '5mg', '10mg'], 'tablet', ARRAY['norvasc']),

-- Diabetes
('Metformin', 'diabetes', ARRAY['500mg', '850mg', '1000mg'], 'tablet', ARRAY['glucophage']),

-- Cholesterol
('Atorvastatin', 'cholesterol', ARRAY['10mg', '20mg', '40mg'], 'tablet', ARRAY['lipitor']),

-- Thyroid
('Levothyroxine', 'thyroid', ARRAY['25mcg', '50mcg', '75mcg', '100mcg'], 'tablet', ARRAY['synthroid']);

-- Create medication_templates table for quick setup
CREATE TABLE medication_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    default_schedule JSONB, -- Preset schedule configuration
    is_popular BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert common medication templates
INSERT INTO medication_templates (name, description, category, default_schedule, is_popular) VALUES
('Once Daily Morning', 'Take once daily in the morning', 'schedule', '{"frequency_type": "once_daily", "scheduled_times": ["08:00"]}', true),
('Twice Daily', 'Take twice daily, morning and evening', 'schedule', '{"frequency_type": "specific_times", "scheduled_times": ["08:00", "20:00"]}', true),
('Three Times Daily', 'Take three times daily with meals', 'schedule', '{"frequency_type": "specific_times", "scheduled_times": ["08:00", "13:00", "19:00"]}', true),
('Every 6 Hours', 'Take every 6 hours', 'schedule', '{"frequency_type": "interval", "interval_hours": 6, "interval_start_time": "08:00"}', false),
('As Needed', 'Take as needed', 'schedule', '{"frequency_type": "as_needed"}', false);

-- Enable RLS
ALTER TABLE common_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_templates ENABLE ROW LEVEL SECURITY;

-- Public read access for common medicines and templates
CREATE POLICY "Anyone can read common medicines" ON common_medicines
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can read medication templates" ON medication_templates
    FOR SELECT USING (true);

-- Create helper functions for the app

-- Function to search common medicines
CREATE OR REPLACE FUNCTION search_common_medicines(search_query TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    category TEXT,
    common_dosages TEXT[],
    default_form TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cm.id,
        cm.name,
        cm.category,
        cm.common_dosages,
        cm.default_form
    FROM common_medicines cm
    WHERE cm.is_active = true
        AND (
            cm.name ILIKE '%' || search_query || '%'
            OR EXISTS (
                SELECT 1 FROM unnest(cm.search_terms) AS term 
                WHERE term ILIKE '%' || search_query || '%'
            )
        )
    ORDER BY 
        CASE WHEN cm.name ILIKE search_query || '%' THEN 1 ELSE 2 END,
        cm.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get dashboard summary
CREATE OR REPLACE FUNCTION get_dashboard_summary(user_profile_id UUID)
RETURNS TABLE (
    hydration_today_ml INTEGER,
    hydration_goal_ml INTEGER,
    hydration_percentage DECIMAL(5,2),
    next_medication_name TEXT,
    next_medication_time TEXT,
    medications_due_count INTEGER,
    streak_days INTEGER
) AS $$
DECLARE
    hydration_stats RECORD;
    next_med RECORD;
    streak_count INTEGER;
BEGIN
    -- Get today's hydration stats
    SELECT * INTO hydration_stats 
    FROM get_daily_hydration_stats(user_profile_id, CURRENT_DATE);
    
    -- Get next medication (simplified)
    SELECT m.name, '08:00 AM' as time INTO next_med
    FROM medications m
    WHERE m.profile_id = user_profile_id 
        AND m.is_active = true
    LIMIT 1;
    
    -- Get current streak (simplified)
    SELECT COALESCE(streak_length, 0) INTO streak_count
    FROM hydration_streaks 
    WHERE profile_id = user_profile_id 
        AND is_current = true
    LIMIT 1;
    
    RETURN QUERY
    SELECT 
        COALESCE(hydration_stats.total_ml, 0)::INTEGER,
        COALESCE(hydration_stats.goal_ml, 2000)::INTEGER,
        COALESCE(hydration_stats.percentage, 0.00),
        next_med.name,
        next_med.time,
        0::INTEGER, -- medications due count (to be implemented)
        COALESCE(streak_count, 0)::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create app_info table for version control and announcements
CREATE TABLE app_info (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial app info
INSERT INTO app_info (key, value) VALUES
('app_version', '{"current": "1.0.0", "minimum_supported": "1.0.0"}'),
('feature_flags', '{"premium_trial_days": 7, "max_basic_medications": 3, "max_basic_water_reminders": 6}'),
('announcements', '{"active": [], "maintenance": false}');

-- Enable RLS for app_info
ALTER TABLE app_info ENABLE ROW LEVEL SECURITY;

-- Public read access for app info
CREATE POLICY "Anyone can read app info" ON app_info
    FOR SELECT USING (true);

-- Add trigger for app_info updated_at
CREATE TRIGGER update_app_info_updated_at
    BEFORE UPDATE ON app_info
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Final setup: Create a function to initialize user defaults
CREATE OR REPLACE FUNCTION initialize_user_defaults(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Insert default app settings if not exists
    INSERT INTO app_settings (profile_id) 
    VALUES (user_id)
    ON CONFLICT (profile_id) DO NOTHING;
    
    -- Insert default hydration reminders
    INSERT INTO hydration_reminders (profile_id, reminder_time)
    SELECT user_id, time_val
    FROM (VALUES 
        ('08:00'::TIME),
        ('10:00'::TIME),
        ('12:00'::TIME),
        ('15:00'::TIME),
        ('18:00'::TIME),
        ('20:00'::TIME)
    ) AS t(time_val)
    ON CONFLICT DO NOTHING;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
