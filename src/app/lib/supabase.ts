import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qhwtitddlisaknugtbfr.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFod3RpdGRkbGlzYWtudWd0YmZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwODUxODcsImV4cCI6MjA3MjY2MTE4N30.AweEWZorijOPc591TZ9q-s2dFtJ1fwD8bsDCe21ClwA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type User = {
  id: string
  email: string
  created_at: string
}

export type UploadedFile = {
  id: string
  user_id: string
  file_name: string
  file_size: number
  file_type: string
  upload_path: string
  status: 'pending' | 'processing' | 'approved' | 'rejected'
  analysis_result?: unknown
  created_at: string
  updated_at: string
}