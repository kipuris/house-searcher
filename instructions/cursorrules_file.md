# .cursorrules

## Project Overview

*   **Type:** cursorrules_file
*   **Description:** I want to build an app that lets users track real estate like apartments and houses from the available listings saved in the dashboard. The user will paste in links and the app will scrape the data from the listing website. It will then summarize the data in a grid. Once per day it will go through all of the listings and look for updates.
*   **Primary Goal:** Help home buyers and independent investors monitor real estate listings by fetching key listing details, displaying them in an interactive dashboard, and running daily updates to flag changes.

## Project Structure

### Framework-Specific Routing

*   **Directory Rules:**

    *   nuxtjs (assumed Nuxt 3): Use the file-based routing in the `pages/` directory following the Nuxt convention (e.g., `pages/index.vue` for the home route, `pages/auth/login.vue` for authentication pages).
    *   Example: "Nuxt.js" → `pages/[route].vue` pattern

### Core Directories

*   **Versioned Structure:**

    *   pages: Holds Nuxt.js file-based routes for a clear separation of application screens.
    *   components: Contains reusable Nuxt UI components that are integrated with the overall design and functionality.

### Key Files

*   **Stack-Versioned Patterns:**

    *   layouts/default.vue: The default layout for Nuxt.js, ensuring consistent presentation and integration of global elements such as headers and footers.
    *   nuxt.config.ts: Central configuration file for setting up Nuxt.js, integrating Nuxt UI, Supabase (including Supabase Auth), and other project-specific plugins.

## Tech Stack Rules

*   **Version Enforcement:**

    *   nuxt@3: Enforce Nuxt 3 file-based routing using the `pages/` directory along with composition API practices for a modern reactive UI.
    *   supabase: Utilize Supabase for database and authentication; ensure secure API access and integration of Supabase Auth for user management.

## PRD Compliance

*   **Non-Negotiable:**

    *   "The scheduled scraping function must run reliably each day without fail." : Ensure that the automated daily scraping job is robustly scheduled and integrated with error handling to maintain data consistency.

## App Flow Integration

*   **Stack-Aligned Flow:**

    *   Example: "Nuxt.js Auth Flow → `pages/auth/login.vue` uses server middleware for Supabase Auth to handle secure user login and registration."
