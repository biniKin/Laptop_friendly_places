import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1haHRqZGpoZGZwcGlidWhodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNzgxMzYsImV4cCI6MjA4MTY1NDEzNn0.Ircp9kXdaSu2J-YEdctcGH4EftqF7jYHLWYIIqONiOs";
const supabaseUrl = "https://mahtjdjhdfppibuhhvuk.supabase.co";

export const supabase = createClient(supabaseUrl, anonKey);
