-- Create medications table
CREATE TABLE medications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    form TEXT DEFAULT 'pill' CHECK (form IN ('pill', 'tablet', 'capsule', 'liquid', 'drop', 'injection', 'patch', 'inhaler')),
    dosage TEXT, -- e.g., "500mg", "5ml"
    dosage_unit TEXT, -- e.g., "mg", "ml", "units"
    dosage_amount DECIMAL(10,2),
    color TEXT DEFAULT '#FF6B7A',
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create medication_schedules table
CREATE TABLE medication_schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    medication_id UUID REFERENCES medications(id) ON DELETE CASCADE NOT NULL,
    frequency_type TEXT NOT NULL CHECK (frequency_type IN ('once_daily', 'specific_times', 'interval', 'weekly_pattern', 'every_n_days', 'as_needed')),
    
    -- For once_daily and specific_times
    scheduled_times TIME[],
    
    -- For interval (every X hours)
    interval_hours INTEGER,
    interval_start_time TIME,
    
    -- For weekly_pattern (Premium)
    weekly_days INTEGER[], -- 0=Sunday, 1=Monday, etc.
    
    -- For every_n_days (Premium)
    every_n_days INTEGER,
    
    -- Date range
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    
    -- Reminder settings
    reminder_enabled BOOLEAN DEFAULT true,
    reminder_tone TEXT DEFAULT 'default',
    snooze_minutes INTEGER DEFAULT 10,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create medication_inventory table (Premium feature)
CREATE TABLE medication_inventory (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    medication_id UUID REFERENCES medications(id) ON DELETE CASCADE NOT NULL,
    total_pills INTEGER,
    remaining_pills INTEGER,
    refill_threshold INTEGER DEFAULT 7,
    refill_reminder_enabled BOOLEAN DEFAULT true,
    last_refill_date DATE,
    next_refill_date DATE,
    pharmacy_info JSONB, -- {name, phone, address}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(medication_id)
);

-- Create medication_logs table
CREATE TABLE medication_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    medication_id UUID REFERENCES medications(id) ON DELETE CASCADE NOT NULL,
    scheduled_time TIMESTAMPTZ,
    actual_time TIMESTAMPTZ DEFAULT NOW(),
    status TEXT NOT NULL CHECK (status IN ('taken', 'missed', 'skipped', 'late')),
    skip_reason TEXT, -- Premium feature
    notes TEXT,
    log_date DATE GENERATED ALWAYS AS (actual_time::DATE) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_medications_profile_active ON medications(profile_id, is_active);
CREATE INDEX idx_medication_schedules_medication_active ON medication_schedules(medication_id, is_active);
CREATE INDEX idx_medication_logs_medication_date ON medication_logs(medication_id, log_date DESC);
CREATE INDEX idx_medication_logs_scheduled_time ON medication_logs(scheduled_time DESC);
CREATE INDEX idx_medication_inventory_medication ON medication_inventory(medication_id);

-- Enable RLS
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their medications" ON medications
    FOR ALL USING (
        profile_id IN (
            SELECT id FROM profiles WHERE id = auth.uid()
            UNION
            SELECT owner_id FROM profile_members WHERE member_id = auth.uid() AND 'edit' = ANY(permissions)
        )
    );

CREATE POLICY "Users can manage medication schedules" ON medication_schedules
    FOR ALL USING (
        medication_id IN (
            SELECT m.id FROM medications m WHERE m.profile_id IN (
                SELECT id FROM profiles WHERE id = auth.uid()
                UNION
                SELECT owner_id FROM profile_members WHERE member_id = auth.uid() AND 'edit' = ANY(permissions)
            )
        )
    );

CREATE POLICY "Users can manage medication inventory" ON medication_inventory
    FOR ALL USING (
        medication_id IN (
            SELECT m.id FROM medications m WHERE m.profile_id IN (
                SELECT id FROM profiles WHERE id = auth.uid()
                UNION
                SELECT owner_id FROM profile_members WHERE member_id = auth.uid() AND 'edit' = ANY(permissions)
            )
        )
    );

CREATE POLICY "Users can manage medication logs" ON medication_logs
    FOR ALL USING (
        medication_id IN (
            SELECT m.id FROM medications m WHERE m.profile_id IN (
                SELECT id FROM profiles WHERE id = auth.uid()
                UNION
                SELECT owner_id FROM profile_members WHERE member_id = auth.uid() AND 'view' = ANY(permissions)
            )
        )
    );

-- Add updated_at triggers
CREATE TRIGGER update_medications_updated_at
    BEFORE UPDATE ON medications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medication_schedules_updated_at
    BEFORE UPDATE ON medication_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medication_inventory_updated_at
    BEFORE UPDATE ON medication_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get next medication dose
CREATE OR REPLACE FUNCTION get_next_medication_dose(user_profile_id UUID)
RETURNS TABLE (
    medication_id UUID,
    medication_name TEXT,
    dosage TEXT,
    next_dose_time TIMESTAMPTZ,
    is_overdue BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH next_doses AS (
        SELECT 
            m.id as medication_id,
            m.name as medication_name,
            m.dosage,
            ms.scheduled_times,
            ms.frequency_type,
            ms.interval_hours,
            ms.interval_start_time
        FROM medications m
        JOIN medication_schedules ms ON ms.medication_id = m.id
        WHERE m.profile_id = user_profile_id 
            AND m.is_active = true 
            AND ms.is_active = true
            AND (ms.end_date IS NULL OR ms.end_date >= CURRENT_DATE)
    )
    SELECT 
        nd.medication_id,
        nd.medication_name,
        nd.dosage,
        CURRENT_TIMESTAMP as next_dose_time, -- Simplified for now
        false as is_overdue
    FROM next_doses nd
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
