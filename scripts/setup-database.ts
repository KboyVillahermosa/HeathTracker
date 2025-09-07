import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role key needed for admin operations

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration(filePath: string) {
  try {
    const sql = fs.readFileSync(filePath, 'utf8')
    console.log(`Running migration: ${path.basename(filePath)}`)
    
    const { error } = await supabase.rpc('exec_sql', { sql })
    
    if (error) {
      console.error(`Error in ${filePath}:`, error)
      return false
    }
    
    console.log(`✓ Completed: ${path.basename(filePath)}`)
    return true
  } catch (error) {
    console.error(`Failed to read or execute ${filePath}:`, error)
    return false
  }
}

async function setupDatabase() {
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations')
  
  const migrationFiles = [
    '20240101_001_create_core_tables.sql',
    '20240101_002_create_water_tracking.sql',
    '20240101_003_create_medicine_management.sql',
    '20240101_004_create_analytics_reports.sql',
    '20240101_005_common_medicines_final_setup.sql'
  ]

  console.log('Starting database setup...')
  
  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file)
    const success = await runMigration(filePath)
    
    if (!success) {
      console.error('Migration failed, stopping setup')
      process.exit(1)
    }
  }
  
  console.log('🎉 Database setup completed successfully!')
}

setupDatabase()
