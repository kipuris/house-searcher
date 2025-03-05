# Property Listing Scraper Service

## Overview
This document outlines the requirements and specifications for the property listing scraper service. The service will be implemented as a Supabase Edge Function with TypeScript and will utilize Firecrawl as the core scraping engine.

## Technical Stack
- Deno (Supabase Edge Functions runtime)
- TypeScript
- Supabase Edge Functions
- Firecrawl for web scraping

## Firecrawl Integration

### Authentication
- Sign up at firecrawl.dev to obtain an API key
- Store the API key securely in environment variables

### API Endpoint Specification

#### Scrape Endpoint
- **URL**: `/property-scraper/scrape`
- **Method**: `POST`
- **Authentication**: Supabase authentication
- **Request Body**:
```typescript
interface ScrapeRequest {
  url: string;  // The property listing URL to scrape
}
```

- **Response Format**:
```typescript
interface ScrapedListing {
  title: string;        // Property title/description
  price: number;        // Numeric price value (no currency symbols)
  currency: string;     // Currency code (EUR, USD, GBP)
  location: string;     // Property location/address
  bedroom_count: number; // Number of bedrooms
  image: string;        // URL of the main property image
}
```

### Firecrawl Configuration
We'll use Firecrawl's extraction feature with a custom schema to ensure consistent data structure. The schema will define the exact fields we need from each property listing.

```typescript
// Firecrawl extraction schema
const extractionSchema = {
  title: "string",
  price: "number",
  currency: "string",
  location: "string",
  bedroom_count: "number",
  image: "string"
};
```

### Error Handling
Implement comprehensive error handling for:
- Network errors
- Invalid URLs
- Rate limiting responses (Firecrawl specific)
- Malformed page structures
- Missing data fields

## Implementation Requirements

### 1. URL Validation & Processing
- Validate input URLs before sending to Firecrawl
- Handle different property listing website structures
- Utilize Firecrawl's built-in anti-bot and proxy capabilities

### 2. Data Extraction
The service should:
- Use Firecrawl's extraction feature for consistent data parsing
- Handle dynamic content through Firecrawl's JavaScript rendering capabilities
- Extract and normalize data according to our schema
- Handle cases where some data might be missing

### 3. Performance Optimization
- Utilize Firecrawl's rate limiting guidelines
- Implement caching where appropriate
- Handle concurrent requests efficiently

## Example Implementation

```typescript
import { Firecrawl } from 'npm:firecrawl@latest';

// Extraction schema
const extractionSchema = {
  title: "string",
  price: "number",
  currency: "string",
  location: "string",
  bedroom_count: "number",
  image: "string"
};

// Supabase Edge Function
Deno.serve(async (req: Request) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Parse request body
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Firecrawl with API key from environment
    const firecrawl = new Firecrawl(Deno.env.get('FIRECRAWL_API_KEY'));
    
    // Scrape the listing
    const result = await firecrawl.extract({
      url,
      schema: extractionSchema,
      options: {
        waitForSelector: '.property-details', // Wait for main content
        timeout: 10000
      }
    });

    // Normalize the data
    const normalizedData = {
      title: result.data.title,
      price: parseFloat(result.data.price),
      currency: result.data.currency || 'EUR',
      location: result.data.location,
      bedroom_count: parseInt(result.data.bedroom_count),
      image: result.data.image
    };

    // Return the scraped data
    return new Response(
      JSON.stringify(normalizedData),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Scraping error:', error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to scrape property listing' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

## Firecrawl-Specific Features to Utilize

1. **Dynamic Content Handling**
   - Automatic JavaScript rendering
   - Waiting for dynamic content to load

2. **Anti-Bot Protection**
   - Built-in proxy rotation
   - Browser fingerprint randomization
   - Automatic CAPTCHA handling

3. **Media Handling**
   - Automatic image URL extraction
   - PDF parsing if needed for property documents

4. **Performance Features**
   - Automatic retries on failure
   - Smart rate limiting
   - Concurrent request handling

## Testing Requirements
- Unit tests for data normalization
- Integration tests with Firecrawl
- Error case testing
- Rate limit compliance testing

## Deployment Guidelines
- Deploy as a Supabase Edge Function
- Configure environment variables using Supabase Secrets:
  ```bash
  supabase secrets set FIRECRAWL_API_KEY=your_api_key
  ```
- Set other environment variables as needed:
  ```bash
  supabase secrets set TIMEOUT_MS=10000
  ```

## Supabase Edge Function Considerations
- Edge Functions have a maximum execution time of 60 seconds
- For long-running tasks, use `EdgeRuntime.waitUntil(promise)` to run in the background
- File operations are only permitted in the `/tmp` directory
- Use Deno's built-in APIs where possible instead of external dependencies
- For external dependencies, use the `npm:` prefix with version specification

## Monitoring and Maintenance
- Monitor Supabase Edge Function logs
- Track Firecrawl API usage and limits
- Monitor response times and error rates
- Set up alerts for high failure rates

## Rate Limits and Quotas
- Implement rate limiting according to your Firecrawl plan
- Monitor API usage to stay within quotas
- Implement backoff strategies for rate limit errors

## Security Considerations
- Secure API key storage
- Input validation
- Error message sanitization
- Regular security updates

## Future Considerations
- Implement Firecrawl's crawl feature for discovering new listings
- Add support for additional property websites
- Utilize Firecrawl's screenshot feature for verification
- Implement structured data extraction for additional property details 