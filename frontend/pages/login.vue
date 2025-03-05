<template>
  <div>
    <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
      Sign in to your account
    </h2>
    <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
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
            Sign in
          </UButton>
        </div>

        <div class="mt-4 text-center">
          <NuxtLink
            to="/signup"
            class="text-sm text-primary-600 hover:text-primary-500"
          >
            Don't have an account? Sign up
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

const router = useRouter();
const email = ref("");
const password = ref("");
const error = ref(null);
const loading = ref(false);

// Set meta tags for the login page
const { setPageMeta } = useSiteMeta();
setPageMeta({
  title: "Login",
  description:
    "Sign in to your House Searcher account to manage your property listings.",
});

const handleLogin = async () => {
  try {
    loading.value = true;
    error.value = null;

    const { data, error: authError } =
      await useSupabaseClient().auth.signInWithPassword({
        email: email.value,
        password: password.value,
      });

    if (authError) throw authError;

    // Redirect to dashboard on successful login
    await router.push("/");
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};
</script>
