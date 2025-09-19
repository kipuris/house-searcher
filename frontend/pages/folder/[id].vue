<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto">
      <!-- Folder Header with Back Button -->
      <div class="flex items-center gap-3 mb-6">
        <UButton
          icon="i-heroicons-arrow-left"
          color="gray"
          variant="ghost"
          @click="navigateBack"
        />
        <div>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-folder" class="text-primary-500 w-6 h-6" />
            <h1 class="text-3xl font-bold text-gray-900">
              {{ folder?.name || "Folder" }}
            </h1>
          </div>
          <p v-if="folder?.description" class="text-gray-500 mt-1">
            {{ folder.description }}
          </p>
        </div>
      </div>

      <!-- Error Alert -->
      <UAlert
        v-if="error"
        type="danger"
        title="Error loading folder"
        :description="error"
        class="mb-4"
      />

      <!-- Loading State -->
      <div v-if="pending && !folder">
        <USkeleton class="h-8 w-1/3 mb-4" />
        <USkeleton class="h-4 w-1/2 mb-8" />
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        >
          <UCard v-for="n in 6" :key="n" class="relative">
            <USkeleton class="h-48 w-full mb-4" />
            <div class="space-y-2">
              <USkeleton class="h-6 w-3/4" />
              <USkeleton class="h-4 w-1/2" />
              <div class="flex justify-between items-center">
                <USkeleton class="h-6 w-1/3" />
                <USkeleton class="h-4 w-1/4" />
              </div>
            </div>
          </UCard>
        </div>
      </div>

      <template v-else>
        <!-- Action Buttons -->
        <div class="flex justify-between items-center mb-6">
          <span class="text-gray-500">
            {{ folderListings.length }} listing{{
              folderListings.length !== 1 ? "s" : ""
            }}
          </span>
          <div class="flex gap-2">
            <USelectMenu
              v-if="folderListings.length > 0"
              v-model="sortBy"
              :options="sortOptions"
              placeholder="Sort by"
              class="w-40"
              @change="updateSortQuery"
            />
            <UButton
              v-if="folderListings.length > 0"
              color="gray"
              icon="i-heroicons-funnel"
              @click="showFilterModal = true"
            >
              Filter
            </UButton>
            <UButton
              color="primary"
              icon="i-heroicons-plus"
              @click="showAddListingModal = true"
            >
              Add Listing
            </UButton>
          </div>
        </div>

        <!-- Empty State -->
        <UCard v-if="!folderListings.length" class="text-center p-8">
          <UIcon
            name="i-heroicons-photo"
            class="text-gray-400 w-16 h-16 mx-auto mb-4"
          />
          <h3 class="text-xl font-medium text-gray-900 mb-2">
            No listings in this folder yet
          </h3>
          <p class="text-gray-500 mb-6">Add some listings to this folder</p>
          <UButton color="primary" @click="showAddListingModal = true">
            Add your first listing
          </UButton>
        </UCard>

        <!-- Listings Grid -->
        <div
          v-else
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        >
          <UCard
            v-for="listing in sortedListings"
            :key="listing.id"
            class="relative cursor-pointer hover:shadow-md transition-shadow"
            @click="navigateToListing(listing.id)"
          >
            <!-- Remove button -->
            <UButton
              class="absolute top-1 right-1 z-10"
              color="red"
              variant="soft"
              icon="i-heroicons-x-mark"
              size="xs"
              @click.stop="confirmRemoveListing(listing)"
              :ui="{
                icon: {
                  base: 'w-4 h-4 sm:w-5 sm:h-5',
                },
              }"
            />

            <!-- Property Image -->
            <img
              :src="
                listing.image || 'https://placehold.co/600x400?text=No+Image'
              "
              class="w-full h-36 sm:h-48 object-cover rounded-t"
              :alt="listing.title"
            />

            <!-- Property Details -->
            <div class="p-3 sm:p-4 space-y-3 sm:space-y-4">
              <div>
                <h3 class="text-base sm:text-lg font-semibold text-gray-900">
                  {{ listing.title }}
                </h3>
                <p class="text-xs sm:text-sm text-gray-500">
                  {{ listing.location }}
                </p>
              </div>

              <div class="space-y-1">
                <div class="flex justify-between items-center">
                  <span class="text-lg sm:text-xl font-bold text-primary-600">
                    {{ formatPrice(listing.price, listing.currency) }}
                  </span>
                  <span class="text-xs sm:text-sm text-gray-500">
                    {{ listing.bedroom_count }} beds
                  </span>
                </div>
                <div v-if="listing.price_per_sqm" class="text-xs text-gray-500">
                  {{ formatPrice(listing.price_per_sqm, listing.currency) }}/m²
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </template>

      <!-- Add Listing Modal -->
      <UModal v-model="showAddListingModal">
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="text-base font-semibold">Add Listing to Folder</h3>
            </div>
          </template>

          <div class="space-y-4">
            <!-- Loading State -->
            <div v-if="loadingListings" class="py-4 text-center">
              <UIcon
                name="i-heroicons-arrow-path"
                class="animate-spin w-6 h-6 mx-auto mb-2"
              />
              <p class="text-gray-500">Loading available listings...</p>
            </div>

            <!-- Error Alert -->
            <UAlert
              v-else-if="availableListingsError"
              type="danger"
              title="Error loading listings"
              :description="availableListingsError"
              class="mb-4"
            />

            <!-- No Listings Available -->
            <div v-else-if="!availableListings.length" class="py-4 text-center">
              <p class="text-gray-500">No available listings to add</p>
              <UButton
                color="gray"
                variant="ghost"
                class="mt-4"
                @click="showAddListingModal = false"
              >
                Cancel
              </UButton>
            </div>

            <template v-else>
              <!-- Search Input -->
              <div class="relative">
                <UInput
                  v-model="listingsSearch"
                  icon="i-heroicons-magnifying-glass"
                  placeholder="Search listings..."
                  class="w-full"
                />
              </div>

              <!-- Listings List -->
              <div class="max-h-72 overflow-y-auto border rounded-md">
                <UButton
                  v-for="listing in filteredAvailableListings"
                  :key="listing.id"
                  block
                  variant="ghost"
                  class="justify-start border-b last:border-0"
                  @click="addListingToFolder(listing)"
                >
                  <div class="flex items-center gap-3 w-full text-left">
                    <img
                      :src="
                        listing.image ||
                        'https://placehold.co/600x400?text=No+Image'
                      "
                      class="w-12 h-12 object-cover rounded"
                      :alt="listing.title"
                    />
                    <div class="truncate">
                      <p class="font-medium text-gray-900">
                        {{ listing.title }}
                      </p>
                      <p class="text-xs text-gray-500">
                        {{ listing.location }}
                      </p>
                    </div>
                    <span class="ml-auto text-sm font-bold text-primary-600">
                      {{ formatPrice(listing.price, listing.currency) }}
                    </span>
                  </div>
                </UButton>
              </div>

              <!-- Cancel Button -->
              <div class="flex justify-end">
                <UButton color="gray" @click="showAddListingModal = false">
                  Cancel
                </UButton>
              </div>
            </template>
          </div>
        </UCard>
      </UModal>

      <!-- Remove Confirmation Modal -->
      <UModal v-model="showRemoveModal">
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="text-base font-semibold">Remove Listing</h3>
            </div>
          </template>

          <p class="mb-4">
            Are you sure you want to remove "{{ listingToRemove?.title }}" from
            this folder?
          </p>

          <div class="flex justify-end gap-2">
            <UButton
              type="button"
              color="gray"
              @click="showRemoveModal = false"
              :disabled="isRemoving"
            >
              Cancel
            </UButton>
            <UButton
              type="button"
              color="red"
              :loading="isRemoving"
              @click="removeListingFromFolder"
            >
              Remove
            </UButton>
          </div>
        </UCard>
      </UModal>
    </div>
  </div>
</template>

<script setup>
import { useSiteMeta } from "~/composables/useSiteMeta";

// Route parameter
const route = useRoute();
const folderId = route.params.id;

const supabase = useSupabaseClient();
const error = ref(null);
const folder = ref(null);
const folderListings = ref([]);
const showAddListingModal = ref(false);
const showRemoveModal = ref(false);
const showFilterModal = ref(false);
const isRemoving = ref(false);
const listingToRemove = ref(null);
const listingsSearch = ref("");
const availableListings = ref([]);
const loadingListings = ref(false);
const availableListingsError = ref(null);

// Sort functionality
const sortBy = ref("latest");
const sortOptions = [
  { label: "Latest", value: "latest" },
  { label: "Oldest", value: "oldest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Title: A to Z", value: "title_asc" },
  { label: "Title: Z to A", value: "title_desc" },
  { label: "Bedrooms: Low to High", value: "beds_asc" },
  { label: "Bedrooms: High to Low", value: "beds_desc" },
];

// Initialize sort from query params
const router = useRouter();
const query = route.query;
if (query.sort && sortOptions.some((option) => option.value === query.sort)) {
  sortBy.value = query.sort;
}

// Fetch folder data and listings
const { pending, refresh: refreshData } = await useAsyncData(
  `folder-${folderId}`,
  async () => {
    try {
      error.value = null;

      // Fetch folder details
      const { data: folderData, error: folderError } = await supabase
        .from("folders")
        .select("*")
        .eq("id", folderId)
        .single();

      if (folderError) throw folderError;
      folder.value = folderData;

      // Set meta tags
      const { setPageMeta } = useSiteMeta();
      setPageMeta({
        title: folderData.name || "Folder",
        description: folderData.description || "View listings in this folder",
      });

      // Fetch listings in this folder
      await fetchFolderListings();

      return true;
    } catch (e) {
      error.value = e.message;
      console.error("Error loading folder:", e);
      return false;
    }
  }
);

// Fetch listings in the folder
async function fetchFolderListings() {
  try {
    const { data, error: listingsError } = await supabase
      .from("folder_listings")
      .select(
        `
        listing_id,
        listings(*)
      `
      )
      .eq("folder_id", folderId);

    if (listingsError) throw listingsError;

    // Extract listings from the join
    folderListings.value = data.map((item) => item.listings);
  } catch (e) {
    console.error("Error loading folder listings:", e);
    error.value = "Failed to load listings in this folder";
  }
}

// Format price
const formatPrice = (price, currency = "USD") => {
  if (!price) return "N/A";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(price);
};

// Navigate back to folders list
function navigateBack() {
  navigateTo("/folders");
}

// Navigate to listing details
function navigateToListing(listingId) {
  navigateTo(`/listing/${listingId}`);
}

// Confirm remove listing
function confirmRemoveListing(listing) {
  listingToRemove.value = listing;
  showRemoveModal.value = true;
}

// Remove listing from folder
async function removeListingFromFolder() {
  if (!listingToRemove.value) return;

  try {
    isRemoving.value = true;

    // Delete from folder_listings table
    const { error: removeError } = await supabase
      .from("folder_listings")
      .delete()
      .eq("folder_id", folderId)
      .eq("listing_id", listingToRemove.value.id);

    if (removeError) throw removeError;

    // Update local state
    folderListings.value = folderListings.value.filter(
      (listing) => listing.id !== listingToRemove.value.id
    );

    // Reset and close modal
    showRemoveModal.value = false;
    listingToRemove.value = null;
  } catch (e) {
    error.value = e.message;
    console.error("Error removing listing from folder:", e);
  } finally {
    isRemoving.value = false;
  }
}

// Watch for add listing modal changes
watch(showAddListingModal, async (isOpen) => {
  if (isOpen) {
    await fetchAvailableListings();
  }
});

// Fetch available listings to add
async function fetchAvailableListings() {
  try {
    loadingListings.value = true;
    availableListingsError.value = null;

    // Get all user's listings
    const { data: userListings, error: userListingsError } = await supabase
      .from("listings")
      .select("*");

    if (userListingsError) throw userListingsError;

    // Get listings already in the folder
    const { data: folderListingIds, error: folderError } = await supabase
      .from("folder_listings")
      .select("listing_id")
      .eq("folder_id", folderId);

    if (folderError) throw folderError;

    // Filter out listings already in the folder
    const existingIds = new Set(
      folderListingIds.map((item) => item.listing_id)
    );
    availableListings.value = userListings.filter(
      (listing) => !existingIds.has(listing.id)
    );
  } catch (e) {
    availableListingsError.value = e.message;
    console.error("Error fetching available listings:", e);
    availableListings.value = [];
  } finally {
    loadingListings.value = false;
  }
}

// Sort listings based on selected criteria
const sortedListings = computed(() => {
  if (!folderListings.value.length) return [];

  const listings = [...folderListings.value];
  const sortValue =
    typeof sortBy.value === "object" ? sortBy.value.value : sortBy.value;

  switch (sortValue) {
    case "latest":
      return listings.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
    case "oldest":
      return listings.sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );
    case "price_asc":
      return listings.sort((a, b) => (a.price || 0) - (b.price || 0));
    case "price_desc":
      return listings.sort((a, b) => (b.price || 0) - (a.price || 0));
    case "title_asc":
      return listings.sort((a, b) =>
        (a.title || "").localeCompare(b.title || "")
      );
    case "title_desc":
      return listings.sort((a, b) =>
        (b.title || "").localeCompare(a.title || "")
      );
    case "beds_asc":
      return listings.sort(
        (a, b) => (a.bedroom_count || 0) - (b.bedroom_count || 0)
      );
    case "beds_desc":
      return listings.sort(
        (a, b) => (b.bedroom_count || 0) - (a.bedroom_count || 0)
      );
    default:
      return listings;
  }
});

// Update query parameter when sort changes
function updateSortQuery() {
  const sortValue =
    typeof sortBy.value === "object" ? sortBy.value.value : sortBy.value;
  router.push({
    query: {
      ...route.query,
      sort: sortValue,
    },
  });
}

// Filter available listings based on search
const filteredAvailableListings = computed(() => {
  if (!listingsSearch.value.trim()) return availableListings.value;

  const searchTerm = listingsSearch.value.toLowerCase();
  return availableListings.value.filter(
    (listing) =>
      listing.title.toLowerCase().includes(searchTerm) ||
      (listing.location && listing.location.toLowerCase().includes(searchTerm))
  );
});

// Add listing to folder
async function addListingToFolder(listing) {
  try {
    // Add to folder_listings table
    const { error: addError } = await supabase.from("folder_listings").insert({
      folder_id: folderId,
      listing_id: listing.id,
    });

    if (addError) throw addError;

    // Update local state
    folderListings.value = [...folderListings.value, listing];

    // Remove from available listings
    availableListings.value = availableListings.value.filter(
      (item) => item.id !== listing.id
    );

    // Close modal if no more listings to add
    if (availableListings.value.length === 0) {
      showAddListingModal.value = false;
    }
  } catch (e) {
    error.value = e.message;
    console.error("Error adding listing to folder:", e);
  }
}
</script>
