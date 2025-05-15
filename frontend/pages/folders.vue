<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Your Folders</h1>
        <UButton
          icon="i-heroicons-plus"
          color="primary"
          @click="showCreateFolderModal = true"
        >
          Create Folder
        </UButton>
      </div>

      <!-- Error Alert -->
      <UAlert
        v-if="error"
        type="danger"
        title="Error loading folders"
        :description="error"
        class="mb-4"
      />

      <!-- Loading State -->
      <div
        v-if="pending"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
      >
        <UCard v-for="n in 6" :key="n" class="relative">
          <div class="space-y-2">
            <USkeleton class="h-6 w-3/4" />
            <USkeleton class="h-4 w-1/2" />
          </div>
        </UCard>
      </div>

      <!-- Empty State -->
      <UCard v-else-if="!folders.length" class="text-center p-8">
        <UIcon
          name="i-heroicons-folder-plus"
          class="text-gray-400 w-16 h-16 mx-auto mb-4"
        />
        <h3 class="text-xl font-medium text-gray-900 mb-2">No folders yet</h3>
        <p class="text-gray-500 mb-6">
          Create folders to organize your listings
        </p>
        <UButton color="primary" @click="showCreateFolderModal = true">
          Create your first folder
        </UButton>
      </UCard>

      <!-- Folders Grid -->
      <div
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
      >
        <UCard
          v-for="folder in folders"
          :key="folder.id"
          class="cursor-pointer hover:shadow-md transition-shadow"
          @click="navigateToFolder(folder.id)"
        >
          <!-- Folder Icon and Name -->
          <div class="flex items-center gap-3 mb-2">
            <UIcon name="i-heroicons-folder" class="text-primary-500 w-6 h-6" />
            <h3 class="text-lg font-semibold text-gray-900 truncate">
              {{ folder.name }}
            </h3>
          </div>

          <!-- Folder Description -->
          <p
            v-if="folder.description"
            class="text-sm text-gray-500 mb-4 line-clamp-2"
          >
            {{ folder.description }}
          </p>

          <!-- Folder Stats -->
          <div
            class="flex justify-between items-center mt-4 text-sm text-gray-500"
          >
            <span>{{ folderListingCounts[folder.id] || 0 }} listings</span>
            <span>Created {{ formatDate(folder.created_at) }}</span>
          </div>

          <!-- Action Buttons -->
          <div class="absolute top-2 right-2 flex gap-2">
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-pencil-square"
              size="xs"
              @click.stop="handleEditFolder(folder)"
            />
            <UButton
              color="red"
              variant="ghost"
              icon="i-heroicons-trash"
              size="xs"
              @click.stop="confirmDeleteFolder(folder)"
            />
          </div>
        </UCard>
      </div>

      <!-- Folder Modal -->
      <UModal v-model="showCreateFolderModal">
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="text-base font-semibold">
                {{ editingFolder ? "Edit Folder" : "Create New Folder" }}
              </h3>
            </div>
          </template>

          <form @submit.prevent="saveFolder">
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
                :disabled="isSaving"
              >
                Cancel
              </UButton>
              <UButton type="submit" color="primary" :loading="isSaving">
                {{ editingFolder ? "Update" : "Create" }}
              </UButton>
            </div>
          </form>
        </UCard>
      </UModal>

      <!-- Delete Confirmation Modal -->
      <UModal v-model="showDeleteModal">
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="text-base font-semibold">Delete Folder</h3>
            </div>
          </template>

          <p class="mb-4">
            Are you sure you want to delete the folder "{{
              folderToDelete?.name
            }}"? This action cannot be undone.
          </p>

          <div class="flex justify-end gap-2">
            <UButton
              type="button"
              color="gray"
              @click="showDeleteModal = false"
              :disabled="isDeleting"
            >
              Cancel
            </UButton>
            <UButton
              type="button"
              color="red"
              :loading="isDeleting"
              @click="deleteFolder"
            >
              Delete
            </UButton>
          </div>
        </UCard>
      </UModal>
    </div>
  </div>
</template>

<script setup>
import { useSiteMeta } from "~/composables/useSiteMeta";

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const error = ref(null);
const showCreateFolderModal = ref(false);
const showDeleteModal = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);
const folderToDelete = ref(null);
const editingFolder = ref(null);
const folderForm = ref({
  name: "",
  description: "",
});
const folderListingCounts = ref({});

// Set meta tags
const { setPageMeta } = useSiteMeta();
setPageMeta({
  title: "My Folders",
  description: "Organize your property listings into custom folders",
});

// Fetch folders data
const {
  data: foldersData,
  pending,
  refresh: refreshFolders,
} = await useAsyncData("folders", async () => {
  try {
    error.value = null;

    const { data: folders, error: foldersError } = await supabase
      .from("folders")
      .select("*")
      .order("created_at", { ascending: false });

    if (foldersError) throw foldersError;

    // Get listing counts for each folder
    await fetchFolderListingCounts(folders);

    return folders;
  } catch (e) {
    error.value = e.message;
    console.error("Error fetching folders:", e);
    return [];
  }
});

// Computed property for folders
const folders = computed(() => foldersData.value || []);

// Format date
const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString();
};

// Fetch listing counts for each folder
async function fetchFolderListingCounts(folders) {
  try {
    const counts = {};

    if (folders && folders.length > 0) {
      // Get counts for each folder individually
      for (const folder of folders) {
        const { count, error: countError } = await supabase
          .from("folder_listings")
          .select("*", { count: "exact", head: true })
          .eq("folder_id", folder.id);

        if (countError) throw countError;
        counts[folder.id] = count || 0;
      }
    }

    folderListingCounts.value = counts;
  } catch (e) {
    console.error("Error fetching folder listing counts:", e);
  }
}

// Navigate to folder detail view
function navigateToFolder(folderId) {
  navigateTo(`/folder/${folderId}`);
}

// Handle edit folder
function handleEditFolder(folder) {
  editingFolder.value = folder;
  folderForm.value = {
    name: folder.name,
    description: folder.description || "",
  };
  showCreateFolderModal.value = true;
}

// Confirm delete folder
function confirmDeleteFolder(folder) {
  folderToDelete.value = folder;
  showDeleteModal.value = true;
}

// Save folder (create or update)
async function saveFolder() {
  try {
    isSaving.value = true;
    error.value = null;

    if (!folderForm.value.name.trim()) {
      error.value = "Folder name is required";
      return;
    }

    if (editingFolder.value) {
      // Update existing folder
      const { error: updateError } = await supabase
        .from("folders")
        .update({
          name: folderForm.value.name.trim(),
          description: folderForm.value.description.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingFolder.value.id);

      if (updateError) throw updateError;
    } else {
      // Create new folder
      const { error: insertError } = await supabase.from("folders").insert({
        name: folderForm.value.name.trim(),
        description: folderForm.value.description.trim() || null,
        user_id: user.value.id,
      });

      if (insertError) throw insertError;
    }

    // Reset form and close modal
    folderForm.value = { name: "", description: "" };
    editingFolder.value = null;
    showCreateFolderModal.value = false;

    // Refresh folders
    await refreshFolders();
  } catch (e) {
    error.value = e.message;
    console.error("Error saving folder:", e);
  } finally {
    isSaving.value = false;
  }
}

// Delete folder
async function deleteFolder() {
  if (!folderToDelete.value) return;

  try {
    isDeleting.value = true;
    error.value = null;

    // Delete folder (cascade will handle folder_listings)
    const { error: deleteError } = await supabase
      .from("folders")
      .delete()
      .eq("id", folderToDelete.value.id);

    if (deleteError) throw deleteError;

    // Close modal and reset
    showDeleteModal.value = false;
    folderToDelete.value = null;

    // Refresh folders
    await refreshFolders();
  } catch (e) {
    error.value = e.message;
    console.error("Error deleting folder:", e);
  } finally {
    isDeleting.value = false;
  }
}
</script>
