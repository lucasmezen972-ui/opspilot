import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.SUPABASE_URL ?? 'https://hpqfmuzkkxrqoqoabjmb.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwcWZtdXpra3hycW9xb2Fiam1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NDcyNDgsImV4cCI6MjA5MTAyMzI0OH0.0XeJi3w_XzibExkwp2I1EJjkNCL8eUluf031kzWOaf8';

if (!process.env.SUPABASE_SERVICE_KEY)
  console.warn(
    '[Server] SUPABASE_SERVICE_KEY manquante, utilisation de la clé anon (accès limité par RLS)',
  );

export const supabase = createClient(supabaseUrl, supabaseKey);
