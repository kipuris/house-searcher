import { corsHeaders } from "../_shared/cors.ts";

// Supabase Edge Function to check the status of a Firecrawl extraction job
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Only allow GET requests
  if (req.method !== "GET") {
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
    // Parse the URL to get the job ID from the path
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const jobId = pathParts[pathParts.length - 1];

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: "Job ID is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    console.log(`Checking extraction job status: ${jobId}`);

    // Get API key from environment
    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      throw new Error("FIRECRAWL_API_KEY environment variable is not set");
    }

    // Firecrawl API endpoint for checking extraction status
    const FIRECRAWL_API_URL = `https://api.firecrawl.dev/v1/extract/${jobId}`;

    // Call Firecrawl API to check status
    const response = await fetch(FIRECRAWL_API_URL, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
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
    } catch (parseError) {
      throw new Error(
        `Failed to parse Firecrawl API response: ${responseText}`,
      );
    }

    if (!response.ok) {
      throw new Error(
        `Firecrawl API error: ${result.error || response.statusText}`,
      );
    }

    // Return the status response directly
    return new Response(
      JSON.stringify(result),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Error checking extraction status:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error
          ? error.message
          : "Failed to check extraction status",
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
