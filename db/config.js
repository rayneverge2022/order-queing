import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

// Validate configuration
if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase configuration:', {
        url: !!supabaseUrl,
        key: !!supabaseKey
    });
    process.exit(1);
}

console.log('Initializing Supabase client...');

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: {
            getItem: (key) => {
                console.log('Getting storage item:', key);
                return null;
            },
            setItem: (key, value) => {
                console.log('Setting storage item:', key);
            },
            removeItem: (key) => {
                console.log('Removing storage item:', key);
            }
        }
    }
});
