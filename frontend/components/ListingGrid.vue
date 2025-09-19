<template>
  <div class="space-y-4">
    <!-- Filters and Sort Options -->
    <div
      class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
    >
      <div
        class="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto"
      >
        <div class="relative w-full sm:w-64">
          <UInput
            v-model="search"
            icon="i-heroicons-magnifying-glass"
            placeholder="Search listings..."
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
        <USelect
          v-model="sortBy"
          :options="sortOptions"
          placeholder="Sort by"
          class="w-full sm:w-40"
        />
        <UButton
          v-if="search || sortBy"
          size="sm"
          color="gray"
          variant="soft"
          @click="clearFilters"
          icon="i-heroicons-funnel-x-mark"
        >
          Clear Filters
        </UButton>
      </div>
      <div class="flex items-center gap-2">
        <!-- Results Count -->
        <span class="text-sm text-gray-500 mr-2 hidden sm:inline-block">
          {{ filteredListings.length }} result{{
            filteredListings.length !== 1 ? "s" : ""
          }}
        </span>
        <!-- View Toggle -->
        <UButtonGroup size="sm">
          <UButton
            :color="props.viewMode === 'grid' ? 'primary' : 'gray'"
            @click="$emit('update:viewMode', 'grid')"
            icon="i-heroicons-squares-2x2"
            :ui="{ rounded: 'rounded-l-md rounded-r-none' }"
          />
          <UButton
            :color="props.viewMode === 'list' ? 'primary' : 'gray'"
            @click="$emit('update:viewMode', 'list')"
            icon="i-heroicons-bars-3"
            :ui="{ rounded: 'rounded-r-md rounded-l-none' }"
          />
        </UButtonGroup>
        <UButton
          icon="i-heroicons-plus"
          color="primary"
          @click="$emit('add-listing')"
          class="w-full sm:w-auto"
        >
          Add Listing
        </UButton>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading && props.viewMode === 'grid'"
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

    <!-- Loading State for List View -->
    <div v-if="loading && props.viewMode === 'list'" class="space-y-4">
      <UCard v-for="n in 6" :key="n" class="relative">
        <div class="flex flex-col md:flex-row gap-4">
          <div class="w-full md:w-48 h-36 flex-shrink-0">
            <USkeleton class="h-full w-full" />
          </div>
          <div class="flex-grow space-y-3 w-full">
            <div class="flex justify-between items-start">
              <div class="w-2/3">
                <USkeleton class="h-6 w-3/4 mb-2" />
                <USkeleton class="h-4 w-1/2" />
              </div>
              <div class="flex items-center gap-2">
                <USkeleton class="h-8 w-16" />
                <USkeleton class="h-8 w-8" />
              </div>
            </div>
            <div class="flex justify-between items-center pt-2">
              <USkeleton class="h-6 w-1/4" />
              <div class="flex items-center gap-4">
                <USkeleton class="h-4 w-20" />
                <USkeleton class="h-4 w-32" />
              </div>
            </div>
            <USkeleton class="h-4 w-40 mt-2" />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Grid Layout -->
    <div
      v-else-if="filteredListings.length && props.viewMode === 'grid'"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
    >
      <UCard
        v-for="listing in filteredListings"
        :key="listing.id"
        class="relative cursor-pointer hover:shadow-md transition-shadow"
        @click="navigateToListing(listing.id)"
      >
        <!-- Delete Button -->
        <UButton
          class="absolute top-1 right-1 z-10"
          color="red"
          variant="soft"
          icon="i-heroicons-trash"
          size="xs"
          :loading="deletingId === listing.id"
          @click.stop="confirmDelete(listing)"
          :ui="{
            icon: {
              base: 'w-4 h-4 sm:w-5 sm:h-5',
            },
          }"
        />

        <!-- Change Indicator -->
        <div
          v-if="listing.updated_flag"
          class="absolute top-3 right-12 w-2 h-2 sm:w-3 sm:h-3 bg-primary-500 rounded-full"
          title="Property has recent updates"
        />

        <!-- Pending Extraction Indicator -->
        <div
          v-if="listing.extraction_job_id"
          class="absolute top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex items-center justify-center z-10"
        >
          <div class="bg-white p-4 rounded-lg text-center">
            <UIcon
              name="i-heroicons-arrow-path"
              class="animate-spin text-primary-500 w-8 h-8 mx-auto mb-2"
            />
            <p class="font-medium">Extracting Data...</p>
            <p class="text-sm text-gray-500">This may take a moment</p>
          </div>
        </div>

        <!-- Property Image -->
        <img
          :src="listing.image || 'https://placehold.co/600x400?text=No+Image'"
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

          <div class="flex justify-between items-center">
            <div class="flex flex-col">
              <span class="text-lg sm:text-xl font-bold text-primary-600">
                {{ formatPrice(listing.price, listing.currency) }}
              </span>
              <span v-if="listing.price_per_sqm" class="text-xs text-gray-500">
                {{ formatPrice(listing.price_per_sqm, listing.currency) }}/m²
              </span>
            </div>
            <span class="text-xs sm:text-sm text-gray-500">
              {{ listing.bedroom_count }} beds
            </span>
          </div>

          <div
            class="flex flex-col items-start gap-2 text-xs sm:text-sm text-gray-500"
          >
            <span>Last checked: {{ formatDate(listing.last_checked) }}</span>
            <div class="flex items-center space-x-2">
              <UButton
                class="pl-0"
                color="gray"
                variant="ghost"
                icon="i-heroicons-pencil-square"
                size="xs"
                @click.stop="editListing(listing)"
              >
                Edit
              </UButton>
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-folder-plus"
                size="xs"
                @click.stop="saveToFolder(listing)"
              >
                Save
              </UButton>
              <a
                v-if="listing.url"
                :href="listing.url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-x-2 rounded-md px-2 py-1 text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-50"
                @click.stop="() => {}"
              >
                <UIcon
                  name="i-heroicons-arrow-top-right-on-square"
                  class="h-3 w-3 sm:h-4 sm:w-4"
                />
                View
              </a>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- List Layout -->
    <div
      v-else-if="filteredListings.length && props.viewMode === 'list'"
      class="space-y-4"
    >
      <UCard
        v-for="listing in filteredListings"
        :key="listing.id"
        class="relative cursor-pointer hover:shadow-md transition-shadow"
        @click="navigateToListing(listing.id)"
      >
        <!-- Pending Extraction Indicator -->
        <div
          v-if="listing.extraction_job_id"
          class="absolute top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex items-center justify-center z-10"
        >
          <div class="bg-white p-4 rounded-lg text-center">
            <UIcon
              name="i-heroicons-arrow-path"
              class="animate-spin text-primary-500 w-8 h-8 mx-auto mb-2"
            />
            <p class="font-medium">Extracting Data...</p>
            <p class="text-sm text-gray-500">This may take a moment</p>
          </div>
        </div>

        <div class="flex flex-col md:flex-row gap-4">
          <!-- Property Image -->
          <div class="w-full md:w-48 h-36 flex-shrink-0 relative">
            <!-- Change Indicator -->
            <div
              v-if="listing.updated_flag"
              class="absolute top-2 right-2 w-3 h-3 bg-primary-500 rounded-full"
              title="Property has recent updates"
            />
            <img
              :src="
                listing.image || 'https://placehold.co/600x400?text=No+Image'
              "
              class="w-full h-full object-cover rounded"
              :alt="listing.title"
            />
          </div>

          <div class="flex-grow space-y-3 w-full">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">
                  {{ listing.title }}
                </h3>
                <p class="text-sm text-gray-500">{{ listing.location }}</p>
              </div>
              <div class="flex items-center gap-2">
                <div class="flex flex-col items-end">
                  <span class="text-lg font-bold text-primary-600">
                    {{ formatPrice(listing.price, listing.currency) }}
                  </span>
                  <span
                    v-if="listing.price_per_sqm"
                    class="text-xs text-gray-500"
                  >
                    {{
                      formatPrice(listing.price_per_sqm, listing.currency)
                    }}/m²
                  </span>
                </div>
                <UButton
                  color="red"
                  variant="soft"
                  icon="i-heroicons-trash"
                  size="xs"
                  :loading="deletingId === listing.id"
                  @click.stop="confirmDelete(listing)"
                />
              </div>
            </div>
            <div class="flex justify-between items-center pt-2">
              <span class="text-sm text-gray-600">
                {{ listing.bedroom_count }} beds
              </span>
              <div class="flex items-center gap-4">
                <span class="text-xs text-gray-500">
                  Added: {{ formatDate(listing.created_at) }}
                </span>
                <span class="text-xs text-gray-500">
                  Last checked: {{ formatDate(listing.last_checked) }}
                </span>
              </div>
            </div>
            <div class="flex justify-end gap-2">
              <UButton
                color="gray"
                variant="ghost"
                size="xs"
                icon="i-heroicons-pencil-square"
                @click.stop="editListing(listing)"
              >
                Edit
              </UButton>
              <UButton
                color="gray"
                variant="ghost"
                size="xs"
                icon="i-heroicons-folder-plus"
                @click.stop="saveToFolder(listing)"
              >
                Save
              </UButton>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Empty State -->
    <UCard v-else class="text-center py-12">
      <template #header>
        <h3 class="text-lg font-medium text-gray-900">No listings found</h3>
      </template>
      <p class="text-gray-500">
        {{
          search
            ? "No listings match your search."
            : "Start by adding your first property listing."
        }}
      </p>
    </UCard>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center mt-6">
      <UPagination
        v-model="currentPage"
        :total="totalPages"
        :ui="{
          wrapper: 'flex items-center gap-1',
          rounded: 'rounded-lg',
        }"
        @change="$emit('page-change', $event)"
      />
    </div>

    <!-- Edit Modal -->
    <UModal v-model="showEditModal">
      <UCard class="w-full max-w-2xl">
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="text-xl font-semibold text-gray-900">Edit Listing</h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="closeEditModal"
            />
          </div>
        </template>

        <form
          v-if="editingListing"
          @submit.prevent="handleSaveEdit"
          class="space-y-6"
        >
          <UAlert
            v-if="error"
            type="danger"
            :title="error"
            class="mb-4"
            @close="error = null"
          />

          <UFormGroup label="URL">
            <UInput
              v-model="editingListing.url"
              type="url"
              placeholder="Property listing URL"
              :ui="{ base: 'bg-white dark:bg-white' }"
            />
          </UFormGroup>

          <UFormGroup label="Title" required>
            <UInput
              v-model="editingListing.title"
              placeholder="Property title"
              :ui="{ base: 'bg-white dark:bg-white' }"
            />
          </UFormGroup>

          <UFormGroup label="Location" required>
            <UInput
              v-model="editingListing.location"
              placeholder="Property location"
              :ui="{ base: 'bg-white dark:bg-white' }"
            />
          </UFormGroup>

          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Price" required>
              <UInput
                v-model="editingListing.price"
                type="number"
                step="0.01"
                min="0"
                placeholder="100000"
                :ui="{ base: 'bg-white dark:bg-white' }"
              />
            </UFormGroup>

            <UFormGroup label="Currency">
              <USelect
                v-model="editingListing.currency"
                :options="currencyOptions"
                :ui="{ base: 'bg-white dark:bg-white' }"
              />
            </UFormGroup>
          </div>

          <UFormGroup label="Bedrooms" required>
            <UInput
              v-model="editingListing.bedroom_count"
              type="number"
              min="0"
              :ui="{ base: 'bg-white dark:bg-white' }"
            />
          </UFormGroup>

          <UFormGroup label="Image URL">
            <UInput
              v-model="editingListing.image as any"
              placeholder="Property image URL"
              :ui="{ base: 'bg-white dark:bg-white' }"
            />
          </UFormGroup>

          <!-- Preview Image -->
          <div v-if="editingListing.image" class="mt-2">
            <img
              :src="editingListing.image"
              class="w-full h-48 object-cover rounded"
              :alt="editingListing.title"
            />
          </div>

          <div class="flex justify-end space-x-3">
            <UButton color="gray" variant="soft" @click="closeEditModal">
              Cancel
            </UButton>
            <UButton type="submit" color="primary" :loading="saving">
              Save Changes
            </UButton>
          </div>
        </form>
      </UCard>
    </UModal>

    <!-- Folder Modal -->
    <UModal v-model="showFolderModal">
      <UCard>
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="text-base font-semibold">Save to Folder</h3>
          </div>
        </template>

        <div class="space-y-4">
          <!-- Error Alert -->
          <UAlert
            v-if="folderError"
            type="danger"
            :description="folderError"
            class="mb-4"
          />

          <!-- Loading State -->
          <div v-if="loadingFolders" class="py-4 text-center">
            <UIcon
              name="i-heroicons-arrow-path"
              class="animate-spin w-6 h-6 mx-auto mb-2"
            />
            <p class="text-gray-500">Loading folders...</p>
          </div>

          <!-- No Folders -->
          <div v-else-if="!folders.length" class="text-center py-4">
            <UIcon
              name="i-heroicons-folder-plus"
              class="text-gray-400 w-12 h-12 mx-auto mb-2"
            />
            <p class="text-gray-700 font-medium">No folders yet</p>
            <p class="text-sm text-gray-500 mb-4">
              Create folders to organize your listings
            </p>
            <UButton color="primary" @click="navigateToFolders">
              Create Folder
            </UButton>
          </div>

          <!-- Folder List -->
          <div v-else class="max-h-72 overflow-y-auto">
            <UButton
              v-for="folder in folders"
              :key="folder.id"
              block
              variant="ghost"
              class="justify-start border-b last:border-0"
              :disabled="savingToFolder"
              @click="addToFolder(folder.id)"
            >
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-folder" class="text-primary-500" />
                <span>{{ folder.name }}</span>
              </div>
            </UButton>
          </div>

          <!-- Cancel Button -->
          <div class="flex justify-end">
            <UButton
              color="gray"
              variant="soft"
              @click="showFolderModal = false"
              :disabled="savingToFolder"
            >
              Cancel
            </UButton>
          </div>
        </div>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Database } from "~/types/database.types";

// Type the Supabase client
const supabase = useSupabaseClient<Database>();
const router = useRouter();

// Define type for listings
type Listing = Database["public"]["Tables"]["listings"]["Row"];

const props = defineProps({
  listings: {
    type: Array as () => Listing[],
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  page: {
    type: Number,
    default: 1,
  },
  totalPages: {
    type: Number,
    default: 1,
  },
  viewMode: {
    type: String,
    default: "grid",
  },
});

const emit = defineEmits([
  "add-listing",
  "page-change",
  "update-listing",
  "delete-listing",
  "save-to-folder",
  "update:viewMode",
]);

// Search and filter
const search = ref("");
const sortBy = ref("");
const viewMode = computed({
  get: () => props.viewMode,
  set: (value) => {
    if (isClient) {
      localStorage.setItem("listingViewMode", value);
    }
  },
});
const isClient = useNuxtApp().$isClient;

// Initialize from localStorage only on client-side
onMounted(() => {
  if (isClient) {
    sortBy.value = localStorage.getItem("listingSortBy") || "";
    viewMode.value = localStorage.getItem("listingViewMode") || "grid";
  }
});

// Watch for view mode changes and save to localStorage
watch(viewMode, (newMode) => {
  if (isClient) {
    localStorage.setItem("listingViewMode", newMode);
  }
});

// Watch for sort changes and save to localStorage
watch(sortBy, (newSort) => {
  if (isClient) {
    localStorage.setItem("listingSortBy", newSort || "");
  }
});

const currentPage = computed({
  get: () => props.page,
  set: (value) => emit("page-change", value),
});

const sortOptions = [
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Most Recent", value: "date-desc" },
  { label: "Oldest First", value: "date-asc" },
  { label: "Bedrooms: Most", value: "beds-desc" },
  { label: "Bedrooms: Least", value: "beds-asc" },
  { label: "Title (A-Z)", value: "title-asc" },
  { label: "Title (Z-A)", value: "title-desc" },
  { label: "Location (A-Z)", value: "location-asc" },
  { label: "Location (Z-A)", value: "location-desc" },
];

// Format price for display
const formatPrice = (price: number, currency: string): string => {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: currency || "EUR",
  }).format(price);
};

// Computed listings with search and sort
const filteredListings = computed(() => {
  let result = [...props.listings];

  // Apply search
  if (search.value) {
    const searchLower = search.value.toLowerCase();
    result = result.filter(
      (listing) =>
        listing.title?.toLowerCase().includes(searchLower) ||
        listing.location?.toLowerCase().includes(searchLower) ||
        listing.url?.toLowerCase().includes(searchLower)
    );
  }

  // Apply sort
  if (sortBy.value) {
    result.sort((a, b) => {
      switch (sortBy.value) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "date-desc":
          return (
            new Date(b.last_checked || "").getTime() -
            new Date(a.last_checked || "").getTime()
          );
        case "date-asc":
          return (
            new Date(a.last_checked || "").getTime() -
            new Date(b.last_checked || "").getTime()
          );
        case "beds-desc":
          return b.bedroom_count - a.bedroom_count;
        case "beds-asc":
          return a.bedroom_count - b.bedroom_count;
        case "title-asc":
          return (a.title || "").localeCompare(b.title || "");
        case "title-desc":
          return (b.title || "").localeCompare(a.title || "");
        case "location-asc":
          return (a.location || "").localeCompare(b.location || "");
        case "location-desc":
          return (b.location || "").localeCompare(a.location || "");
        default:
          return 0;
      }
    });
  }

  return result;
});

// Date formatting
const formatDate = (date: string | null): string => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
};

// Edit functionality
const showEditModal = ref(false);
const editingListing = ref<{
  id: string;
  title: string;
  location: string;
  price: number;
  currency: string;
  bedroom_count: number;
  image: string | null;
  url: string;
  updated_at: string | null;
  created_at: string | null;
  change_history: any | null;
  extraction_job_id: string | null;
  last_checked: string | null;
  markdown_content: string | null;
  updated_flag: boolean | null;
  user_id: string;
} | null>(null);
const saving = ref(false);
const error = ref<string | null>(null);
const deletingId = ref<string | null>(null);

// Folder functionality
const showFolderModal = ref(false);
const listingForFolder = ref<Listing | null>(null);
const folders = ref<{ id: string; name: string; description: string | null }[]>(
  []
);
const loadingFolders = ref(false);
const folderError = ref<string | null>(null);
const savingToFolder = ref(false);
const selectedFolderId = ref<string>("");

const currencyOptions = [
  { label: "EUR", value: "EUR" },
  { label: "USD", value: "USD" },
  { label: "GBP", value: "GBP" },
];

const editListing = (listing: Listing) => {
  editingListing.value = { ...listing }; // Create a copy to avoid mutating props
  showEditModal.value = true;
};

const closeEditModal = () => {
  showEditModal.value = false;
  editingListing.value = null;
  error.value = null;
};

const handleSaveEdit = async () => {
  try {
    saving.value = true;
    error.value = null;

    if (!editingListing.value) {
      throw new Error("No listing to edit");
    }

    // Validate required fields
    if (
      !editingListing.value.title ||
      !editingListing.value.location ||
      !editingListing.value.price
    ) {
      throw new Error("Please fill in all required fields");
    }

    // Update the listing in the database
    const { data, error: updateError } = await supabase
      .from("listings")
      .update({
        url: editingListing.value.url,
        title: editingListing.value.title,
        price: parseFloat(String(editingListing.value.price)),
        currency: editingListing.value.currency,
        location: editingListing.value.location,
        bedroom_count: parseInt(String(editingListing.value.bedroom_count)),
        image: editingListing.value.image,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingListing.value.id!)
      .select()
      .single();

    if (updateError) throw updateError;

    // Emit update event to refresh the listing in the parent component
    emit("update-listing", data);
    closeEditModal();
  } catch (e: any) {
    error.value = e.message;
  } finally {
    saving.value = false;
  }
};

// Function to confirm and delete a listing
const confirmDelete = async (listing: Listing) => {
  if (!window.confirm("Are you sure you want to delete this listing?")) {
    return;
  }

  deletingId.value = listing.id;
  emit("delete-listing", listing.id);
  deletingId.value = null;
};

// Function to clear all filters
const clearFilters = () => {
  search.value = "";
  sortBy.value = "";
};

const navigateToListing = (id: string) => {
  router.push(`/listing/${id}`);
};

// Navigate to folders page
const navigateToFolders = () => {
  showFolderModal.value = false;
  router.push("/folders");
};

// Function to open folder modal for a listing
const saveToFolder = async (listing: Listing) => {
  listingForFolder.value = listing;
  showFolderModal.value = true;
  await loadFolders();
};

// Load user's folders
const loadFolders = async () => {
  try {
    loadingFolders.value = true;
    folderError.value = null;

    const { data: userFolders, error: foldersError } = await supabase
      .from("folders")
      .select("*")
      .order("name", { ascending: true });

    if (foldersError) throw foldersError;
    folders.value = userFolders || [];
  } catch (e: any) {
    folderError.value = e.message;
    console.error("Error loading folders:", e);
  } finally {
    loadingFolders.value = false;
  }
};

// Add listing to a folder
const addToFolder = async (folderId: string) => {
  if (!listingForFolder.value) return;

  try {
    savingToFolder.value = true;
    folderError.value = null;

    // Check if listing is already in the folder
    const { data: existing, error: checkError } = await supabase
      .from("folder_listings")
      .select("id")
      .eq("folder_id", folderId)
      .eq("listing_id", listingForFolder.value.id)
      .maybeSingle();

    if (checkError) throw checkError;

    // If not already in folder, add it
    if (!existing) {
      const { error: insertError } = await supabase
        .from("folder_listings")
        .insert({
          folder_id: folderId,
          listing_id: listingForFolder.value.id,
        });

      if (insertError) throw insertError;
    }

    // Close modal and emit event to parent with folder ID for redirection
    showFolderModal.value = false;
    emit("save-to-folder", {
      listing: listingForFolder.value,
      folderId: folderId,
    });
    listingForFolder.value = null;
  } catch (e: any) {
    folderError.value = e.message;
    console.error("Error adding to folder:", e);
  } finally {
    savingToFolder.value = false;
  }
};

const closeFolderModal = () => {
  showFolderModal.value = false;
  listingForFolder.value = null;
};

const handleSaveFolder = async () => {
  if (!selectedFolderId.value || !listingForFolder.value) return;

  try {
    await addToFolder(selectedFolderId.value);
  } catch (e: any) {
    folderError.value = e.message;
    console.error("Error saving to folder:", e);
  }
};
</script>
