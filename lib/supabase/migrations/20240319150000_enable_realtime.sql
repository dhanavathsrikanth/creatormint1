-- Enable Realtime publication for the tables needed by the live dashboard.
-- The supabase_realtime publication must include these tables for
-- Supabase Realtime postgres_changes listener to receive row updates.
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
