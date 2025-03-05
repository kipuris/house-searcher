<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Your Listings</h1>
      </div>

      <!-- Error Alert -->
      <UAlert
        v-if="error"
        type="danger"
        title="Error loading listings"
        :description="error"
        class="mb-4"
      />

      <!-- Pending Extractions Component -->
      <PendingExtractions @update-listing="handleUpdateListing" />

      <ListingGrid
        :listings="listings || []"
        :loading="pending"
        :page="page"
        :total-pages="totalPages"
        @page-change="handlePageChange"
        @add-listing="handleAddListingClick"
        @update-listing="handleUpdateListing"
        @delete-listing="handleDeleteListing"
      />

      <AddListing
        v-model="showAddListingModal"
        @save="handleAddListing"
        @error="handleError"
      />
    </div>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient();
const user = useSupabaseUser();
const showAddListingModal = ref(false);
const error = ref(null);
const page = ref(1);
const perPage = 9; // Number of items per page

// Data fetching with pagination
const {
  data: listingsData,
  pending,
  refresh: refreshListings,
} = await useAsyncData(
  "listings",
  async () => {
    try {
      error.value = null;
      const from = (page.value - 1) * perPage;
      const to = from + perPage - 1;

      // Get total count of combined listings
      const { count: personalCount } = await supabase
        .from("listings")
        .select("*", { count: "exact", head: true });

      const { count: teamCount } = await supabase
        .from("team_listings")
        .select("*", { count: "exact", head: true });

      // Get paginated data from both personal and team listings
      const [personalListings, teamListings] = await Promise.all([
        supabase
          .from("listings")
          .select("*")
          .order("created_at", { ascending: false })
          .range(from, to),
        supabase
          .from("team_listings")
          .select("*")
          .order("created_at", { ascending: false })
          .range(from, to),
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

      // Calculate total unique listings
      const totalCount = personalCount + teamCount;

      return {
        items: combinedListings.slice(0, perPage), // Ensure we only return perPage items
        total: totalCount,
      };
    } catch (e) {
      error.value = e.message;
      return { items: [], total: 0 };
    }
  },
  {
    watch: [page], // Refetch when page changes
  }
);

// Computed properties
const listings = computed(() => listingsData.value?.items || []);
const totalPages = computed(() =>
  Math.ceil((listingsData.value?.total || 0) / perPage)
);

// Methods
const handlePageChange = (newPage) => {
  page.value = newPage;
};

const handleAddListingClick = () => {
  error.value = null;
  showAddListingModal.value = true;
};

const handleAddListing = async (newListing) => {
  // Optimistic update
  if (listingsData.value) {
    listingsData.value = {
      ...listingsData.value,
      items: [newListing, ...listingsData.value.items],
      total: (listingsData.value.total || 0) + 1,
    };
  }

  // Refresh in background to ensure data consistency
  await refreshListings();
};

const handleError = (errorMessage) => {
  error.value = errorMessage;
};

const handleSignOut = async () => {
  const { error: signOutError } = await supabase.auth.signOut();
  if (!signOutError) {
    navigateTo("/login");
  } else {
    error.value = signOutError.message;
  }
};

const handleUpdateListing = async (updatedListing) => {
  // Optimistic update
  if (listingsData.value) {
    listingsData.value = {
      ...listingsData.value,
      items: listingsData.value.items.map((listing) =>
        listing.id === updatedListing.id ? updatedListing : listing
      ),
    };
  }

  // Refresh in background to ensure data consistency
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

    // Optimistic update - remove the listing from the local state
    if (listingsData.value) {
      listingsData.value = {
        ...listingsData.value,
        items: listingsData.value.items.filter(
          (listing) => listing.id !== listingId
        ),
        total: (listingsData.value.total || 0) - 1,
      };
    }

    // If we're on a page that would now be empty, go back one page
    if (listings.value.length === 1 && page.value > 1) {
      page.value--;
    } else {
      // Refresh in background to ensure data consistency
      await refreshListings();
    }
  } catch (e) {
    error.value = e.message;
    console.error("Error deleting listing:", e);
  }
};
</script>
