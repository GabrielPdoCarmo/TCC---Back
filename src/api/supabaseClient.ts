import { createClient } from '@supabase/supabase-js'
import { SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl: string = 'https://hudujjlamrpowodfsxsr.supabase.co' // URL do seu projeto
const supabaseKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1ZHVqamxhbXJwb3dvZGZzeHNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjQ0Njk0MiwiZXhwIjoyMDYyMDIyOTQyfQ.e7ank0HRBbX6rOoLngKyrMVoXaFZxg-TLjOxYoBNIfk' // A chave anon obtida

// Tipando o cliente do Supabase
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey)
