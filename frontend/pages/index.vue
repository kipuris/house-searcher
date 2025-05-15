<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Home</h1>
        <div class="flex space-x-2">
          <UButton
            icon="i-heroicons-folder-plus"
            color="gray"
            variant="soft"
            @click="showCreateFolderModal = true"
          >
            New Folder
          </UButton>
          <UButton
            icon="i-heroicons-plus"
            color="primary"
            @click="handleAddListingClick"
          >
            Add Listing
          </UButton>
        </div>
      </div>

      <!-- Error Alert -->
      <UAlert
        v-if="error"
        type="danger"
        title="Error loading content"
        :description="error"
        class="mb-4"
      />

      <!-- Pending Extractions Component -->
      <PendingExtractions @update-listing="handleUpdateListing" />

      <!-- Search and Filter Bar -->
      <div
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
      >
        <div class="relative w-full sm:w-64">
          <UInput
            v-model="search"
            icon="i-heroicons-magnifying-glass"
            placeholder="Search..."
            class="w-full"
          />
          <UButton
            v-if="search"
            icon="i-heroicons-x-mark"
            color="gray"
            variant="ghost"
            size="xs"
            class="absolute right-2 top-1/2 transform -translate-y-1/2"
            @click="search = ''"
          />
        </div>
        <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
          <!-- View Toggle -->
          <UButtonGroup size="sm">
            <UButton
              :color="viewMode === 'grid' ? 'primary' : 'gray'"
              @click="viewMode = 'grid'"
              icon="i-heroicons-squares-2x2"
              :ui="{ rounded: 'rounded-l-md rounded-r-none' }"
            />
            <UButton
              :color="viewMode === 'list' ? 'primary' : 'gray'"
              @click="viewMode = 'list'"
              icon="i-heroicons-bars-3"
              :ui="{ rounded: 'rounded-r-md rounded-l-none' }"
            />
          </UButtonGroup>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="pending" class="space-y-8">
        <!-- Folders Skeleton -->
        <div>
          <h2 class="text-lg font-medium text-gray-900 mb-3">Folders</h2>
          <div
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          >
            <UCard v-for="n in 4" :key="`folder-${n}`" class="relative">
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-heroicons-folder"
                  class="w-6 h-6 text-primary-500"
                />
                <USkeleton class="h-5 w-24" />
              </div>
            </UCard>
          </div>
        </div>

        <!-- Listings Skeleton -->
        <div>
          <h2 class="text-lg font-medium text-gray-900 mb-3">Listings</h2>
          <div
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            <UCard v-for="n in 3" :key="`listing-${n}`" class="relative">
              <USkeleton class="h-48 w-full mb-4" />
              <div class="space-y-2">
                <USkeleton class="h-6 w-3/4" />
                <USkeleton class="h-4 w-1/2" />
              </div>
            </UCard>
          </div>
        </div>
      </div>

      <!-- Content (Folders and Listings) -->
      <div v-else class="space-y-8">
        <!-- Folders Section -->
        <div>
          <h2 class="text-lg font-medium text-gray-900 mb-3">
            Folders
            <span class="text-sm text-gray-500 font-normal"
              >({{ filteredFolders.length }})</span
            >
          </h2>

          <template v-if="filteredFolders.length">
            <div
              class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            >
              <UCard
                v-for="folder in filteredFolders"
                :key="folder.id"
                class="cursor-pointer hover:shadow-md transition-shadow"
                @click="navigateToFolder(folder.id)"
              >
                <div class="flex items-center gap-2">
                  <UIcon
                    name="i-heroicons-folder"
                    class="w-6 h-6 text-primary-500"
                  />
                  <h3 class="font-medium text-gray-900 truncate">
                    {{ folder.name }}
                  </h3>
                </div>
                <p
                  v-if="folder.description"
                  class="text-xs text-gray-500 mt-1 truncate"
                >
                  {{ folder.description }}
                </p>
                <p class="text-xs text-gray-500 mt-2">
                  {{ folderListingCounts[folder.id] || 0 }} item{{
                    folderListingCounts[folder.id] !== 1 ? "s" : ""
                  }}
                </p>
              </UCard>
            </div>
          </template>
          <UCard v-else class="text-center p-4">
            <div class="flex flex-col items-center">
              <UIcon
                name="i-heroicons-folder-plus"
                class="text-gray-400 w-10 h-10 mb-2"
              />
              <p class="text-gray-500">No folders found</p>
              <UButton
                color="primary"
                variant="ghost"
                size="sm"
                class="mt-2"
                @click="showCreateFolderModal = true"
              >
                Create a folder
              </UButton>
            </div>
          </UCard>
        </div>

        <!-- Listings Section -->
        <div>
          <h2 class="text-lg font-medium text-gray-900 mb-3">
            Listings
            <span class="text-sm text-gray-500 font-normal"
              >({{ unfolderedListings.length }})</span
            >
          </h2>

          <ListingGrid
            :listings="unfolderedListings"
            :loading="false"
            v-model:viewMode="viewMode"
            :page="page"
            :total-pages="totalPages"
            @page-change="handlePageChange"
            @update-listing="handleUpdateListing"
            @delete-listing="handleDeleteListing"
            @save-to-folder="handleSaveToFolder"
          />
        </div>
      </div>

      <!-- Add Listing Modal -->
      <AddListing
        v-model="showAddListingModal"
        @save="handleAddListing"
        @error="handleError"
      />

      <!-- Create Folder Modal -->
      <UModal v-model="showCreateFolderModal">
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="text-base font-semibold">Create New Folder</h3>
            </div>
          </template>

          <form @submit.prevent="createFolder">
            <div class="space-y-4">
              <UFormGroup label="Folder Name" required>
                <UInput
                  v-model="folderForm.name"
                  placeholder="Enter folder name"
                />
              </UFormGroup>

              <UFormGroup label="Description (optional)">
                <UTextarea
                  v-model="folderForm.description"
                  placeholder="Enter a description for this folder"
                  rows="3"
                />
              </UFormGroup>
            </div>

            <div class="flex justify-end gap-2 mt-6">
              <UButton
                type="button"
                color="gray"
                @click="showCreateFolderModal = false"
                :disabled="creatingFolder"
              >
                Cancel
              </UButton>
              <UButton type="submit" color="primary" :loading="creatingFolder">
                Create
              </UButton>
            </div>
          </form>
        </UCard>
      </UModal>
    </div>
  </div>
</template>

<script setup>
import { useSiteMeta } from "~/composables/useSiteMeta";

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const router = useRouter();
const route = useRoute();

// UI State
const showAddListingModal = ref(false);
const showCreateFolderModal = ref(false);
const error = ref(null);
const page = ref(1);
const perPage = 9; // Number of items per page
const search = ref("");
const viewMode = ref("grid");

// Folder state
const folderForm = ref({
  name: "",
  description: "",
});
const creatingFolder = ref(false);
const folders = ref([]);
const folderListingCounts = ref({});
const listingsInFolders = ref(new Set());

// Initialize from localStorage only on client-side
onMounted(() => {
  if (process.client) {
    viewMode.value = localStorage.getItem("listingViewMode") || "grid";
  }
});

// Watch for view mode changes and save to localStorage
watch(viewMode, (newMode) => {
  if (process.client) {
    localStorage.setItem("listingViewMode", newMode);
  }
});

// Set meta tags for the home page
const { setPageMeta } = useSiteMeta();
setPageMeta({
  title: "Home",
  description:
    "Track and manage your property listings in one place. Save time and stay organized with House Searcher.",
});

// Fetch folder contents
const fetchFolderContents = async () => {
  try {
    const { data: folderListings, error: folderListingsError } = await supabase
      .from("folder_listings")
      .select("*");

    if (folderListingsError) throw folderListingsError;

    // Calculate counts per folder
    const counts = {};
    const listedIds = new Set();

    folderListings.forEach((item) => {
      // Track listing IDs that are in folders
      listedIds.add(item.listing_id);

      // Count listings per folder
      if (!counts[item.folder_id]) {
        counts[item.folder_id] = 1;
      } else {
        counts[item.folder_id]++;
      }
    });

    folderListingCounts.value = counts;
    listingsInFolders.value = listedIds;
  } catch (e) {
    console.error("Error fetching folder contents:", e);
  }
};

// Data fetching with pagination
const {
  data: listingsData,
  pending: loadingListings,
  refresh: refreshListings,
} = await useAsyncData("listings", async () => {
  try {
    error.value = null;

    // Get all personal and team listings
    const [personalListings, teamListings] = await Promise.all([
      supabase
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("team_listings")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (personalListings.error) throw personalListings.error;
    if (teamListings.error) throw teamListings.error;

    // Combine and deduplicate listings
    const combinedListings = [
      ...personalListings.data,
      ...teamListings.data,
    ].reduce((acc, current) => {
      const x = acc.find((item) => item.id === current.id);
      if (!x) {
        return acc.concat([current]);
      } else {
        return acc;
      }
    }, []);

    // Sort by created_at
    combinedListings.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return {
      items: combinedListings,
      total: combinedListings.length,
    };
  } catch (e) {
    error.value = e.message;
    return { items: [], total: 0 };
  }
});

// Fetch folders and folder listings
const { pending: loadingFolders, refresh: refreshFolders } = await useAsyncData(
  "folders-data",
  async () => {
    try {
      // Fetch user's folders
      const { data: userFolders, error: foldersError } = await supabase
        .from("folders")
        .select("*")
        .order("created_at", { ascending: false });

      if (foldersError) throw foldersError;
      folders.value = userFolders || [];

      // Fetch listings in folders to calculate counts and identify foldered listings
      await fetchFolderContents();

      return true;
    } catch (e) {
      console.error("Error loading folders:", e);
      error.value = e.message;
      return false;
    }
  }
);

// Computed properties
const listings = computed(() => listingsData.value?.items || []);

// Filter listings that are not in any folder
const unfolderedListings = computed(() => {
  const listedIds = listingsInFolders.value;

  // Filter listings that aren't in folders
  let unfiled = listings.value.filter((listing) => !listedIds.has(listing.id));

  // Apply search if present
  if (search.value) {
    const searchLower = search.value.toLowerCase();
    unfiled = unfiled.filter(
      (listing) =>
        listing.title?.toLowerCase().includes(searchLower) ||
        listing.location?.toLowerCase().includes(searchLower) ||
        listing.url?.toLowerCase().includes(searchLower)
    );
  }

  return unfiled;
});

// Filter folders by search
const filteredFolders = computed(() => {
  if (!search.value) return folders.value;

  const searchLower = search.value.toLowerCase();
  return folders.value.filter(
    (folder) =>
      folder.name.toLowerCase().includes(searchLower) ||
      (folder.description &&
        folder.description.toLowerCase().includes(searchLower))
  );
});

const totalPages = computed(() => {
  const totalItems = unfolderedListings.value.length;
  return Math.max(1, Math.ceil(totalItems / perPage));
});

// Methods
const handlePageChange = (newPage) => {
  page.value = newPage;
};

const handleAddListingClick = () => {
  error.value = null;
  showAddListingModal.value = true;
};

const handleAddListing = async (newListing) => {
  await refreshListings();
};

const handleError = (errorMessage) => {
  error.value = errorMessage;
};

const handleUpdateListing = async () => {
  await refreshListings();
};

const handleDeleteListing = async (listingId) => {
  try {
    error.value = null;

    // Delete the listing from the database
    const { error: deleteError } = await supabase
      .from("listings")
      .delete()
      .eq("id", listingId);

    if (deleteError) throw deleteError;

    // Refresh data
    await Promise.all([refreshListings(), refreshFolders()]);
  } catch (e) {
    error.value = e.message;
    console.error("Error deleting listing:", e);
  }
};

const navigateToFolder = (folderId) => {
  router.push(`/folder/${folderId}`);
};

const createFolder = async () => {
  try {
    creatingFolder.value = true;

    if (!folderForm.value.name.trim()) {
      error.value = "Folder name is required";
      return;
    }

    // Create new folder
    const { error: insertError } = await supabase.from("folders").insert({
      name: folderForm.value.name.trim(),
      description: folderForm.value.description.trim() || null,
      user_id: user.value.id,
    });

    if (insertError) throw insertError;

    // Reset form and close modal
    folderForm.value = { name: "", description: "" };
    showCreateFolderModal.value = false;

    // Refresh data
    await refreshFolders();
  } catch (e) {
    error.value = e.message;
  } finally {
    creatingFolder.value = false;
  }
};

const handleSaveToFolder = async (data) => {
  // Navigate to the folder that the listing was saved to
  if (data && data.folderId) {
    await navigateToPage(`/folder/${data.folderId}`);
  }
};

// For pagination - return a slice of the unfiled listings
const paginatedListings = computed(() => {
  const start = (page.value - 1) * perPage;
  const end = start + perPage;
  return unfolderedListings.value.slice(start, end);
});

// Helper function for navigation
const navigateToPage = (path) => {
  router.push(path);
};

// Set up auto-refresh of data when this page is revisited
// This ensures fresh data when navigating back to this page
useAsyncData(
  "prefetch-refresh",
  async () => {
    // Only refresh if the route has changed and we're navigating back to this page
    if (process.client && route.path === "/") {
      // Short delay to ensure all reactivity is settled
      await new Promise((resolve) => setTimeout(resolve, 0));
      await Promise.all([refreshListings(), refreshFolders()]);
    }
    return true;
  },
  {
    watch: [() => route.path],
    immediate: false,
  }
);

const pending = computed(() => loadingListings.value || loadingFolders.value);
</script>
