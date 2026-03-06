import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iypozwxmnkxsxyncoqbz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5cG96d3htbmt4c3h5bmNvcWJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMDk5MzUsImV4cCI6MjA4Njc4NTkzNX0.VcZ5C4ERQ-q8M1qgGoLrmwrXG3Vn7LV4Bo76ag5jj2Y';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (input: RequestInfo | URL, init?: RequestInit) => window.fetch(input, init),
  },
});
