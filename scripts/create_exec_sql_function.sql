-- Create a function that allows executing arbitrary SQL (for admin use only)
-- WARNING: This is a powerful function that should be carefully secured
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Run with privileges of the function creator
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Secure the function by restricting access to admin users only
REVOKE ALL ON FUNCTION exec_sql(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role; -- Only allow service role to use this function 