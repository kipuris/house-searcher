<template>
  <div
    v-if="pendingExtractions.length > 0"
    class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6"
  >
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-medium">Pending Extractions</h3>
      <UButton
        v-if="!loading"
        size="sm"
        color="primary"
        @click="checkAllPendingExtractions"
        :disabled="loading"
      >
        Check All
      </UButton>
      <UButton v-else size="sm" color="primary" disabled>
        <UIcon name="i-heroicons-arrow-path" class="animate-spin mr-2" />
        Checking...
      </UButton>
    </div>

    <div v-if="pendingExtractions.length > 0" class="space-y-3">
      <div
        v-for="listing in pendingExtractions"
        :key="listing.id"
        class="border border-gray-200 dark:border-gray-700 rounded-md p-3"
      >
        <div class="flex justify-between items-start">
          <div>
            <div class="font-medium">
              {{ listing.title || "Pending Extraction" }}
            </div>
            <div class="text-sm text-gray-500 truncate">{{ listing.url }}</div>
            <div class="text-xs text-gray-400 mt-1">
              Job ID: {{ listing.extraction_job_id }}
            </div>
          </div>
          <UButton
            size="xs"
            color="primary"
            variant="soft"
            @click="checkExtractionStatus(listing)"
            :disabled="checkingStatus[listing.id]"
          >
            <UIcon
              v-if="checkingStatus[listing.id]"
              name="i-heroicons-arrow-path"
              class="animate-spin mr-1"
            />
            {{ checkingStatus[listing.id] ? "Checking..." : "Check Status" }}
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient();
const toast = useToast();

const pendingExtractions = ref([]);
const loading = ref(false);
const checkingStatus = ref({});

const runtimeConfig = useRuntimeConfig();
const firecrawlApiKey = runtimeConfig.public.firecrawlApiKey; // Use runtimeConfig for client-side

// Define emits
const emit = defineEmits(["update-listing"]);

// Use useAsyncData instead of onMounted for better Nuxt integration
const {
  data: extractionsData,
  refresh: refreshExtractions,
  pending,
} = useAsyncData(
  "pendingExtractions",
  async () => {
    try {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .not("extraction_job_id", "is", null);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching pending extractions:", error);
      toast.add({
        title: "Error",
        description: "Failed to load pending extractions",
        icon: "i-heroicons-exclamation-circle",
        color: "red",
        timeout: 3000,
      });
      return [];
    }
  },
  { server: false } // Only fetch on client-side since we need Supabase auth
);

// Update pendingExtractions ref when data changes
watch(extractionsData, (newData) => {
  if (newData) {
    pendingExtractions.value = newData;
  }
});

// Watch pending state to update loading
watch(pending, (isPending) => {
  loading.value = isPending;
});

// Fetch listings with extraction_job_id that are not null
async function fetchPendingExtractions() {
  await refreshExtractions();
}

// Check status of a single extraction
async function checkExtractionStatus(listing) {
  if (!listing.extraction_job_id) return;

  checkingStatus.value = { ...checkingStatus.value, [listing.id]: true };

  try {
    // Call Firecrawl API to check status
    const response = await fetch(
      `${runtimeConfig.public.firecrawlApiUrl}/extract/${listing.extraction_job_id}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${firecrawlApiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }

    const result = await response.json();

    if (result.status === "completed") {
      // Update the listing with the extracted data
      const { data: updatedListing, error: updateError } = await supabase
        .from("listings")
        .update({
          title: result.data.title || listing.title,
          price:
            typeof result.data.price === "number"
              ? result.data.price
              : parseFloat(result.data.price) || listing.price,
          currency: result.data.currency || listing.currency,
          location: result.data.location || listing.location,
          bedroom_count:
            typeof result.data.bedroom_count === "number"
              ? result.data.bedroom_count
              : parseInt(result.data.bedroom_count) || listing.bedroom_count,
          image: result.data.image || listing.image,
          extraction_job_id: null, // Clear the job ID since it's completed
        })
        .eq("id", listing.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Emit event to refresh listings in parent component
      emit("update-listing", updatedListing);

      toast.add({
        title: "Extraction Complete",
        description: "Property details have been updated",
        icon: "i-heroicons-check-circle",
        color: "green",
        timeout: 3000,
      });

      // Refresh the list
      await refreshExtractions();
    } else if (result.status === "failed") {
      // Update the listing to indicate failure
      const { data: updatedListing, error: updateError } = await supabase
        .from("listings")
        .update({
          title: "Extraction failed",
          location: "Please edit manually",
          updated_flag: true,
          extraction_job_id: null, // Clear the job ID
        })
        .eq("id", listing.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Emit event to refresh listings in parent component
      emit("update-listing", updatedListing);

      toast.add({
        title: "Extraction Failed",
        description: result.error || "Failed to extract property details",
        icon: "i-heroicons-exclamation-circle",
        color: "red",
        timeout: 5000,
      });

      // Refresh the list
      await refreshExtractions();
    } else {
      // Still pending or processing
      toast.add({
        title: "Still Processing",
        description: `Extraction is ${result.status}. Please check again later.`,
        icon: "i-heroicons-clock",
        color: "blue",
        timeout: 3000,
      });
    }
  } catch (error) {
    console.error("Error checking extraction status:", error);
    toast.add({
      title: "Error",
      description: `Failed to check extraction status: ${error.message}`,
      icon: "i-heroicons-exclamation-circle",
      color: "red",
      timeout: 5000,
    });
  } finally {
    checkingStatus.value = { ...checkingStatus.value, [listing.id]: false };
  }
}

// Check all pending extractions
async function checkAllPendingExtractions() {
  loading.value = true;

  try {
    let updatedCount = 0;
    let stillPendingCount = 0;
    let failedCount = 0;
    let updatedListings = [];

    for (const listing of pendingExtractions.value) {
      if (!listing.extraction_job_id) continue;

      try {
        const response = await fetch(
          `${runtimeConfig.public.firecrawlApiUrl}/extract/${listing.extraction_job_id}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${firecrawlApiKey}`,
            },
          }
        );

        if (!response.ok) continue;

        const result = await response.json();

        if (result.status === "completed") {
          // Update the listing with the extracted data
          const { data: updatedListing } = await supabase
            .from("listings")
            .update({
              title: result.data.title || listing.title,
              price:
                typeof result.data.price === "number"
                  ? result.data.price
                  : parseFloat(result.data.price) || listing.price,
              currency: result.data.currency || listing.currency,
              location: result.data.location || listing.location,
              bedroom_count:
                typeof result.data.bedroom_count === "number"
                  ? result.data.bedroom_count
                  : parseInt(result.data.bedroom_count) ||
                    listing.bedroom_count,
              image: result.data.image || listing.image,
              extraction_job_id: null, // Clear the job ID since it's completed
            })
            .eq("id", listing.id)
            .select()
            .single();

          updatedCount++;
          updatedListings.push(updatedListing);
        } else if (result.status === "failed") {
          // Update the listing to indicate failure
          const { data: updatedListing } = await supabase
            .from("listings")
            .update({
              title: "Extraction failed",
              location: "Please edit manually",
              updated_flag: true,
              extraction_job_id: null, // Clear the job ID
            })
            .eq("id", listing.id)
            .select()
            .single();

          failedCount++;
          updatedListings.push(updatedListing);
        } else {
          stillPendingCount++;
        }
      } catch (error) {
        console.error(
          `Error checking extraction for listing ${listing.id}:`,
          error
        );
        failedCount++;
      }
    }

    // Emit events for all updated listings
    updatedListings.forEach((listing) => {
      emit("update-listing", listing);
    });

    // Show summary toast
    toast.add({
      title: "Status Check Complete",
      description: `Updated: ${updatedCount}, Still pending: ${stillPendingCount}, Failed: ${failedCount}`,
      icon: "i-heroicons-information-circle",
      color: updatedCount > 0 ? "green" : "blue",
      timeout: 5000,
    });

    // Refresh the list
    await refreshExtractions();
  } catch (error) {
    console.error("Error checking all extractions:", error);
    toast.add({
      title: "Error",
      description: "Failed to check all extractions",
      icon: "i-heroicons-exclamation-circle",
      color: "red",
      timeout: 5000,
    });
  } finally {
    loading.value = false;
  }
}
</script>
