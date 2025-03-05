<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
      </div>

      <!-- Stats Overview -->
      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8"
      >
        <UCard>
          <div class="text-center">
            <div class="text-xl sm:text-2xl font-bold text-primary-600">
              {{ pendingCount }}
            </div>
            <div class="text-xs sm:text-sm text-gray-600">
              Pending Approvals
            </div>
          </div>
        </UCard>
        <UCard>
          <div class="text-center">
            <div class="text-xl sm:text-2xl font-bold text-green-600">
              {{ approvedCount }}
            </div>
            <div class="text-xs sm:text-sm text-gray-600">Approved Users</div>
          </div>
        </UCard>
        <UCard>
          <div class="text-center">
            <div class="text-xl sm:text-2xl font-bold text-blue-600">
              {{ adminCount }}
            </div>
            <div class="text-xs sm:text-sm text-gray-600">Admin Users</div>
          </div>
        </UCard>
      </div>

      <!-- User Management Table -->
      <UCard>
        <template #header>
          <div
            class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
            <h2 class="text-base sm:text-lg font-medium text-gray-900">
              User Management
            </h2>
            <UInput
              v-model="search"
              icon="i-heroicons-magnifying-glass"
              placeholder="Search users..."
              class="w-full sm:w-64"
            />
          </div>
        </template>

        <div v-if="loading" class="py-8 sm:py-12 text-center">
          <UIcon
            name="i-heroicons-arrow-path"
            class="w-8 h-8 mx-auto animate-spin text-gray-400"
          />
        </div>
        <div v-else class="overflow-x-auto -mx-4 sm:mx-0">
          <!-- Users Table -->
          <table class="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th
                  class="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Email
                </th>
                <th
                  class="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  class="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Role
                </th>
                <th
                  class="hidden sm:table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Registered
                </th>
                <th
                  class="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="user in filteredUsers" :key="user.id">
                <td class="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                  <div class="text-xs sm:text-sm text-gray-900">
                    {{ user.email }}
                  </div>
                </td>
                <td class="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                  <UBadge
                    :color="user.is_approved ? 'green' : 'yellow'"
                    :label="user.is_approved ? 'Approved' : 'Pending'"
                    variant="subtle"
                    size="xs"
                    class="whitespace-nowrap"
                  />
                </td>
                <td class="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                  <UBadge
                    :color="user.role === 'admin' ? 'blue' : 'gray'"
                    :label="user.role"
                    variant="subtle"
                    size="xs"
                    class="whitespace-nowrap"
                  />
                </td>
                <td
                  class="hidden sm:table-cell px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap"
                >
                  <div class="text-xs sm:text-sm text-gray-500">
                    {{ formatDate(user.created_at) }}
                  </div>
                </td>
                <td
                  class="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium space-x-1 sm:space-x-2"
                >
                  <UButton
                    v-if="!user.is_approved"
                    color="green"
                    variant="soft"
                    size="xs"
                    :loading="approvingUser === user.id"
                    @click="approveUser(user)"
                  >
                    Approve
                  </UButton>
                  <UButton
                    v-if="user.role !== 'admin' && user.is_approved"
                    color="blue"
                    variant="soft"
                    size="xs"
                    :loading="makingAdmin === user.id"
                    @click="makeAdmin(user)"
                  >
                    Make Admin
                  </UButton>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Empty State -->
          <div
            v-if="filteredUsers.length === 0"
            class="text-center py-8 sm:py-12"
          >
            <div class="text-xs sm:text-sm text-gray-500">
              {{ search ? "No users match your search." : "No users found." }}
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ["admin"],
});

const supabase = useSupabaseClient();
const adminUser = useSupabaseUser();

// State
const users = ref([]);
const loading = ref(true);
const search = ref("");
const approvingUser = ref(null);
const makingAdmin = ref(null);

// Data fetching
const { data, refresh } = await useAsyncData(
  "users",
  async () => {
    const { data, error } = await supabase.from("users_view").select("*");

    if (error) {
      console.error("Error loading users:", error);
      return [];
    }

    return data;
  },
  {
    watch: [search], // Re-fetch when search changes
  }
);

// Update users whenever data changes
watchEffect(() => {
  users.value = data.value || [];
  loading.value = false;
});

// Computed
const filteredUsers = computed(() => {
  if (!search.value) return users.value;
  const searchLower = search.value.toLowerCase();
  return users.value.filter((user) =>
    user.email.toLowerCase().includes(searchLower)
  );
});

const pendingCount = computed(
  () => users.value.filter((u) => !u.is_approved).length
);

const approvedCount = computed(
  () => users.value.filter((u) => u.is_approved).length
);

const adminCount = computed(
  () => users.value.filter((u) => u.role === "admin").length
);

// Methods
const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const approveUser = async (user) => {
  try {
    approvingUser.value = user.id;
    const { error } = await supabase.rpc("approve_user", {
      user_id: user.id,
      admin_id: adminUser.value.id,
    });
    if (error) throw error;
    await refresh(); // Use refresh instead of loadUsers
  } catch (error) {
    console.error("Error approving user:", error);
  } finally {
    approvingUser.value = null;
  }
};

const makeAdmin = async (user) => {
  try {
    makingAdmin.value = user.id;
    const { error } = await supabase.rpc("make_user_admin", {
      target_user_id: user.id,
      admin_id: adminUser.value.id,
    });
    if (error) throw error;
    await refresh(); // Use refresh instead of loadUsers
  } catch (error) {
    console.error("Error making user admin:", error);
  } finally {
    makingAdmin.value = null;
  }
};

const handleSignOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (!error) {
    navigateTo("/login");
  }
};
</script>
