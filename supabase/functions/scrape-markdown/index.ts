import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "npm:@supabase/supabase-js@2.38.4";

interface ScrapedMarkdown {
  markdown: string;
  summary: string;
  url: string;
}

// Firecrawl API endpoint for scraping (not extraction)
const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v1/scrape";
// Google Gemini API endpoint
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

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
    const { url, listingId } = await req.json();

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

    if (!listingId) {
      return new Response(
        JSON.stringify({ error: "Listing ID is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    console.log(`Processing URL for markdown: ${url}`);

    // Get API key from environment
    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      throw new Error("FIRECRAWL_API_KEY environment variable is not set");
    }

    // Get Gemini API key from environment
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }

    // Get Supabase credentials from environment
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase environment variables are not set");
    }

    // Create Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Prepare request payload for Firecrawl scrape API
    const requestPayload = {
      url: url,
      formats: ["markdown"],
      onlyMainContent: true,
      timeout: 30000,
      blockAds: true,
    };

    console.log(
      "Sending request to Firecrawl Scrape API:",
      JSON.stringify(requestPayload),
    );

    // Call Firecrawl Scrape API
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

    // Check if we got an error response
    if (result.error) {
      throw new Error(`Firecrawl scraping failed: ${result.error}`);
    }

    // Check for successful response with data
    if (result.success && result.data) {
      // Get the markdown content
      const markdownContent = result.data.markdown;

      if (!markdownContent) {
        throw new Error("No markdown content found in the scraped data");
      }

      console.log("Successfully scraped markdown content");

      // Send markdown to Gemini API for formatting
      console.log("Sending markdown to Gemini API for formatting");

      const geminiPayload = {
        contents: [{
          parts: [{
            text:
              `Format the following real estate listing information into a clean, readable markdown format. Include only essential details like location, price, features, and key selling points. Remove any redundant information, advertisements, or unnecessary formatting. Keep the structure clear with proper markdown headings and lists:\n\n${markdownContent}`,
          }],
        }],
      };

      const geminiResponse = await fetch(
        `${GEMINI_API_URL}?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(geminiPayload),
        },
      );

      if (!geminiResponse.ok) {
        const geminiErrorText = await geminiResponse.text();
        throw new Error(`Gemini API error: ${geminiErrorText}`);
      }

      const geminiResult = await geminiResponse.json();
      let formattedMarkdown = geminiResult.candidates[0].content.parts[0].text;

      // Handle markdown code blocks if present
      formattedMarkdown = formattedMarkdown.replace(/^```markdown\n/, "")
        .replace(/\n```$/, "");

      console.log("Successfully formatted markdown with Gemini API");

      // Prepare the data to return
      const markdownData: ScrapedMarkdown = {
        markdown: formattedMarkdown,
        summary: "",
        url: url,
      };

      // Update the listing in the database with only the formatted markdown
      const { error: updateError } = await supabase
        .from("listings")
        .update({
          markdown_content: formattedMarkdown,
          last_checked: new Date().toISOString(),
        })
        .eq("id", listingId);

      if (updateError) {
        console.error("Error updating listing:", updateError);
        throw new Error(`Failed to update listing: ${updateError.message}`);
      }

      // Return the scraped markdown data
      return new Response(
        JSON.stringify(markdownData),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // If we get here, something unexpected happened
    throw new Error("No markdown content extracted from the URL");
  } catch (error) {
    console.error("Scraping error:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error
          ? error.message
          : "Failed to scrape markdown content",
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
