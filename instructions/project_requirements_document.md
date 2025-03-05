# Project Requirements Document

## 1. Project Overview

This project is an app designed to help home buyers and independent investors monitor real estate listings by tracking properties they are interested in. Users can paste in the URL of any real estate listing—whether from a well-known site or a local listing site—and the app will fetch key information using a scraping function. The fetched data is summarized and displayed in an interactive dashboard, making it easy to see details like price, location, and bedroom count.

The app is built to be simple yet effective in helping users keep up with changes in property listings. It runs a daily automated check to identify any updates (such as price adjustments or status changes) and highlights these updates on the dashboard. Core success criteria include reliable user authentication, accurate scraping responses, and seamless daily updates that allow users to stay informed about the properties they are watching.

## 2. In-Scope vs. Out-of-Scope

### In-Scope

*   **User Authentication:** Implement sign-up and log-in functionality using Supabase Auth. Each user will have a personal profile to manage their "watched listings."
*   **Dashboard:** Create a dashboard that displays saved listings with key attributes including price, address/location, bedroom count, and the last checked timestamp.
*   **Add Listing Flow:** Enable users to add listings by pasting a URL, which triggers a scraping process to fetch listing data. Provide an option for manual input if the scraping function is not desired.
*   **Automated Daily Scrape:** Set up a scheduled function (cron job) that runs daily and iterates through the saved listings, calling the scraping function to detect any updates.
*   **Change History & Notifications:** Allow users to view the change history of each property, including price changes and status updates, and send email notifications whenever there are changes.
*   **Mock Scraping Service:** Since the actual scraping service will be a separate project, responses should be mocked for the initial development phase.

### Out-of-Scope

*   **Actual Scraping Service:** The detailed implementation of the scraping service will not be covered in this phase. Only a mocked response is necessary.
*   **Complex Notification Systems:** Only implement email notifications. In-app notifications or SMS alerts are out-of-scope.
*   **Advanced Customization:** No specific branding or design customizations will be implemented during this phase; a generic design is acceptable.
*   **Platform-Specific Features:** The focus is on a responsive web app, and any mobile-specific optimizations or native app development is not included.

## 3. User Flow

A new user starts by signing up or logging into the app using their email, all managed securely by Supabase Auth. After authentication, the user lands on a dashboard that provides a simple overview of their saved real estate listings. From here, the user can add a new listing by pasting a URL of any real estate site. The pasted URL triggers the scraping function that returns key property details such as title, price, location, and images. If the user prefers, they can opt for manual input instead of using the automated scraping.

Once a listing is added and confirmed, it appears on the dashboard with essential details and a timestamp indicating the last check. Each day, a scheduled process runs in the background that revisits all saved listings, compares the latest scraped data to what is stored, and flags any listings with important changes. Users can then click on a property to review the change history, which includes information about price changes, availability, and other key updates, along with optional email notifications highlighting these changes.

## 4. Core Features

*   **User Authentication:**

    *   Sign-up and log-in using Supabase Auth.
    *   Secure user profiles to manage personal listings.

*   **Dashboard:**

    *   An interactive grid that displays a list of saved listings.
    *   Key attributes like price, location, bedroom count, and last checked date.

*   **Add Listing Flow:**

    *   URL input field for real estate listings.
    *   Automated scraping that outputs a summary (title, price, location, images).
    *   Option for manual data entry if scraping is skipped.

*   **Automated Daily Scrape:**

    *   A daily cron job or scheduled function.
    *   Iterates over all listings, calls the scraping function, and compares new data with stored data.
    *   Flags listings with detected changes for user review.

*   **Change History & Email Notifications:**

    *   Detailed log of changes for each property (price, status, etc.).
    *   Email notifications to inform users of updates.

*   **Mocked Scraping Service:**

    *   For initial development, responses from the scraping service will be mocked.

## 5. Tech Stack & Tools

*   **Frontend:**

    *   Framework: Nuxt.js for building the web app.
    *   UI Library: Nuxt UI to design the front-end components with a generic design.

*   **Backend:**

    *   Database and Authentication: Supabase, leveraging its built-in auth system and database for listing data storage.
    *   Scheduled Tasks: Using Supabase functions or an external cron service to handle the automated daily scraping.

*   **AI/Tools:**

    *   Integration with Cursor, an advanced IDE that offers real-time coding suggestions and advanced developer tools, to assist with development.

*   **Other Tools:**

    *   Email Notification Service: Integrated via Supabase or an external SMTP service to send notifications about changes.

## 6. Non-Functional Requirements

*   **Performance:**

    *   The dashboard should load quickly (ideally within 2-3 seconds) even with multiple listings.
    *   The automated daily scrape should run within a reasonable time without disrupting user activity.

*   **Security:**

    *   User data should be protected with Supabase Auth’s security measures.
    *   Ensure stored data is securely accessed and updated.

*   **Usability:**

    *   The app should offer a simple and intuitive interface that is easy for home buyers and independent investors to navigate.
    *   The design will be responsive to work well on both desktop and mobile web browsers.

*   **Reliability:**

    *   The scheduled scraping function must run reliably each day without fail.
    *   Email notifications should be delivered promptly if property changes are detected.

## 7. Constraints & Assumptions

*   **Scraping Service:** The actual scraping service is not part of this project’s scope; it is assumed that mocked responses are acceptable for now.
*   **Supabase Availability:** The solution assumes that Supabase services (database, auth, etc.) are available and functioning as required.
*   **Responsiveness:** The app is developed as a responsive web application; however, native mobile app optimizations are not considered.
*   **User Registration:** The app is free to use, but new registrations must be approved by an administrator before the account is activated.
*   **Email Notifications:** Limiting notifications to email only, without support for SMS or in-app notifications.

## 8. Known Issues & Potential Pitfalls

*   **Scraping Variability:** Since the app accepts URLs from any listing site, the scraping function (even with mocked responses) may face difficulties due to varied website structures and dynamic content.

    *   Mitigation: Implement flexible parsing logic and fallback options, such as manual input.

*   **Cron Job Reliability:** Scheduling a daily scraping task must be robust to handle network delays or failures.

    *   Mitigation: Use Supabase functions or a reliable external cron service with proper error handling and retries.

*   **Data Consistency:** Comparing scraped data for differences may face challenges if a property has minor non-critical changes.

    *   Mitigation: Define clear rules for what constitutes a significant change (e.g., price, status) and ignore trivial differences.

*   **User Privacy & Security:** Ensuring that user profiles and saved data remain secure is critical, especially when personal data is involved.

    *   Mitigation: Leverage Supabase’s built-in security features and follow best practice guidelines for data storage and access.

This document serves as the complete and unambiguous reference for this project. All subsequent documents (Tech Stack, Frontend Guidelines, Backend Structure, etc.) should reference this PRD, ensuring that no key details are missed during development.
