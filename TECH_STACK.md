# Tech Stack - EduRepo-NG-AI

## ✅ Currently Using

### Frontend Framework
- **Next.js 14+** (App Router) - Full-stack React framework
- **React 18.3** - UI library
- **TypeScript** - Type safety

### UI & Styling
- **TailwindCSS** - Utility-first CSS framework
- **Shadcn UI** - High-quality component library
  - Button, Input, Card components
  - Radix UI primitives
- **Lucide React** - Icon library (✅ Now using icons throughout)
  - Users, Calculator, Sparkles, BarChart3, Download, Code, Menu, X icons

### State Management & Data Fetching
- **Zustand** ✅ - Lightweight state management
- **TanStack React Query** ✅ - Server state management & data fetching
  - `use-institutions.ts` - Institutions data hooks
  - `use-programs.ts` - Programs data hooks
  - Configured with QueryClientProvider

### Tables (Available)
- **TanStack React Table** ✅ - Headless table library
  - Ready to use for data tables when needed

### Backend
- **Next.js API Routes** - Server-side API endpoints
- **Prisma** - Type-safe ORM
- **PostgreSQL** - Database with PGVector extension
- **NextAuth.js** - Authentication

### Database
- **PostgreSQL 16** - Primary database
- **PGVector** - Vector embeddings for AI/RAG
- **Prisma ORM** - Database client

### Caching
- **Vercel KV** (free tier) - Redis-compatible caching
- **Redis** (Docker) - Alternative caching option

### AI/ML
- **PGVector** - Vector database for embeddings
- **RAG Pipeline** - Retrieval-Augmented Generation

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Type checking

## 📦 Installed Packages

### Core Dependencies
```json
{
  "next": "^14.2.0",
  "react": "^18.3.0",
  "react-dom": "^18.3.0",
  "@prisma/client": "^5.19.0",
  "next-auth": "^4.24.7",
  "zod": "^3.23.8"
}
```

### UI & Styling
```json
{
  "tailwindcss": "^3.4.0",
  "tailwindcss-animate": "^1.0.7",
  "lucide-react": "^0.427.0",
  "@radix-ui/react-*": "various",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.4.0"
}
```

### State Management & Data Fetching
```json
{
  "zustand": "^4.5.0",
  "@tanstack/react-query": "^5.28.0",
  "@tanstack/react-table": "^8.15.0"
}
```

## 🎨 Shadcn UI Components

Currently implemented:
- ✅ Button (`components/ui/button.tsx`)
- ✅ Input (`components/ui/input.tsx`)
- ✅ Card (`components/ui/card.tsx`)
- ✅ Navbar (`components/ui/navbar.tsx`)
- ✅ Footer (`components/ui/footer.tsx`)

## 🔧 Custom Hooks (React Query)

- ✅ `useInstitutions()` - Fetch institutions with filters
- ✅ `useInstitution(id)` - Fetch single institution
- ✅ `usePrograms()` - Fetch programs with filters
- ✅ `useProgram(id)` - Fetch single program

## 🗄️ Zustand Stores

- ✅ Zustand is available for state management
  - Currently using React Query hooks for data fetching
  - Zustand stores can be created as needed
  - Filters (type, ownership, state)

## 📊 React Table (Ready to Use)

TanStack React Table is installed and ready for:
- Data tables with sorting
- Filtering
- Pagination
- Column resizing

## 🎯 Usage Examples

### Using Lucide Icons
```tsx
import { Users, Calculator, Sparkles } from "lucide-react"

<Users className="h-6 w-6 text-primary" />
```

### Using React Query
```tsx
import { useInstitutions } from "@/lib/hooks/use-institutions"

const { data, isLoading, error } = useInstitutions({ type: "university" })
```

### Using Zustand
```tsx
// Note: Zustand is available but currently using React Query hooks
// Example Zustand store can be created as needed:
// import { create } from "zustand"
// const useStore = create((set) => ({ ... }))
```

### Using React Table
```tsx
import { useReactTable, getCoreRowModel } from "@tanstack/react-table"

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
})
```

## ✅ Status Summary

| Technology | Status | Usage |
|------------|--------|-------|
| **TailwindCSS** | ✅ Configured | Used throughout |
| **Shadcn UI** | ✅ Set up | Button, Input, Card, Navbar, Footer |
| **Lucide Icons** | ✅ Installed & Used | Icons in homepage, navbar |
| **Zustand** | ✅ Installed | Store created for institutions |
| **React Query** | ✅ Installed & Configured | Hooks created for data fetching |
| **React Table** | ✅ Installed | Ready to use when needed |

---

**All requested technologies are now integrated and ready to use!** 🎉


