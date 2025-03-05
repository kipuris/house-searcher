<!-- Default layout for authenticated pages -->
<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Notifications -->
    <UNotifications />

    <!-- Navigation Bar -->
    <AppHeader />

    <!-- Page Content -->
    <div class="p-4 sm:p-6 lg:p-8">
      <div class="max-w-7xl mx-auto">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
// No script needed as the header logic is now in the AppHeader component

// Set default meta tags for all pages
const { setPageMeta } = useSiteMeta();

// Apply default meta tags
setPageMeta();
</script>
