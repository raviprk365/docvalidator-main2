import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://your-project.supabase.co'
const supabaseAnonKey = 'your-anon-key'

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
  analysis_result?: any
  created_at: string
  updated_at: string
}