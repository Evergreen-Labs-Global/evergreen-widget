# Evergreen Widget

Evergreen Widget is a Next.js application that powers the Evergreen analytics dashboard and embedded widgets. The application is designed to integrate with a FastAPI backend, Supabase, and Memberstack while supporting deployment through Vercel.

## Technology Stack

- Next.js 15+
- React 19
- TypeScript
- Tailwind CSS
- Supabase
- Memberstack
- FastAPI (Backend API)
- Google Cloud (Backend Infrastructure) (Optional)
- Vercel (Frontend Deployment)

---

## Project Status

Current setup includes:

- Initial Next.js project structure
- TypeScript configuration
- Tailwind CSS configuration
- Project folder structure
- Git repository initialization
- Environment configuration
- Ready for API integration

---

## Installation

Clone the repository

```bash
git clone <repository-url>
```

Navigate into the project

```bash
cd evergreen-widget
```

Install dependencies

```bash
npm install
```

Run the development server

```bash
npm run dev
```

Open

```
http://localhost:3000
```

---

## Environment Variables

Create a `.env.local` file.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

NEXT_PUBLIC_API_URL=

SUPABASE_SERVICE_ROLE_KEY=
```

Additional environment variables may be added as development progresses.

---

## Planned Folder Structure

```
app/
components/
hooks/
lib/
services/
types/
utils/
public/
styles/
```

---

## Planned Features

- Authentication
- Role Based Access
- Dashboard
- Charts & Analytics
- Widget System
- API Integration
- Data Tables
- Search & Filtering
- Responsive UI
- Webflow Embed Support

---

## Backend Integration

The frontend will consume APIs exposed by the FastAPI backend.

Expected integration includes:

- Authentication
- Dashboard Metrics
- Widgets
- Reports
- Filtering
- Search
- User Data
- Business Logic

The API contract will be implemented once the backend specification is finalized.

---

## Deployment

Frontend deployment will be handled through **Vercel**.

The backend infrastructure (FastAPI, Cloud Run, Cloud Scheduler, PostgreSQL, etc.) will be managed separately.

---

## Development Workflow

1. Configure project
2. Configure Supabase
3. Database schema
4. Authentication
5. UI Components
6. Dashboard pages
7. API integration
8. Testing
9. Production deployment

---

## Available Scripts

```bash
npm run dev
```

Runs the development server.

```bash
npm run build
```

Creates a production build.

```bash
npm run start
```

Runs the production build locally.

```bash
npm run lint
```

Runs ESLint.

---

## Notes

This repository currently contains the initial project setup only.

Frontend development will continue in parallel with the FastAPI backend implementation. API integration will begin once the backend endpoints and API contract are finalized.