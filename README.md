# ScopeMaster

Collaborative platform for software requirements elicitation, management, and validation, developed as the capstone integrator project for the Systems Analysis and Development course — SENAI Taubaté (2026).

## Team

- Ana Carolina Gonçalves
- Davi Marcondes Paes de Souza
- João Gabriel Floriano Olímpio
- João Pedro Fonseca Alves de Carvalho
- Lucca Castilho Costa
- Lucas Souza da Silva
- Miguel Oliveira de Almeida
- Pedro de Lima Cavalcanti

**Advisor:** Prof. Wesley Fioreze

## Tech Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS + Shadcn/UI + MUI
- **Backend:** Supabase BaaS (PostgreSQL + Auth + Row-Level Security)
- **Hosting:** Vercel

## Features

- User registration and authentication with three role profiles (Administrator, Developer, Client)
- Full project management (CRUD)
- Functional and non-functional requirements with project-scoped unique codes
- Client validation flow with approval/rejection and mandatory feedback
- Automatic PDF documentation generation for approved requirements
- Dashboard with metrics and recent-requirements listing
- Real-time notifications for the responsible analyst

## Running locally

### Prerequisites

- Node.js 18+ and npm
- A [Supabase](https://supabase.com) account with a project created

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/luccalck/scope-master.git
   cd scope-master
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables — copy the example file and fill in your Supabase project credentials:
   ```bash
   cp .env.example .env
   ```

4. Run the SQL scripts under `database/` in the Supabase SQL Editor, in numeric order (`00_*`, `01_*`, ...). The `99_*` scripts are optional (populate / demo reset).

5. Start the development server:
   ```bash
   npm run dev
   ```

   The app will open at `http://localhost:5173` (or the next available port).

## Deploying to Vercel

1. Log in to [Vercel](https://vercel.com) and click **New Project**.
2. Import this repository from GitHub.
3. Vercel will auto-detect the Vite framework — no build command tweaks needed.
4. Under **Environment Variables**, set:
   - `VITE_SUPABASE_URL` — your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` — Supabase public (anon) key
5. Click **Deploy**.

The `vercel.json` at the project root already defines the rewrites required for React Router to work in production (all routes served by `index.html`).

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the dev server with hot reload |
| `npm run build` | Builds the production bundle into `dist/` |
| `npm run preview` | Serves the production build locally for testing |

## Project structure

```
.
├── src/
│   ├── app/
│   │   ├── components/    # Reusable components and Shadcn/UI
│   │   ├── screens/       # Screens (Login, Dashboard, Projects, etc.)
│   │   ├── lib/           # api.ts, supabase.ts, types.ts
│   │   └── App.tsx
│   ├── styles/            # Global CSS and Tailwind
│   └── main.tsx           # Entry point
├── database/              # Versioned SQL scripts (00_*, 01_*, ...)
├── docs/                  # ERS PDF, audit screenshots, attributions
├── public/                # Static assets
├── .env.example           # Environment variables template
├── vercel.json            # Vercel deploy configuration
└── vite.config.ts
```

## Technical documentation

The complete Software Requirements Specification (SRS) — UML diagrams, business rules, test cases, and Sprint schedule — is in [`docs/ERS_ScopeMaster.pdf`](docs/ERS_ScopeMaster.pdf). Visual audit screenshots across viewports (mobile, tablet, laptop, desktop) are in [`docs/Screenshots/`](docs/Screenshots/).

## License

Academic project developed for educational purposes — SENAI Taubaté, 2026.
