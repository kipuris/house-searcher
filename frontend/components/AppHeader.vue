<template>
  <!-- Navigation Bar -->
  <nav class="bg-white shadow">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-14 sm:h-16">
        <!-- Logo and Navigation Links -->
        <div class="flex">
          <div class="flex-shrink-0 flex items-center">
            <h1 class="text-lg sm:text-xl font-bold text-gray-900">
              House Searcher
            </h1>
          </div>
          <!-- Desktop Navigation -->
          <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
            <NuxtLink
              to="/"
              class="inline-flex items-center px-1 pt-1 text-sm font-medium"
              :class="[
                $route.path === '/'
                  ? 'text-primary-600 border-b-2 border-primary-500'
                  : 'text-gray-500 hover:text-gray-700',
              ]"
            >
              Dashboard
            </NuxtLink>
            <NuxtLink
              to="/teams"
              class="inline-flex items-center px-1 pt-1 text-sm font-medium"
              :class="[
                $route.path === '/teams'
                  ? 'text-primary-600 border-b-2 border-primary-500'
                  : 'text-gray-500 hover:text-gray-700',
              ]"
            >
              Teams
            </NuxtLink>
            <NuxtLink
              v-if="isAdmin"
              to="/admin"
              class="inline-flex items-center px-1 pt-1 text-sm font-medium"
              :class="[
                $route.path === '/admin'
                  ? 'text-primary-600 border-b-2 border-primary-500'
                  : 'text-gray-500 hover:text-gray-700',
              ]"
            >
              Admin
            </NuxtLink>
          </div>
        </div>

        <!-- Mobile Navigation Button -->
        <div class="sm:hidden flex items-center">
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-bars-3"
            @click="mobileMenuOpen = !mobileMenuOpen"
          />
        </div>

        <!-- Desktop User Menu -->
        <div class="hidden sm:flex items-center space-x-4">
          <div class="flex items-center space-x-2">
            <UIcon
              name="i-heroicons-user-circle"
              class="w-5 h-5 text-gray-600"
            />
            <span class="text-sm text-gray-600">{{ user?.email }}</span>
          </div>
          <UButton
            color="gray"
            variant="soft"
            icon="i-heroicons-arrow-right-on-rectangle"
            @click="handleSignOut"
          >
            Sign Out
          </UButton>
        </div>
      </div>

      <!-- Mobile Navigation Menu -->
      <div v-if="mobileMenuOpen" class="sm:hidden" ref="mobileMenu">
        <div class="pt-2 pb-3 space-y-1">
          <NuxtLink
            to="/"
            class="block px-3 py-2 rounded-md text-base font-medium"
            :class="[
              $route.path === '/'
                ? 'text-primary-600 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
            ]"
            @click="mobileMenuOpen = false"
          >
            Dashboard
          </NuxtLink>
          <NuxtLink
            to="/teams"
            class="block px-3 py-2 rounded-md text-base font-medium"
            :class="[
              $route.path === '/teams'
                ? 'text-primary-600 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
            ]"
            @click="mobileMenuOpen = false"
          >
            Teams
          </NuxtLink>
          <NuxtLink
            v-if="isAdmin"
            to="/admin"
            class="block px-3 py-2 rounded-md text-base font-medium"
            :class="[
              $route.path === '/admin'
                ? 'text-primary-600 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
            ]"
            @click="mobileMenuOpen = false"
          >
            Admin
          </NuxtLink>
        </div>
        <div class="pt-4 pb-3 border-t border-gray-200">
          <div class="px-3 space-y-3">
            <div class="flex items-center">
              <UIcon
                name="i-heroicons-user-circle"
                class="w-5 h-5 text-gray-600"
              />
              <span class="ml-2 text-sm text-gray-600">{{ user?.email }}</span>
            </div>
            <UButton
              color="gray"
              variant="soft"
              icon="i-heroicons-arrow-right-on-rectangle"
              class="w-full justify-center"
              @click="handleSignOut"
            >
              Sign Out
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { onClickOutside } from "@vueuse/core";
import type { Database } from "~/types/database.types";

type UserView = Database["public"]["Tables"]["users_view"]["Row"];

const router = useRouter();
const supabase = useSupabaseClient<Database>();
const user = useSupabaseUser();
const isAdmin = ref(false);
const isApproved = ref(false);
const loading = ref(true);
const error = ref<string | null>(null);
const mobileMenuOpen = ref(false);
const mobileMenu = ref<HTMLElement | null>(null);

// Close mobile menu when clicking outside
onMounted(() => {
  if (mobileMenu.value) {
    onClickOutside(mobileMenu, () => {
      mobileMenuOpen.value = false;
    });
  }

  if (user.value) {
    checkUserStatus();
  }
});

// Watch for user changes
watch(user, async (newUser) => {
  if (newUser) {
    await checkUserStatus();
  } else {
    isAdmin.value = false;
    isApproved.value = false;
  }
});

// Check user status (admin and approval)
const checkUserStatus = async () => {
  try {
    loading.value = true;
    error.value = null;

    const { data, error: fetchError } = await supabase
      .from("users_view")
      .select("*")
      .eq("id", user.value?.id || "")
      .single();

    if (fetchError) throw fetchError;

    isAdmin.value = data?.role === "admin";
    isApproved.value = data?.is_approved === true;
  } catch (e: any) {
    console.error("Error checking user status:", e);
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};

// Logout function
const handleSignOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    router.push("/login");
  } catch (e: any) {
    console.error("Error logging out:", e);
  }
};

// Alias for handleSignOut for compatibility
const logout = handleSignOut;

// Computed property to determine if user is logged in
const isLoggedIn = computed(() => !!user.value);

// Navigation items
const navItems = computed(() => {
  const items = [
    {
      label: "Dashboard",
      icon: "i-heroicons-home",
      to: "/",
      show: isLoggedIn.value && isApproved.value,
    },
    {
      label: "Teams",
      icon: "i-heroicons-user-group",
      to: "/teams",
      show: isLoggedIn.value && isApproved.value,
    },
    {
      label: "Admin",
      icon: "i-heroicons-shield-check",
      to: "/admin",
      show: isLoggedIn.value && isAdmin.value,
    },
    {
      label: "Login",
      icon: "i-heroicons-arrow-right-on-rectangle",
      to: "/login",
      show: !isLoggedIn.value,
    },
    {
      label: "Sign Up",
      icon: "i-heroicons-user-plus",
      to: "/signup",
      show: !isLoggedIn.value,
    },
  ];

  return items.filter((item) => item.show);
});

// User menu items
const userMenuItems = computed(() => {
  return [
    {
      label: "Logout",
      icon: "i-heroicons-arrow-left-on-rectangle",
      click: handleSignOut,
    },
  ];
});
</script>
