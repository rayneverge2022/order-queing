import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fetch from 'cross-fetch'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  },
  global: {
    fetch: fetch
  }
})
