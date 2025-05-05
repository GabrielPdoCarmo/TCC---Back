import { createClient } from '@supabase/supabase-js'
import { SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl: string = 'https://hudujjlamrpowodfsxsr.supabase.co' // URL do seu projeto
const supabaseKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1ZHVqamxhbXJwb3dvZGZzeHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NDY5NDIsImV4cCI6MjA2MjAyMjk0Mn0.Eaq9HHM6ZzwRyoAU3ve-UJy_XqBo6uR5Wk9qUXxm2qA' // A chave anon obtida

// Tipando o cliente do Supabase
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey)
