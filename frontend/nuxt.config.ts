// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  modules: ["@nuxtjs/supabase", "@nuxt/ui"],
  supabase: {
    redirect: false,
    cookieOptions: {
      maxAge: 60 * 60 * 8,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  },
  colorMode: {
    preference: "light",
  },

  routeRules: {
    "/login": { prerender: true },
    "/signup": { prerender: true },
    "/pending-approval": { prerender: true },
    "/": { ssr: false },
    "/**": { ssr: false },
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
