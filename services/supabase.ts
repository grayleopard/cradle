
import { createClient } from '@supabase/supabase-js';

// Access env vars safely, fallback to localStorage, then fallback to the keys in DevSettings
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    return (import.meta as any).env?.[key];
  } catch {
    return undefined;
  }
};

const envUrl = getEnv('VITE_SUPABASE_URL');
const envKey = getEnv('VITE_SUPABASE_ANON_KEY');

const DEFAULT_URL = 'https://heykcjvqkkecpcrjowjy.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhleWtjanZxa2tlY3Bjcmpvd2p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyOTg2NzYsImV4cCI6MjA4Mjg3NDY3Nn0.G3IO36EqdfHeIuDhnZK_qjfbC-ba0E1dmXNOzyXFyQM';

const supabaseUrl = envUrl || localStorage.getItem('VITE_SUPABASE_URL') || DEFAULT_URL;
const supabaseKey = envKey || localStorage.getItem('VITE_SUPABASE_ANON_KEY') || DEFAULT_KEY;

// Create a single supabase client for interacting with your database
export const supabase = (supabaseUrl && supabaseKey && supabaseUrl !== 'https://your-project.supabase.co') 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

export const isSupabaseConfigured = () => {
  return !!supabase;
};
