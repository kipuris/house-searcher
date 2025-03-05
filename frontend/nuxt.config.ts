// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  modules: ["@nuxtjs/supabase", "@nuxt/ui"],
  supabase: {
    redirect: false,
  },
  colorMode: {
    preference: "light",
  },

  runtimeConfig: {
    // Public variables that are exposed to the client
    public: {
      firecrawlApiUrl: process.env.FIRECRAWL_API_URL ||
        "https://api.firecrawl.dev/v1",
      apiBase: process.env.SUPABASE_URL || "http://localhost:54321",
      supabaseKey: process.env.SUPABASE_ANON_KEY,
    },
  },
});
