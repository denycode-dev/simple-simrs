# Simple SIMRS Frontend

This document explains the architecture, design system, component patterns, and setup commands for the Simple SIMRS web client. You can run the application with Vite, inspect UI primitives using the Astryx CLI, and build domain modules using feature isolation.

## Design System: Astryx and Neutral Theme

Simple SIMRS uses the Astryx Design System v0.7.17 from Meta for its user interface. The system focuses on light mode rendering and Web Content Accessibility Guidelines (WCAG) AAA contrast compliance:

- **Core Library**: `@astryxdesign/core` provides accessible UI primitives
- **Styling Engine**: StyleX (`@stylexjs/stylex`) with pre-compiled CSS variables
- **Theme Package**: `@astryxdesign/theme-neutral` provides Figtree typography and neutral healthcare palettes
- **CLI Tooling**: `@astryxdesign/cli` audits component health via `npx astryx doctor`
- **Component Primitives**: Shared components in `src/components/ui/` adapt official Astryx primitives including Button, TextInput, Badge, Card, and Banner

## Architecture: Feature-Based Development

The frontend organizes code around hospital business domains instead of technical types.

### Architectural Principles

The codebase enforces four core structural rules:

- **Feature Encapsulation**: Place code belonging to a single domain (`api`, `components`, `hooks`, `types`) inside `src/features/<feature-name>/`.
- **Public API Boundary**: Expose public feature members through `index.ts` barrel files. Internal implementation details remain private to the feature directory.
- **Shared Foundation**: Store domain-agnostic components and utilities in `src/components/ui/`, `src/lib/`, `src/hooks/`, or `src/utils/`.
- **Theme Provider Integration**: The root component wraps the application tree with `<Theme theme={themes[defaultThemeSlug]} mode="light">` from `src/astryx-themes.ts`.

## Directory Structure

The project organizes source files into feature modules and shared infrastructure:

```text
frontend/
├── src/
│   ├── assets/                 # Global static assets including SVG icons and images
│   ├── components/             # Domain-agnostic components
│   │   ├── layout/             # Layout components (AppLayout, Sidebar, Header, Breadcrumb)
│   │   └── ui/                 # UI primitives (Button, Input, Card, Badge, Alert, DataTable)
│   ├── config/                 # Application configuration (env.ts, dashboard-menu.ts)
│   ├── features/               # Business domain modules
│   │   ├── auth/               # Medical user authentication feature
│   │   │   ├── api/            # Authentication API endpoints (loginApi, logoutApi)
│   │   │   ├── components/     # Authentication forms and user profile widgets
│   │   │   ├── hooks/          # Custom auth hooks (useAuth)
│   │   │   ├── types/          # Auth interfaces (AuthUser, LoginCredentials)
│   │   │   └── index.ts        # Public API export for auth
│   │   └── patients/           # Patient management feature
│   │       ├── api/            # Patient API endpoints (getPatientsApi)
│   │       ├── components/     # PatientTable, PatientCard, PatientList, PatientFilterBar
│   │       ├── hooks/          # Patient query and filter hooks (usePatients)
│   │       ├── types/          # Patient models (Patient, PatientFilter, PatientStatus)
│   │       └── index.ts        # Public API export for patients
│   ├── hooks/                  # Global React hooks (useDebounce)
│   ├── lib/                    # HTTP client abstraction (api-client native fetch)
│   ├── types/                  # Global TypeScript contracts (api.ts)
│   ├── utils/                  # Utility helper functions (formatters.ts)
│   ├── astryx-themes.ts        # Generated Astryx theme definitions (Theme Neutral)
│   ├── App.tsx                 # Root application component with Astryx Theme Provider
│   ├── index.css               # Single global stylesheet (Astryx Core and Light Mode tokens)
│   └── main.tsx                # React application entry point
├── AGENTS.md                   # Agent guidelines and Astryx component conventions
├── DESIGN.md                   # Design specifications, color tokens, and layout guidelines
├── Dockerfile                  # Production container definition with Node.js 22 Alpine
├── package.json                # Project dependencies and development scripts
├── tsconfig.app.json           # TypeScript configuration and path aliases (@/*)
└── vite.config.ts              # Vite configuration and development server options
```

## Data Table and Dashboard Navigation

The client provides dedicated modules for high-density hospital records and menu navigation.

### Centralized Navigation Configuration

The dashboard navigation menu lives in `src/config/dashboard-menu.ts`. You define navigation groups, routes, active indicators, and badge counts in one location:

```ts
import { DASHBOARD_MENU } from '@/config/dashboard-menu';
```

Add or modify menu items in the `DASHBOARD_MENU` array without altering the `Sidebar` presentation component.

### Dual Sticky Data Table

The `DataTable<T>` generic component in `src/components/ui/DataTable.tsx` handles large hospital records with fluid scrolling:

- **Sticky Header**: Headers remain locked to the top during vertical scrolling (`position: sticky; top: 0; z-index: 10`).
- **Sticky Action Column**: Action buttons remain anchored to the right side during horizontal scrolling (`position: sticky; right: 0; z-index: 5`).
- **Intersection Anchor**: The top-right corner header uses `z-index: 20` with an opaque background to prevent visual overlap during diagonal scrolling.
- **Embedded Capabilities**: The table includes debounced search, multi-column sorting, pagination controls, skeleton loading, and empty states.

## Astryx CLI and Agent Guidance

The project includes agent instructions in `AGENTS.md` and design token documentation in `DESIGN.md`.

Use the following Astryx CLI commands during interface development:

- **Run Design System Diagnostics**:
  ```bash
  npx astryx doctor
  ```

- **Search Available Components and Templates**:
  ```bash
  npx astryx search "<keyword>"
  ```

- **Inspect Component Property Signatures**:
  ```bash
  npx astryx component <ComponentName>
  ```

## Development Commands

Run these npm scripts inside the `frontend/` directory:

| Command | Action |
|---|---|
| `npm run dev` | Starts the Vite local development server on port 5173 |
| `npm run build` | Runs TypeScript compilation (`tsc -b`) and generates production assets |
| `npm run lint` | Executes ESLint to check code quality and adherence to conventions |
| `npm run preview` | Serves the production build locally for verification |

## Demo Credentials

Use these credentials to test the authentication flow and patient management interface:

- **Username**: `admin`
- **Password**: `admin123`
- **Assigned Persona**: Dr. Hendra Pratama, Sp.PD (Specialist in Internal Medicine)
