# Extract Property Edge Function

This Supabase Edge Function securely extracts property details from a URL using the Firecrawl API without exposing the API key to the client.

## Usage

Call this function from your client-side code:

```typescript
const { data, error } = await supabase.functions.invoke("extract-property", {
  body: { url: "https://example.com/property-listing" },
});
```

## Response

The function returns either:

1. The extracted property data directly, or
2. A job ID for asynchronous processing that can be checked with the `check-extraction` function

## Environment Variables

This function requires the following environment variables to be set in your Supabase project:

- `FIRECRAWL_API_KEY`: Your Firecrawl API key

## Security

This function acts as a secure proxy to the Firecrawl API, keeping your API key secure on the server side. 