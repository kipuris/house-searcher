<template>
  <div>
    <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
      Create your account
    </h2>

    <div v-if="registrationComplete" class="text-center">
      <UIcon
        name="i-heroicons-check-circle"
        class="text-green-500 w-16 h-16 mx-auto"
      />
      <h3 class="mt-4 text-lg font-medium text-gray-900">
        Registration Submitted
      </h3>
      <p class="mt-2 text-sm text-gray-600">
        Your registration is pending admin approval. You will receive an email
        once your account is approved.
      </p>
      <div class="mt-6">
        <NuxtLink to="/login" class="text-primary-600 hover:text-primary-500">
          Return to login
        </NuxtLink>
      </div>
    </div>

    <form v-else class="mt-8 space-y-6" @submit.prevent="handleSignup">
      <UCard class="p-4 bg-white" :ui="{ base: 'bg-white dark:bg-white' }">
        <UAlert v-if="error" type="danger" :title="error" class="mb-4" />

        <div class="space-y-4">
          <UFormGroup label="Email address" class="text-gray-700">
            <UInput
              v-model="email"
              type="email"
              required
              placeholder="your@email.com"
              class="bg-white"
              color="gray"
              :ui="{ base: 'bg-white dark:bg-white' }"
            />
          </UFormGroup>

          <UFormGroup label="Password" class="text-gray-700">
            <UInput
              v-model="password"
              type="password"
              required
              placeholder="••••••••"
              minlength="8"
              class="bg-white"
              color="gray"
              :ui="{ base: 'bg-white dark:bg-white' }"
            />
            <span class="text-xs text-gray-500"
              >Must be at least 8 characters</span
            >
          </UFormGroup>

          <UFormGroup label="Confirm Password" class="text-gray-700">
            <UInput
              v-model="confirmPassword"
              type="password"
              required
              placeholder="••••••••"
              class="bg-white"
              color="gray"
              :ui="{ base: 'bg-white dark:bg-white' }"
            />
          </UFormGroup>
        </div>

        <div class="mt-6">
          <UButton
            type="submit"
            color="primary"
            block
            :loading="loading"
            variant="solid"
          >
            Sign up
          </UButton>
        </div>

        <div class="mt-4 text-center">
          <NuxtLink
            to="/login"
            class="text-sm text-primary-600 hover:text-primary-500"
          >
            Already have an account? Sign in
          </NuxtLink>
        </div>
      </UCard>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";

definePageMeta({
  middleware: [], // Empty array to override global middleware
  layout: "auth",
});

const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const error = ref(null);
const loading = ref(false);
const registrationComplete = ref(false);

// Set meta tags for the signup page
const { setPageMeta } = useSiteMeta();
setPageMeta({
  title: "Sign Up",
  description:
    "Create your House Searcher account to start tracking and managing property listings.",
});

const handleSignup = async () => {
  try {
    // Basic validation
    if (password.value !== confirmPassword.value) {
      error.value = "Passwords do not match";
      return;
    }

    if (password.value.length < 8) {
      error.value = "Password must be at least 8 characters";
      return;
    }

    loading.value = true;
    error.value = null;

    const { data, error: authError } = await useSupabaseClient().auth.signUp({
      email: email.value,
      password: password.value,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (authError) throw authError;

    // Show success message
    registrationComplete.value = true;
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};
</script>
