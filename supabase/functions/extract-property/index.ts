import { corsHeaders } from "../_shared/cors.ts";

interface ScrapedListing {
  title: string;
  price: number;
  currency: string;
  location: string;
  bedroom_count: number;
  image: string;
  price_per_sqm?: number;
}

// Firecrawl API endpoint
const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v1/extract";

// Supabase Edge Function
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }

  try {
    // Parse request body
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    console.log(`Processing URL: ${url}`);

    // Get API key from environment
    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      throw new Error("FIRECRAWL_API_KEY environment variable is not set");
    }

    // Prepare request payload according to Firecrawl API docs
    const requestPayload = {
      urls: [url],
      prompt:
        "Extract property listing details including title, price, currency, location, bedroom count, image URL, and price per square meter if available",
      schema: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "The title or name of the property listing",
          },
          price: {
            type: "number",
            description:
              "The numeric price of the property (without currency symbol)",
          },
          currency: {
            type: "string",
            description: "The currency code (EUR, USD, GBP, etc.)",
          },
          location: {
            type: "string",
            description: "The location or address of the property",
          },
          bedroom_count: {
            type: "number",
            description: "The number of bedrooms in the property",
          },
          image: {
            type: "string",
            description: "URL of the main property image",
          },
          price_per_sqm: {
            type: "number",
            description:
              "Price per square meter of the property (if available)",
          },
        },
        required: ["title", "price", "currency", "location", "bedroom_count"],
      },
      enableWebSearch: false,
      ignoreSitemap: false,
      includeSubdomains: false,
      showSources: false,
      scrapeOptions: {
        formats: ["markdown"],
        onlyMainContent: true,
        timeout: 30000,
        blockAds: true,
      },
    };

    console.log(
      "Sending request to Firecrawl API:",
      JSON.stringify(requestPayload),
    );

    // Call Firecrawl API directly
    const response = await fetch(FIRECRAWL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestPayload),
    });

    // Log response status
    console.log(`Firecrawl API response status: ${response.status}`);

    // Get response as text first for debugging
    const responseText = await response.text();
    console.log(`Firecrawl API response: ${responseText}`);

    // Parse the response if possible
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (_parseError) {
      throw new Error(
        `Failed to parse Firecrawl API response: ${responseText}`,
      );
    }

    if (!response.ok) {
      throw new Error(
        `Firecrawl API error: ${result.error || response.statusText}`,
      );
    }

    // Check if we got an error response
    if (result.error) {
      throw new Error(`Firecrawl extraction failed: ${result.error}`);
    }

    // For async extractions, we might get a job ID instead of immediate results
    if (result.success && result.id) {
      console.log(`Extraction job started with ID: ${result.id}`);

      // Return the job ID to the client for polling
      return new Response(
        JSON.stringify({
          success: true,
          jobId: result.id,
          status: "pending",
          message:
            "Extraction job started. Poll the status endpoint to get results.",
        }),
        {
          status: 202, // Accepted but not complete
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Check for successful response with data
    if (result.success && result.data) {
      // Normalize the data
      const normalizedData: ScrapedListing = {
        title: result.data.title || "",
        price: typeof result.data.price === "number"
          ? result.data.price
          : parseFloat(result.data.price) || 0,
        currency: result.data.currency || "EUR",
        location: result.data.location || "",
        bedroom_count: typeof result.data.bedroom_count === "number"
          ? result.data.bedroom_count
          : parseInt(result.data.bedroom_count) || 0,
        image: result.data.image || "",
        price_per_sqm: result.data.price_per_sqm
          ? (typeof result.data.price_per_sqm === "number"
            ? result.data.price_per_sqm
            : parseFloat(result.data.price_per_sqm))
          : undefined,
      };

      console.log(
        "Successfully extracted data:",
        JSON.stringify(normalizedData),
      );

      // Return the scraped data
      return new Response(
        JSON.stringify(normalizedData),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // If we get here, something unexpected happened
    throw new Error("No data extracted from the URL");
  } catch (error) {
    console.error("Extraction error:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error
          ? error.message
          : "Failed to extract property details",
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});
