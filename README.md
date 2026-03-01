# Tokyo Places

A full-stack web app for discovering, organizing, and tracking places to visit in Tokyo. Built with Next.js 16, React 19, and TypeScript.

## Features

- **Interactive Map** — Google Maps with marker clustering (Supercluster), user geolocation with compass heading, and neighborhood zoom
- **Smart Search** — Fuzzy search (Fuse.js) across place names, addresses, and categories with typo tolerance
- **Filtering** — Filter by category, city, ward, neighborhood, visited status, and proximity ("Near Me")
- **Place Details** — Photo carousel, opening hours, Google reviews, ratings, and quick links to Google Maps/directions
- **AI Categorization** — Automatic place categorization using Claude Haiku with Japanese food keyword recognition
- **Admin Dashboard** — Full CRUD for places and categories, bulk operations, Google Places API refresh
- **CSV Import** — Bulk import from Google Maps saved places export
- **Mobile Friendly** — Responsive design with sticky headers, touch-friendly drawers, and scroll containment

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Frontend | React 19, Tailwind CSS 4 |
| UI Components | shadcn/ui, Radix UI |
| Database | PostgreSQL (Neon) |
| ORM | Drizzle |
| Auth | NextAuth 5 (Credentials) |
| Maps | Google Maps API (@vis.gl/react-google-maps) |
| AI | Anthropic SDK (Claude Haiku) |
| Search | Fuse.js |
| Linting | Biome |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or [Neon](https://neon.tech) account)
- Google Maps API key (with Places API enabled)
- Anthropic API key (for AI categorization)

### Setup

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd tokyo-places
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```env
   DATABASE_URL=postgresql://...
   NEXTAUTH_SECRET=your-secret
   NEXTAUTH_URL=http://localhost:3000
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
   ANTHROPIC_API_KEY=your-anthropic-key
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=your-password
   ```

4. Push the database schema and seed initial data:
   ```bash
   npm run db:push
   npm run db:seed:user
   npm run db:seed:categories
   ```

5. Start the dev server:
   ```bash
   npm run dev
   ```

### Importing Places

Place your Google Maps export CSV at `public/i_want_to_visit.csv`, then:

```bash
# Import new places (skips duplicates)
npm run db:import

# Fresh import (wipes everything and reimports)
npm run db:sync:fresh
```

The import pipeline:
1. Searches each place via Google Places API
2. Stores coordinates, photos, hours, ratings
3. AI categorizes each place in batches of 25
4. Backfills reviews and opening hours
5. Extracts city/ward/neighborhood from addresses

### Database Scripts

| Script | Description |
|--------|-------------|
| `npm run db:push` | Push schema changes to database |
| `npm run db:seed:user` | Create admin user |
| `npm run db:seed:categories` | Seed base categories (25) |
| `npm run db:import` | Import places from CSV |
| `npm run db:import -- --fresh` | Wipe and reimport everything |
| `npm run db:backfill-hours` | Backfill hours, photos, ratings, reviews |
| `npm run db:backfill-neighborhoods` | Backfill missing city/ward/neighborhood |
| `npm run db:sync` | Push + seed + import + backfill |
| `npm run db:sync:fresh` | Full fresh sync (wipes all data) |
| `npm run db:studio` | Open Drizzle Studio (DB browser) |

## Database Schema

- **users** — Admin authentication (email/password with bcrypt)
- **categories** — Place categories with color, icon, and slug
- **places** — Core place data with Google enrichment (photos, hours, reviews, ratings)
- **place_categories** — Many-to-many junction table (cascade delete)
