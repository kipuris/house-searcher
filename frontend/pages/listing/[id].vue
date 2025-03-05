<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4">
      <!-- Back Button -->
      <UButton
        icon="i-heroicons-arrow-left"
        color="gray"
        variant="ghost"
        class="mb-6"
        to="/"
      >
        Back to Listings
      </UButton>

      <!-- Loading State -->
      <div v-if="isLoading" class="space-y-4">
        <USkeleton class="h-8 w-3/4 mb-2" />
        <USkeleton class="h-6 w-1/2 mb-6" />
        <USkeleton class="h-64 w-full mb-6" />
        <USkeleton class="h-6 w-full mb-2" />
        <USkeleton class="h-6 w-3/4 mb-2" />
        <USkeleton class="h-6 w-1/2" />
      </div>

      <!-- Error State -->
      <UAlert v-else-if="error" type="danger" :title="error" class="mb-4ƒ" />

      <!-- Listing Details -->
      <div v-else-if="listing" class="space-y-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">{{ listing.title }}</h1>
          <p class="text-lg text-gray-600 mt-1">{{ listing.location }}</p>
        </div>

        <!-- Price and Bedrooms -->
        <div class="flex flex-wrap items-center gap-4">
          <UBadge size="lg" color="primary" class="text-lg font-bold">
            {{ formattedPrice }}
          </UBadge>
          <UBadge
            size="md"
            color="gray"
            variant="soft"
            class="flex items-center gap-1"
          >
            <UIcon name="i-heroicons-home" class="w-4 h-4" />
            {{ listing.bedroom_count }} Bedrooms
          </UBadge>
          <UBadge
            v-if="listing.updated_flag"
            size="md"
            color="amber"
            variant="soft"
            class="flex items-center gap-1"
          >
            <UIcon name="i-heroicons-bell-alert" class="w-4 h-4" />
            Recently Updated
          </UBadge>
        </div>

        <!-- Property Image -->
        <img
          :src="listing.image || 'https://placehold.co/800x400?text=No+Image'"
          class="w-full h-auto object-cover rounded-lg shadow-md"
          :alt="listing.title"
        />

        <!-- Property Details -->
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <h2 class="text-xl font-semibold">Property Details</h2>
              <div class="flex gap-2">
                <UButton
                  color="primary"
                  variant="soft"
                  icon="i-heroicons-arrow-path"
                  @click="refreshListing"
                  :loading="isLoadingListing"
                >
                  Refresh Listing
                </UButton>
              </div>
            </div>
          </template>

          <div class="space-y-4">
            <div v-if="listing.url" class="flex items-start gap-2">
              <UIcon
                name="i-heroicons-link"
                class="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5"
              />
              <div>
                <div class="font-medium">Original Listing</div>
                <a
                  :href="listing.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary-600 hover:underline break-all"
                >
                  {{ listing.url }}
                </a>
              </div>
            </div>

            <div class="flex items-start gap-2">
              <UIcon
                name="i-heroicons-clock"
                class="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5"
              />
              <div>
                <div class="font-medium">Last Checked</div>
                <div>{{ formatDate(listing.last_checked) }}</div>
              </div>
            </div>

            <div class="flex items-start gap-2">
              <UIcon
                name="i-heroicons-calendar"
                class="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5"
              />
              <div>
                <div class="font-medium">Added On</div>
                <div>{{ formatDate(listing.created_at) }}</div>
              </div>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton
                color="gray"
                variant="soft"
                icon="i-heroicons-pencil-square"
                @click="editListing"
              >
                Edit
              </UButton>
              <UButton
                color="red"
                variant="soft"
                icon="i-heroicons-trash"
                @click="confirmDelete"
                :loading="deleting"
              >
                Delete
              </UButton>
            </div>
          </template>
        </UCard>

        <!-- Content -->
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <h2 class="text-xl font-semibold">Listing Details</h2>
              <div class="flex gap-2">
                <UButton
                  v-if="listing.url"
                  color="amber"
                  variant="soft"
                  icon="i-heroicons-document-text"
                  @click="fetchListingContent"
                  :loading="fetchingContent"
                >
                  Fetch Content
                </UButton>
                <UButton
                  v-if="!isEditing && canEdit"
                  color="primary"
                  variant="soft"
                  icon="i-heroicons-pencil"
                  @click="startEditing"
                >
                  Edit Content
                </UButton>
                <template v-else-if="isEditing">
                  <UButton
                    color="primary"
                    variant="soft"
                    icon="i-heroicons-check"
                    @click="saveContent"
                  >
                    Save
                  </UButton>
                  <UButton
                    color="gray"
                    variant="soft"
                    icon="i-heroicons-x-mark"
                    @click="cancelEditing"
                  >
                    Cancel
                  </UButton>
                </template>
              </div>
            </div>
          </template>

          <!-- Editor -->
          <div v-if="isEditing" class="py-4">
            <RichTextEditor
              v-model="editContent"
              placeholder="Add details about this listing..."
            />
          </div>

          <!-- Content Display -->
          <div v-else>
            <ContentRenderer
              v-if="listing.markdown_content"
              :value="{ body: listing.markdown_content }"
            />
            <div v-else class="py-4 text-center text-gray-500 italic">
              No content available for this listing.
            </div>
          </div>
        </UCard>
      </div>

      <!-- Not Found -->
      <div v-else class="text-center py-12">
        <UIcon
          name="i-heroicons-exclamation-triangle"
          class="w-12 h-12 text-amber-500 mx-auto mb-4"
        />
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Listing Not Found</h2>
        <p class="text-gray-600 mb-6">
          The listing you're looking for doesn't exist or has been removed.
        </p>
        <UButton to="/" color="primary">Back to Listings</UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Database } from "~/types/database.types";

// Define types based on the database schema
type Listing = Database["public"]["Tables"]["listings"]["Row"];
type TeamListing = Database["public"]["Tables"]["team_listings"]["Row"];

const supabase = useSupabaseClient<Database>();
const route = useRoute();
const router = useRouter();
const user = useSupabaseUser();
const toast = useToast();
const id = route.params.id as string;

const listing = ref<Listing | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const isEditing = ref(false);
const editContent = ref("");
const deleting = ref(false);
const fetchingContent = ref(false);

// Use useAsyncData to fetch the listing data
const {
  data: listingData,
  pending: isLoadingListing,
  error: listingError,
  refresh: refreshListing,
} = useAsyncData(
  `listing-${id}`,
  async () => {
    try {
      // First try to get from personal listings
      const { data: personalListing, error: personalError } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .single();

      if (personalListing) {
        return personalListing;
      }

      // If not found in personal listings, try team listings
      const { data: teamListing, error: teamError } = await supabase
        .from("team_listings")
        .select("*")
        .eq("id", id)
        .single();

      if (teamListing) {
        return teamListing as unknown as Listing;
      }

      throw new Error("Listing not found");
    } catch (err) {
      console.error("Error fetching listing:", err);
      throw new Error("Error fetching listing");
    }
  },
  {
    server: false, // Don't run on server
    immediate: true, // Run immediately when component is created
  }
);

// Update the listing ref when data changes
watch(listingData, (newListing) => {
  if (newListing) {
    listing.value = newListing;
  }
});

// Update loading state based on pending
watch(isLoadingListing, (isPending) => {
  isLoading.value = isPending;
});

// Update error state
watch(listingError, (newError) => {
  error.value = newError ? "Error fetching listing" : null;
});

// Format date
const formatDate = (date: string | null): string => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
};

// Edit listing
const editListing = () => {
  // For now, we'll just redirect to the dashboard
  router.push("/");
};

// Delete listing
const confirmDelete = async () => {
  if (!window.confirm("Are you sure you want to delete this listing?")) {
    return;
  }

  try {
    deleting.value = true;

    const { error: deleteError } = await supabase
      .from("listings")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    // Redirect to dashboard after successful deletion
    router.push("/");
  } catch (e: any) {
    error.value = e.message;
  } finally {
    deleting.value = false;
  }
};

// Start editing the content
function startEditing() {
  if (!listing.value) return;

  // Check if content is markdown or HTML
  const content = listing.value.markdown_content || "";

  // Set the content for editing
  editContent.value = content;
  isEditing.value = true;
}

// Save the edited content
async function saveContent() {
  if (!listing.value || !editContent.value) return;

  try {
    const updatedContent = editContent.value;

    // Determine if this is a personal or team listing
    const isTeamListing = listing.value.hasOwnProperty("team_id");

    if (isTeamListing) {
      // Update team listing
      const { data, error: updateError } = await supabase
        .from("team_listings")
        .update({ markdown_content: updatedContent })
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;
      if (data) {
        // Refresh the listing data
        await refreshListing();
      }
    } else {
      // Update personal listing
      const { data, error: updateError } = await supabase
        .from("listings")
        .update({ markdown_content: updatedContent })
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;
      if (data) {
        // Refresh the listing data
        await refreshListing();
      }
    }

    isEditing.value = false;
  } catch (err) {
    console.error("Error saving content:", err);
    error.value = "Failed to save content";
  }
}

// Cancel editing
function cancelEditing() {
  isEditing.value = false;
  editContent.value = "";
}

// Check if user can edit
const canEdit = computed(() => {
  if (!user.value || !listing.value) return false;
  return listing.value.user_id === user.value?.id;
});

// Format the price for display
const formattedPrice = computed(() => {
  if (!listing.value || !listing.value.price) return "Price not available";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: listing.value.currency || "USD",
    maximumFractionDigits: 0,
  }).format(listing.value.price);
});

// Fetch listing content
const fetchListingContent = async () => {
  if (!listing.value || !listing.value.url || fetchingContent.value) return;

  try {
    fetchingContent.value = true;
    toast.add({
      title: "Fetching content",
      description: "Getting content from the original listing...",
      color: "blue",
      icon: "i-heroicons-information-circle",
      timeout: 3000,
    });

    // Call the scrape-markdown Edge Function
    const { data: scrapedContent, error: scrapeError } =
      await supabase.functions.invoke("scrape-markdown", {
        body: { url: listing.value.url, listingId: id },
      });

    if (scrapeError) throw scrapeError;

    if (scrapedContent?.error) {
      throw new Error(scrapedContent.error);
    }

    if (scrapedContent?.markdown) {
      // Determine if this is a personal or team listing
      const isTeamListing = listing.value.hasOwnProperty("team_id");

      if (isTeamListing) {
        // Update team listing
        const { data, error: updateError } = await supabase
          .from("team_listings")
          .update({ markdown_content: scrapedContent.markdown })
          .eq("id", id)
          .select()
          .single();

        if (updateError) throw updateError;
        if (data) {
          toast.add({
            title: "Success",
            description: "Content fetched and saved successfully",
            color: "green",
            icon: "i-heroicons-check-circle",
            timeout: 3000,
          });

          // Refresh the listing data
          await refreshListing();
        }
      } else {
        // Update personal listing
        const { data, error: updateError } = await supabase
          .from("listings")
          .update({ markdown_content: scrapedContent.markdown })
          .eq("id", id)
          .select()
          .single();

        if (updateError) throw updateError;
        if (data) {
          toast.add({
            title: "Success",
            description: "Content fetched and saved successfully",
            color: "green",
            icon: "i-heroicons-check-circle",
            timeout: 3000,
          });

          // Refresh the listing data
          await refreshListing();
        }
      }
    } else {
      throw new Error("No markdown content was returned from the scraper");
    }
  } catch (err: any) {
    console.error("Error fetching listing content:", err);
    error.value = "Failed to fetch listing content";
    toast.add({
      title: "Error",
      description: err.message || "Failed to fetch content",
      color: "red",
      icon: "i-heroicons-exclamation-circle",
      timeout: 5000,
    });
  } finally {
    fetchingContent.value = false;
  }
};
</script>
