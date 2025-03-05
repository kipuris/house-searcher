-- Enable pg_cron extension if not already enabled
create extension if not exists pg_cron;

-- Create a function to invoke the Edge Function
create or replace function invoke_daily_scrape()
returns void
language plpgsql
security definer
as $$
declare
  edge_function_url text;
  service_role_key text;
begin
  -- Get the Edge Function URL and service role key from your environment
  -- In production, you would set these using secrets management
  edge_function_url := current_setting('app.settings.edge_function_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);
  
  -- Make HTTP request to Edge Function
  perform
    net.http_post(
      edge_function_url,
      '{}',
      ARRAY[
        ('Authorization', 'Bearer ' || service_role_key)::net.http_header
      ]
    );
end;
$$;

-- Schedule the cron job to run daily at 2 AM UTC
select cron.schedule(
  'daily-scrape',  -- unique job name
  '0 2 * * *',    -- cron schedule (daily at 2 AM)
  'select invoke_daily_scrape()'
); 