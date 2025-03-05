<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
      <div class="text-center">
        <UIcon
          name="i-heroicons-clock"
          class="mx-auto h-12 w-12 text-primary-600"
        />
        <h2 class="mt-6 text-3xl font-bold text-gray-900">Approval Pending</h2>
        <p class="mt-2 text-sm text-gray-600">
          Your account is awaiting admin approval. You will be notified via
          email once your account has been approved.
        </p>
        <div class="mt-6">
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
    </div>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient();

const handleSignOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (!error) {
    navigateTo("/login");
  }
};
</script>
