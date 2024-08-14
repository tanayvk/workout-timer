// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: { enabled: true },
  modules: ["@nuxt/ui", "@nuxt/fonts", "@vite-pwa/nuxt"],
  fonts: {
    families: [
      { name: "Montserrat", provider: "google" },
      { name: "Space Mono", provider: "google" },
    ],
  },
  css: ["~/assets/main.css"],
  nitro: {
    routeRules: {
      "/*": { prerender: true },
    },
  },
  pwa: {
    strategies: "generateSW",
    registerWebManifestInRouteRules: true,
    registerType: "autoUpdate",
    manifest: {
      name: "Workout Timer",
      short_name: "WorkoutTimer",
      theme_color: "#57b9b9",
      icons: [
        {
          src: "pwa-64x64.png",
          sizes: "64x64",
          type: "image/png",
        },
        {
          src: "pwa-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
        {
          src: "maskable-icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
    workbox: {
      globPatterns: ["/", "**/*.{mjs,js,css,html,png,svg,ico}"],
    },
    injectManifest: {
      globPatterns: ["/", "**/*.{mjs,js,css,html,png,svg,ico}"],
    },
    client: {
      installPrompt: true,
      // periodicSyncForUpdates: 20,
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      navigateFallback: "/",
      navigateFallbackAllowlist: [/^\/$/],
      type: "module",
    },
  },
});
