import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

interface Listing {
  id: string;
  url: string;
  title: string;
  price: number;
  currency: string;
  location: string;
  bedroom_count: number;
  image: string;
  last_checked: string;
  change_history: any[];
  updated_flag: boolean;
  user_id: string;
}

interface Change {
  date: string;
  field: string;
  old_value: any;
  new_value: any;
}

async function scrapeUrl(url: string): Promise<Partial<Listing> | null> {
  const SCRAPER_SERVICE_URL = Deno.env.get("SCRAPER_SERVICE_URL") ||
    "http://your-scraper-service.com/scrape";
  const SCRAPER_API_KEY = Deno.env.get("SCRAPER_API_KEY");

  try {
    const response = await fetch(SCRAPER_SERVICE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SCRAPER_API_KEY}`,
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`Scraping service returned ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to scrape URL ${url}:`, error);
    return null;
  }
}

serve(async (req) => {
  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Get all listings
    const { data: listings, error: fetchError } = await supabaseClient
      .from("listings")
      .select("*");

    if (fetchError) throw fetchError;

    // Process each listing
    for (const listing of listings) {
      try {
        if (!listing.url) continue;

        // Scrape the listing URL using the scraper service
        const scrapedData = await scrapeUrl(listing.url);

        if (!scrapedData) continue; // No changes detected or scraping failed

        // Prepare changes array
        const changes: Change[] = [];
        const fieldsToCheck: (keyof Listing)[] = [
          "price",
          "title",
          "location",
          "bedroom_count",
          "image",
        ];

        fieldsToCheck.forEach((field) => {
          if (
            scrapedData[field] !== undefined &&
            scrapedData[field] !== listing[field]
          ) {
            changes.push({
              date: new Date().toISOString(),
              field,
              old_value: listing[field],
              new_value: scrapedData[field],
            });
          }
        });

        if (changes.length > 0) {
          // Update the listing with new data and append to change history
          const { error: updateError } = await supabaseClient
            .from("listings")
            .update({
              ...scrapedData,
              last_checked: new Date().toISOString(),
              change_history: [...(listing.change_history || []), ...changes],
              updated_flag: true,
            })
            .eq("id", listing.id);

          if (updateError) throw updateError;

          // Log changes for monitoring
          console.log(
            `Updated listing ${listing.id} with ${changes.length} changes`,
          );

          // In production, you would send email notifications here
          // await sendEmailNotification(listing.user_id, changes);
        } else {
          // Update last_checked timestamp even if no changes
          await supabaseClient
            .from("listings")
            .update({
              last_checked: new Date().toISOString(),
            })
            .eq("id", listing.id);
        }
      } catch (listingError) {
        console.error(`Error processing listing ${listing.id}:`, listingError);
        continue; // Continue with next listing even if one fails
      }
    }

    return new Response(
      JSON.stringify({ message: "Daily scrape completed successfully" }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Error in daily scrape:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "An unknown error occurred",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
