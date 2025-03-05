# Check Extraction Edge Function

This Supabase Edge Function securely checks the status of a Firecrawl extraction job without exposing the API key to the client.

## Usage

Call this function from your client-side code:

```typescript
const { data, error } = await supabase.functions.invoke(
  `check-extraction/${jobId}`,
  {
    method: "GET",
  }
);
```

## Environment Variables

This function requires the following environment variables to be set in your Supabase project:

- `FIRECRAWL_API_KEY`: Your Firecrawl API key

## Security

This function acts as a secure proxy to the Firecrawl API, keeping your API key secure on the server side. 