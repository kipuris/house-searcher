Below is the step‐by‐step implementation plan for the real estate tracking app. Each phase is broken down into individual steps with references to the source documents (e.g., PRD sections) and exact file paths or commands where required.

──────────────────────────────

Phase 1: Environment Setup ──────────────────────────────

1.  Initialize the Git repository and set up branches:

    *   Action: Create a new Git repository. Create a main branch and a dev branch.
    *   Reference: PRD Section 1.4 (Project Setup)
    *   Command: git init; git checkout -b main; git checkout -b dev
    *   Done. Repository initialized with main and dev branches created successfully.

2.  Create the project directory structure:

    *   Action: Create two main folders:
        - `/frontend` for Nuxt.js code
        - `/supabase` for Supabase configuration, migrations, and functions
    *   Reference: file_structure_document, supabase_guidelines.md
    *   Done. Created frontend and supabase directories successfully.

3.  Set up the Nuxt.js project in `/frontend` using Nuxt UI:

    *   Action: Run Nuxt.js project initialization. Install Nuxt UI.
    *   Command (inside `/frontend`): npx create-nuxt-app . (Follow prompts to select Nuxt.js framework; afterward install Nuxt UI using: npx nuxi@latest module add ui)
    *   Important Configuration Notes:
        - Add both '@nuxt/ui' and '@nuxtjs/supabase' to package.json dependencies
        - Must configure modules in nuxt.config.ts:
          ```ts
          export default defineNuxtConfig({
            modules: ['@nuxt/ui', '@nuxtjs/supabase']
          })
          ```
    *   Reference: PRD Section 2 (Dashboard, UI) and tech_stack_document
    *   Done. Nuxt.js project initialized and Nuxt UI installed successfully.

4.  Configure environment variables for Supabase in `/frontend`:

    *   Action: Create an `.env` file in `/frontend` with the Supabase project URL and public API key (obtained from your Supabase dashboard).
    *   File: `/frontend/.env`
    *   Reference: PRD Section 1 (User Authentication), Tech Stack
    *   Done. Created .env file with Supabase configuration placeholders.

5.  Set up your Supabase project:

    *   Action: Initialize Supabase project structure:
        ```bash
        supabase init
        ```
    *   Create the following structure in `/supabase`:
        - `/migrations` - Database migrations following timestamp naming convention
        - `/functions` - Edge Functions (if needed)
        - `/seed.sql` - Initial seed data
        - `config.toml` - Supabase configuration
    *   Reference: supabase_guidelines.md
    *   Done. Supabase project structure created and configured.

6.  **Validation**: From the `/frontend` directory, run the development server (e.g., npm run dev) and verify that the Nuxt app starts without errors.
    *   Done. Development server started successfully at http://localhost:3000/

──────────────────────────────

Phase 2: Database Setup ──────────────────────────────

1.  Create database migrations following Supabase guidelines:

    *   Action: Create timestamped migration files in `/supabase/migrations/` following the format `YYYYMMDDHHmmss_description.sql`
    *   Important Guidelines:
        - Enable Row Level Security (RLS) for all tables
        - Create granular RLS policies (separate for select, insert, update, delete)
        - Set proper schema comments
        - Follow SQL style guide from supabase_guidelines.md
    *   Status: Completed migrations:
        - Auth configuration
        - User approvals table
        - Admin roles and functions
        - Users view for secure data access

2.  Configure Supabase Auth:

    *   Action: Set up authentication with admin approval workflow
    *   Status: Completed with:
        - User registration requiring admin approval
        - Admin role system
        - Secure user data access through views
        - RLS policies for data protection

──────────────────────────────

Phase 3: Frontend Development ──────────────────────────────

1.  Implement User Authentication pages: a. Create `/frontend/pages/login.vue`:

    *   Action: Develop the login page using Nuxt UI components and integrate Supabase Auth SDK for login functionality.
    *   Reference: PRD Section 1 (User Authentication)
    *   Done. Created login page with Nuxt UI components and Supabase Auth integration.

2.  b. Create `/frontend/pages/signup.vue`:

    *   Action: Develop the signup page that uses Supabase Auth for registration. Incorporate logic to show a pending approval notice after sign-up (since admin approval is required).
    *   Reference: PRD Section 1
    *   Done. Created signup page with registration flow and pending approval notice.

3.  **Validation**: Manually test sign-up and login flows in the browser to ensure that users can register and log in using Supabase Auth.
    *   Fixed Issues:
        - Added auth middleware to handle authentication state and prevent unwanted redirects
        - Fixed form styling to ensure light mode consistency using proper UI props (:ui="{ base: 'bg-white dark:bg-white' }")
        - Added proper Supabase redirect configuration in nuxt.config.ts
        - Removed direct module imports in favor of Nuxt auto-imports
        - Important: Always use Nuxt's auto-imports instead of importing directly from modules
    *   Done. Authentication flow tested and working correctly:
        - Signup form works with validation
        - Registration completion message shows properly
        - Login redirects to dashboard
        - Auth middleware properly protects routes

4.  Develop the Dashboard page:

    *   Action: Create `/frontend/pages/index.vue`. Use Nuxt UI's grid system to layout an interactive grid that displays user listings. Each grid item should show key attributes (price, address, bedroom count, and last checked timestamp).
    *   Reference: PRD Section 2 (Dashboard)
    *   Status: Completed with the following features:
        - Created ListingGrid component with responsive grid layout
        - Implemented search and sort functionality
        - Added mock data for testing
        - Included property cards with all required attributes
        - Added visual indicator for updated listings
        - Implemented empty state handling
        - Set up root route (/) to redirect to dashboard

5.  **Validation**: Run the Nuxt development server. Verify that:
    *   The root URL (/) redirects to the dashboard
    *   After logging in, the dashboard page loads and renders listings correctly
    *   Status: Ready for testing with mock data

6.  Implement the Add Listing Flow: a. Create `/frontend/components/AddListing.vue`:

    *   Action: Build a component that includes a text input (to paste a listing URL) and a button to trigger the scraping process. Also, provide manual input fields to override or enter details if the user prefers.
    *   Reference: PRD Section 3 (Add Listing Flow)
    *   Status: Completed with the following features:
        - Modal-based add listing interface
        - URL input with mock scraping functionality
        - Manual input option
        - Form validation
        - Image preview
        - Proper light mode styling
        - Integration with dashboard

b. Integrate the mocked scraping response:
    *   Action: Within the component, simulate an API call that returns property summary info (title, price, location, images) when a URL is pasted.
    *   Reference: PRD Section 3
    *   Status: Completed with mock data and simulated API delay

7.  **Validation**: In the browser, test the Add Listing component by entering a URL. Confirm that a mock summary is displayed and that the user can choose to confirm adding the listing.
    *   Status: Completed and verified:
        - URL input and mock scraping works
        - Manual input option functions correctly
        - Form validation is working
        - New listings are added to the grid
        - Modal closes after successful addition

8.  Create a Listing Grid component:
    *   Action: Develop `/frontend/components/ListingGrid.vue` to display saved listings in a grid format (with key property details).
    *   Reference: PRD Section 2 (Dashboard) and Frontend Guidelines
    *   Status: Completed and integrated with dashboard

9.  Create Team Management Features:
    *   Action: Implement team functionality to allow users to share listings with team members
    *   Status: Completed with the following features:
        - Created teams and team_members tables with proper RLS policies
        - Implemented team creation and management UI
        - Added ability to add/remove team members
        - Created team listings view for shared access
        - Added team member email validation
        - Implemented proper security checks for team operations

10. Create Admin Dashboard:
    *   Action: Implement admin functionality for user management
    *   Status: Completed with the following features:
        - Created admin middleware for route protection
        - Implemented user approval workflow
        - Added user role management (admin/user)
        - Created stats overview (pending/approved/admin counts)
        - Added user search functionality
        - Implemented user actions (approve/make admin)

11. Create Layouts:
    *   Action: Implement layout system for consistent UI across pages
    *   Status: Completed with:
        - Created auth layout for login/signup pages
        - Created default layout with navigation for authenticated pages
        - Added proper navigation links based on user role
        - Implemented responsive design for all layouts

12. Implement Navigation:
    *   Action: Add navigation bar for authenticated pages
    *   Status: Completed with:
        - Added responsive navigation bar
        - Implemented active route indication
        - Added conditional admin section visibility
        - Included user info and sign-out functionality

──────────────────────────────

Phase 4: Integration & Backend Development ──────────────────────────────

1.  Connect the frontend with Supabase:
    *   Status: Completed
    *   Implemented features:
        - User Authentication using Supabase Auth
        - Data storage in Supabase tables
        - Row Level Security (RLS) policies
        - Admin approval workflow
        - Listing management (create, read, update)

2.  Database Schema and Security:
    *   Status: Completed
    *   Implemented features:
        - Created listings table with proper schema
        - Set up RLS policies for data protection
        - Added indexes for performance
        - Configured automatic timestamp updates
        - Implemented user approval system

3.  Automated Daily Scraping:
    *   Status: Completed with:
        - Created Edge Function in `/supabase/functions/daily-scrape/`
        - Implemented mock scraping logic with random changes
        - Added change detection and history tracking
        - Set up daily cron job using pg_cron (runs at 2 AM UTC)
        - Prepared email notification system (currently mocked)
    *   Next steps:
        - Deploy Edge Function to Supabase
        - Configure environment variables
        - Implement production scraping logic
        - Set up email service for notifications

4.  **Validation**: 
    *   Completed validations:
        - End-to-end flow testing (signup, login, add listing)
        - Data persistence in Supabase
        - RLS policy effectiveness
        - Admin approval workflow
    *   Pending validations:
        - Daily scrape function in production
        - Email notification system

──────────────────────────────

Phase 5: Deployment ──────────────────────────────

1.  Deploy the Nuxt.js frontend application:

    *   Action: Prepare a deployment configuration file (e.g., `/vercel.json` if using Vercel or appropriate file for your chosen hosting) in the root of the `/frontend` directory. Deploy the app to the selected platform (e.g., Vercel, Netlify).
    *   Reference: Deployment Guidelines in tech_stack_document

2.  Deploy the Supabase backend:

    *   Action: Ensure that all database changes and scheduled functions (cron job for `daily_scrape`) are properly deployed and active in your live Supabase project.
    *   Reference: PRD Section 4 (Automated Daily Scrape)

3.  **Validation**: After deployment, visit the production URL of the Nuxt app. Test critical flows like sign-up, login, add listing, and verify that the daily scrape function is scheduled and runs (check Supabase logs).

──────────────────────────────

Phase 6: Post-Launch ──────────────────────────────

1.  Set up monitoring and logging:

    *   Action: Configure monitoring for the Nuxt app (via your hosting provider logs, e.g., Vercel's dashboard) and for Supabase (using Supabase's logging tools) to capture errors and performance metrics.
    *   Reference: PRD Section 7 & Deployment Monitoring best practices

2.  Implement backup scheduling for your Supabase database:

    *   Action: In the Supabase dashboard, enable automatic backups (or configure a cron job using pg_dump if supported) to secure user data.
    *   Reference: PRD Section 7 (Data Backup and Consistency)

3.  **Validation**: Simulate a test backup and check logs to confirm that backups are running as scheduled. Also, simulate a listing change and verify that an email notification is sent to the user.

──────────────────────────────

This implementation plan aligns closely with the project requirements detailed in the PRD and the specified tech stack. Each step corresponds to an action with one responsibility per step, and validations are included to ensure correctness at every stage.
