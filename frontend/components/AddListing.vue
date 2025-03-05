<template>
  <UModal v-model="isOpen">
    <UCard class="w-full max-w-2xl">
      <template #header>
        <div class="flex justify-between items-center">
          <h3 class="text-xl font-semibold text-gray-900">Add New Listing</h3>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark"
            @click="close"
          />
        </div>
      </template>

      <!-- URL Input Step -->
      <div v-if="!scrapedData" class="space-y-4">
        <UFormGroup label="Property URL">
          <div class="relative">
            <UInput
              v-model="url"
              placeholder="Paste the property listing URL"
              :ui="{ base: 'bg-white dark:bg-white' }"
              :disabled="loading"
            />
            <div
              v-if="loading"
              class="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <UIcon
                name="i-heroicons-arrow-path"
                class="animate-spin text-primary"
              />
            </div>
          </div>
          <template #hint>
            <span class="text-xs text-gray-500">
              Enter a URL from a property listing website (e.g., Idealista,
              Zillow, Rightmove)
            </span>
          </template>
        </UFormGroup>

        <UAlert
          v-if="error"
          type="danger"
          :title="error"
          class="mb-4"
          @close="error = null"
        />

        <div class="flex justify-between items-center">
          <p class="text-sm text-gray-500">
            Or use manual input
            <UButton
              variant="link"
              color="primary"
              @click="useManualInput"
              :disabled="loading"
            >
              Click here
            </UButton>
          </p>
          <UButton
            color="primary"
            :loading="loading"
            :disabled="(!url && !isManualInput) || loading"
            @click="handleSubmitUrl"
          >
            {{ isManualInput ? "Continue" : "Fetch Details" }}
          </UButton>
        </div>
      </div>

      <!-- Property Details Form -->
      <form v-else class="space-y-6" @submit.prevent="handleSave">
        <UAlert
          v-if="error"
          type="danger"
          :title="error"
          class="mb-4"
          @close="error = null"
        />

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-4 md:col-span-2">
            <UFormGroup label="URL" required>
              <UInput
                v-model="scrapedData.url"
                type="url"
                placeholder="Property listing URL"
                :ui="{ base: 'bg-white dark:bg-white' }"
              />
            </UFormGroup>

            <UFormGroup label="Title" required>
              <UInput
                v-model="scrapedData.title"
                placeholder="Property title"
                :ui="{ base: 'bg-white dark:bg-white' }"
              />
            </UFormGroup>

            <UFormGroup label="Location" required>
              <UInput
                v-model="scrapedData.location"
                placeholder="Property location"
                :ui="{ base: 'bg-white dark:bg-white' }"
              />
            </UFormGroup>
          </div>

          <UFormGroup label="Price" required>
            <UInput
              v-model="scrapedData.price"
              type="number"
              step="0.01"
              min="0"
              placeholder="100000"
              :ui="{ base: 'bg-white dark:bg-white' }"
            />
          </UFormGroup>

          <UFormGroup label="Currency">
            <USelect
              v-model="scrapedData.currency"
              :options="currencyOptions"
              :ui="{ base: 'bg-white dark:bg-white' }"
            />
          </UFormGroup>

          <UFormGroup label="Bedrooms" required>
            <UInput
              v-model="scrapedData.bedroom_count"
              type="number"
              min="0"
              :ui="{ base: 'bg-white dark:bg-white' }"
            />
          </UFormGroup>

          <UFormGroup label="Image URL" class="md:col-span-2">
            <UInput
              v-model="scrapedData.image"
              placeholder="Property image URL"
              :ui="{ base: 'bg-white dark:bg-white' }"
            />
          </UFormGroup>
        </div>

        <!-- Preview Image -->
        <div v-if="scrapedData.image" class="mt-2">
          <p class="text-sm text-gray-500 mb-2">Image Preview:</p>
          <div class="relative bg-gray-100 rounded overflow-hidden">
            <img
              :src="scrapedData.image"
              class="w-full h-48 object-cover"
              :alt="scrapedData.title"
              @error="handleImageError"
            />
            <div
              v-if="imageError"
              class="absolute inset-0 flex items-center justify-center bg-gray-100"
            >
              <div class="text-center p-4">
                <UIcon
                  name="i-heroicons-photo"
                  class="text-gray-400 w-12 h-12 mx-auto"
                />
                <p class="text-sm text-gray-500 mt-2">
                  Image could not be loaded
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end space-x-3">
          <UButton color="gray" variant="soft" @click="scrapedData = null">
            Back
          </UButton>
          <UButton type="submit" color="primary" :loading="saving">
            Save Listing
          </UButton>
        </div>
      </form>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import type { Database } from "~/types/database.types";

type Team = Database["public"]["Tables"]["teams"]["Row"];
type TeamListing = Database["public"]["Tables"]["team_listings"]["Row"];
type Listing = Database["public"]["Tables"]["listings"]["Row"];
type ListingInsert = Database["public"]["Tables"]["listings"]["Insert"];

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "save", "error"]);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const supabase = useSupabaseClient<Database>();
const user = useSupabaseUser();
const toast = useToast();
const runtimeConfig = useRuntimeConfig();
const firecrawlApiKey = runtimeConfig.public.firecrawlApiKey;

// Form state
const url = ref("");
const loading = ref(false);
const saving = ref(false);
const isManualInput = ref(false);
const scrapedData = ref<{
  title?: string;
  price?: number | string;
  currency?: string;
  location?: string;
  bedroom_count?: number;
  image?: string;
  url?: string;
} | null>(null);
const error = ref<string | null>(null);
const imageError = ref(false);
const jobId = ref<string | null>(null);
const pollingInterval = ref<ReturnType<typeof setInterval> | null>(null);
const teams = ref<Team[]>([]);
const loadingTeams = ref(false);

// Currency options
const currencyOptions = [
  { label: "EUR", value: "EUR" },
  { label: "USD", value: "USD" },
  { label: "GBP", value: "GBP" },
];

// Function to check extraction job status
async function checkExtractionStatus(id: string) {
  try {
    // Correct endpoint format is /v1/extract/{id}
    const response = await fetch(`https://api.firecrawl.dev/v1/extract/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${firecrawlApiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }

    const result = await response.json();

    if (result.status === "completed") {
      // Stop polling
      if (pollingInterval.value) {
        clearInterval(pollingInterval.value);
        pollingInterval.value = null;
      }

      // Process the completed data
      const extractedData = {
        title: result.data.title || "",
        price:
          typeof result.data.price === "number"
            ? result.data.price
            : parseFloat(result.data.price) || 0,
        currency: result.data.currency || "EUR",
        location: result.data.location || "",
        bedroom_count:
          typeof result.data.bedroom_count === "number"
            ? result.data.bedroom_count
            : parseInt(result.data.bedroom_count) || 0,
        image: result.data.image || "",
      };

      // Update the pending listing in the database
      const { data: updatedListing, error: updateError } = await supabase
        .from("listings")
        .update({
          title: extractedData.title,
          price: extractedData.price,
          currency: extractedData.currency,
          location: extractedData.location,
          bedroom_count: extractedData.bedroom_count,
          image: extractedData.image,
          extraction_job_id: null, // Clear the job ID since it's completed
          last_checked: new Date().toISOString(),
        })
        .eq("extraction_job_id", id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating listing:", updateError);
      } else {
        // Emit update event to refresh the listing in the parent component
        emit("save", updatedListing);
      }

      toast.add({
        title: "Success",
        description: "Property details extracted successfully",
        icon: "i-heroicons-check-circle",
        color: "green",
        timeout: 3000,
      });
    } else if (result.status === "failed") {
      // Stop polling on failure
      if (pollingInterval.value) {
        clearInterval(pollingInterval.value);
        pollingInterval.value = null;
      }

      // Update the pending listing to indicate failure
      const { error: updateError } = await supabase
        .from("listings")
        .update({
          title: "Extraction failed",
          location: "Please try again or edit manually",
          updated_flag: true,
        })
        .eq("extraction_job_id", id);

      if (updateError) {
        console.error("Error updating failed listing:", updateError);
      }

      toast.add({
        title: "Extraction Failed",
        description: result.error || "Failed to extract property details",
        icon: "i-heroicons-exclamation-circle",
        color: "red",
        timeout: 5000,
      });
    }
    // If status is 'pending' or 'processing', continue polling
  } catch (error: any) {
    console.error("Error checking extraction status:", error);

    // Stop polling on error
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value);
      pollingInterval.value = null;
    }

    // Update the pending listing to indicate error
    const { error: updateError } = await supabase
      .from("listings")
      .update({
        title: "Extraction error",
        location: "Please try again or edit manually",
        updated_flag: true,
      })
      .eq("extraction_job_id", id);

    if (updateError) {
      console.error("Error updating listing with error status:", updateError);
    }

    toast.add({
      title: "Error",
      description: `Failed to check extraction status: ${error.message}`,
      icon: "i-heroicons-exclamation-circle",
      color: "red",
      timeout: 5000,
    });
  }
}

// Start polling for results
function startPolling(id: string) {
  // Clear any existing polling
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value);
  }

  // Poll every 3 seconds
  pollingInterval.value = setInterval(() => {
    checkExtractionStatus(id);
  }, 3000);

  // Safety timeout after 60 seconds
  setTimeout(() => {
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value);
      pollingInterval.value = null;

      if (loading.value) {
        loading.value = false;
        toast.add({
          title: "Timeout",
          description: "Extraction is taking too long. Please try again later.",
          icon: "i-heroicons-clock",
          color: "yellow",
          timeout: 5000,
        });
      }
    }
  }, 60000);
}

// Clean up polling when component is unmounted
onBeforeUnmount(() => {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value);
  }
});

const handleSubmitUrl = async () => {
  if (isManualInput.value) {
    scrapedData.value = {
      title: "",
      location: "",
      price: "",
      currency: "EUR", // Default currency
      bedroom_count: 1,
      image: "",
      url: url.value,
    };
    return;
  }

  if (!url.value) {
    error.value = "Please enter a property URL";
    return;
  }

  try {
    loading.value = true;
    error.value = null;

    // Call the scrape-listing Edge Function
    const { data: scrapedResult, error: scrapeError } =
      await supabase.functions.invoke("scrape-listing", {
        body: { url: url.value },
      });

    if (scrapeError) throw new Error(scrapeError.message);

    // Check if we got an error in the response
    if (scrapedResult && scrapedResult.error) {
      throw new Error(scrapedResult.error);
    }

    if (!scrapedResult) throw new Error("No data returned from scraper");

    // Check if we got a job ID for async processing
    if (scrapedResult.jobId && scrapedResult.status === "pending") {
      jobId.value = scrapedResult.jobId;

      // Save a pending listing to the database
      const listingData: ListingInsert = {
        user_id: user.value?.id || "",
        url: url.value,
        title: "Extracting data...", // Temporary title
        price: 0,
        currency: "EUR",
        location: "Pending extraction",
        bedroom_count: 0,
        image: "",
        last_checked: new Date().toISOString(),
        change_history: [],
        updated_flag: false,
        extraction_job_id: scrapedResult.jobId, // Save the extraction job ID
      };

      const { data: pendingListing, error: saveError } = await supabase
        .from("listings")
        .insert(listingData)
        .select()
        .single();

      if (saveError) throw saveError;

      // Emit save event with the pending listing data
      emit("save", pendingListing);

      // Show toast notification
      toast.add({
        title: "Processing",
        description: "Extracting property details. This may take a moment...",
        icon: "i-heroicons-clock",
        color: "blue",
        timeout: 5000,
      });

      // Start polling for results
      startPolling(scrapedResult.jobId);

      // Close the modal after saving the pending listing
      close();
    } else {
      // We got immediate results
      scrapedData.value = scrapedResult;
      loading.value = false;
      toast.add({
        title: "Success",
        description: "Property details extracted successfully",
        icon: "i-heroicons-check-circle",
        color: "green",
        timeout: 3000,
      });
    }
  } catch (e: any) {
    error.value = e.message || "Failed to fetch property details";
    console.error("Error fetching property details:", e);

    // Show error toast but stay on the URL input form
    toast.add({
      title: "Scraping Failed",
      description:
        "Could not automatically fetch property details. Please try a different URL or use manual input.",
      icon: "i-heroicons-exclamation-circle",
      color: "red",
      timeout: 5000,
    });

    // Don't automatically switch to manual input
    // Just stay on the URL input form
  } finally {
    loading.value = false;
  }
};

const useManualInput = () => {
  isManualInput.value = true;
  handleSubmitUrl();
};

const handleSave = async () => {
  try {
    error.value = null;
    saving.value = true;

    if (!scrapedData.value) {
      throw new Error("No data to save");
    }

    // Validate required fields
    if (
      !scrapedData.value.title ||
      !scrapedData.value.location ||
      scrapedData.value.price === undefined ||
      !scrapedData.value.url
    ) {
      throw new Error("Please fill in all required fields");
    }

    // Prepare the listing data
    const listingData: ListingInsert = {
      user_id: user.value?.id || "",
      url: scrapedData.value.url,
      title: scrapedData.value.title,
      price:
        typeof scrapedData.value.price === "string"
          ? parseFloat(scrapedData.value.price)
          : scrapedData.value.price,
      currency: scrapedData.value.currency || "EUR",
      location: scrapedData.value.location,
      bedroom_count: scrapedData.value.bedroom_count || 0,
      image: scrapedData.value.image || undefined,
      last_checked: new Date().toISOString(),
      change_history: [],
      updated_flag: false,
      extraction_job_id: null, // No job ID for manual saves
    };

    // Insert the new listing into the database
    const { data, error: saveError } = await supabase
      .from("listings")
      .insert(listingData)
      .select()
      .single();

    if (saveError) throw saveError;

    // Emit save event with the new listing data
    emit("save", data);

    // Show success message
    toast.add({
      title: "Listing Saved",
      description: "The property listing has been successfully added.",
      icon: "i-heroicons-check-circle",
      color: "green",
      timeout: 3000,
    });

    // Reset form and close modal
    resetForm();
    close();
  } catch (e: any) {
    error.value = e.message || "Failed to save listing";
    console.error("Error saving listing:", e);

    toast.add({
      title: "Save Failed",
      description: error.value || "Failed to save listing",
      icon: "i-heroicons-exclamation-triangle",
      color: "red",
      timeout: 5000,
    });
  } finally {
    saving.value = false;
  }
};

const close = () => {
  isOpen.value = false;
  resetForm();
};

const resetForm = () => {
  url.value = "";
  scrapedData.value = null;
  error.value = null;
  imageError.value = false;
  isManualInput.value = false;
};

const handleImageError = () => {
  imageError.value = true;
};

// Fetch user's teams
const fetchTeams = async () => {
  try {
    loadingTeams.value = true;
    const { data, error: teamsError } = await supabase
      .from("teams")
      .select("*")
      .order("name");

    if (teamsError) throw teamsError;
    teams.value = data || [];
  } catch (e: any) {
    console.error("Error fetching teams:", e);
  } finally {
    loadingTeams.value = false;
  }
};

// Fetch teams on mount
const { data: teamsData, error: teamsError } = await useAsyncData(
  "teams",
  async () => {
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .order("name");

    if (error) throw error;
    return data;
  }
);

if (teamsError.value) {
  console.error("Error fetching teams:", teamsError.value);
} else {
  teams.value = teamsData.value || [];
}
</script>
