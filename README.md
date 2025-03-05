# House Searcher

A modern web application for tracking real estate listings across multiple platforms. This tool helps home buyers and independent investors monitor properties they're interested in by automatically fetching and tracking listing details.

## 🏠 Features

- **Listing Tracking**: Add any real estate listing by URL and track key details
- **Automated Updates**: Daily checks for changes in price, status, and other details
- **Change History**: View the complete history of changes for each property
- **Team Collaboration**: Share listings with team members for collaborative house hunting
- **Rich Content**: View property details with markdown support for better readability
- **Admin Dashboard**: Manage users and approve new registrations

## 🛠️ Tech Stack

### Frontend
- **Nuxt.js 3**: Vue-based framework for building the web application
- **Nuxt UI**: Component library for consistent design
- **TypeScript**: For type-safe code
- **Tailwind CSS**: For styling
- **VueUse**: Collection of Vue composition utilities

### Backend
- **Supabase**: For database, authentication, and storage
- **Edge Functions**: For serverless functionality like scraping
- **Row Level Security (RLS)**: For data protection

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd house-searcher
```

2. Install frontend dependencies
```bash
cd frontend
npm install
```

3. Set up environment variables
Create a `.env` file in the frontend directory with the following variables:
```
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-anon-key
```

4. Start the development server
```bash
npm run dev
```

5. Set up Supabase
```bash
cd ../supabase
supabase init
supabase start
```

## 📋 Project Structure

```
house-searcher/
├── frontend/               # Nuxt.js frontend application
│   ├── components/         # Reusable Vue components
│   ├── layouts/            # Page layouts
│   ├── middleware/         # Nuxt middleware
│   ├── pages/              # Application pages
│   ├── public/             # Static assets
│   ├── server/             # Server-side code
│   └── types/              # TypeScript type definitions
│
├── supabase/               # Supabase configuration
│   ├── functions/          # Edge Functions
│   │   ├── daily-scrape/   # Automated daily scraping
│   │   ├── scrape-listing/ # Individual listing scraper
│   │   └── scrape-markdown/# Content extraction
│   ├── migrations/         # Database migrations
│   └── seed.sql            # Initial seed data
│
└── instructions/           # Project documentation
```

## 🔄 Workflow

1. **User Registration**: Sign up and wait for admin approval
2. **Adding Listings**: Paste a URL to automatically fetch property details
3. **Dashboard View**: See all your tracked properties in one place
4. **Daily Updates**: Receive notifications when property details change
5. **Team Collaboration**: Share listings with team members

## 🔒 Security

- User authentication via Supabase Auth
- Row Level Security (RLS) policies for data protection
- Admin approval required for new registrations
- Secure data access through database views

## 🧩 Key Components

- **ListingGrid**: Displays all tracked properties in a responsive grid
- **AddListing**: Modal for adding new listings via URL or manual entry
- **RichTextEditor**: Markdown editor for property notes
- **ContentRenderer**: Displays formatted property descriptions
- **AppHeader**: Navigation and user management

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- Built with [Nuxt.js](https://nuxt.com/)
- Powered by [Supabase](https://supabase.com/)
- UI components from [Nuxt UI](https://ui.nuxt.com/) 