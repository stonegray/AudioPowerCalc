# Audio System Power Calculator

## Overview

This is a professional audio system power calculator designed for audio engineering professionals to design generator, amplifier, and speaker configurations. The application calculates power utilization, SPL output, and helps identify potential issues in audio system setups. It features a three-column dashboard layout with equipment cards for generators, amplifiers, and speakers, along with visual connection lines between components.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: Custom React hooks (`useSystemStore`) with localStorage persistence
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Data Fetching**: TanStack React Query for server state management

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **Build Tool**: esbuild for server, Vite for client
- **Development**: tsx for TypeScript execution, Vite dev server with HMR

### Application Structure
- **`client/`**: React frontend application
  - `src/components/`: Reusable UI components (equipment cards, connection nodes, settings panels)
  - `src/lib/`: Business logic (calculations, types, state management)
  - `src/pages/`: Route-level page components
- **`server/`**: Express backend
  - `routes.ts`: API route definitions
  - `storage.ts`: Data persistence interface (currently in-memory)
  - `vite.ts`: Vite development server integration
- **`shared/`**: Shared code between client and server (schema definitions)

### Key Design Patterns
- **Equipment Presets**: Pre-configured equipment templates for generators, amplifiers, and speakers
- **Visual Connections**: Interactive node-based system for connecting equipment visually
- **Three App Modes**: Basic, Advanced, and Engineering modes with varying complexity levels
- **Real-time Calculations**: Power utilization, SPL calculations, temperature/altitude derating

### Data Flow
1. User configures equipment through card components
2. State updates flow through `useSystemStore` hook
3. Calculations run in `calculations.ts` based on current state
4. Results display in real-time with visual indicators (progress bars, color-coded warnings)

## External Dependencies

### Database
- **PostgreSQL**: Configured via Drizzle ORM
- **Drizzle Kit**: Database migrations and schema management
- **Schema Location**: `shared/schema.ts` defines database tables

### Key NPM Packages
- **UI**: Radix UI primitives, shadcn/ui components, Lucide icons
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts (via shadcn chart components)
- **Carousel**: Embla Carousel

### Development Tools
- **Vite**: Frontend build tool with React plugin
- **Replit Plugins**: Runtime error overlay, cartographer, dev banner
- **TypeScript**: Strict mode enabled with path aliases

### Build Configuration
- Client builds to `dist/public/`
- Server bundles with esbuild to `dist/index.cjs`
- Shared path aliases: `@/` for client src, `@shared/` for shared code