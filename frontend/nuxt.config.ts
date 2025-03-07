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
      sameSite: "strict",
      secure: true,
    },
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY,
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

  app: {
    head: {
      meta: [
        {
          name: "Content-Security-Policy",
          content:
            "default-src 'self' https://*.supabase.co; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
        },
      ],
    },
  },

  runtimeConfig: {
    // Public variables that are exposed to the client
    public: {
      siteUrl: process.env.SITE_URL || "http://localhost:3000",
    },
  },
});
