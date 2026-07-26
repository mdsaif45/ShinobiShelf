# Frontend Architecture & Design System Guidelines

This document outlines the architectural standards, component hierarchy, design system rules, and folder structure for the **ShinobiShelf** React frontend application.

---

## 1. High-Level Architectural Overview

The frontend application follows a **Modular Component Architecture** structured into atomic UI primitives, feature-driven components, custom hooks, and an abstract service layer that interfaces cleanly with the Express backend REST API.

```
   ┌────────────────────────────────────────────────────────┐
   │                   Page Components                      │
   │      (LibraryScreen, ProfileScreen, AuthScreen)        │
   └───────────────────────────┬────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
   ┌─────────────────┐                  ┌───────────────────┐
   │ Feature Modules │                  │ Common Components │
   │ (Tabs & Modals) │                  │ (Nav, Auth Guard) │
   └────────┬────────┘                  └─────────┬─────────┘
            │                                     │
            └──────────────────┬──────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │                 Atomic UI Primitives                   │
   │      (Button, Input, Badge, Modal, Card, Spinner)      │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │                 Custom React Hooks                     │
   │               (useBooks, useLoans, useAuth)            │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │                  Client Service Layer                  │
   │     (bookService, loanService, userService, etc.)      │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │                  Express REST Backend                  │
   │                 (/api/books, /api/loans)               │
   └───────────────────────────┬────────────────────────────┘
```

---

## 2. Directory Structure Standard

```
frontend/src/
├── pages/                         # Top-level view screens / routes
│   ├── AuthPage.tsx               # Login & Registration screen
│   ├── LibraryPage.tsx            # Main catalog, tab host & community dashboard
│   ├── OnboardingPage.tsx         # User preference setup flow
│   └── ProfilePage.tsx            # User profile, badges & settings
│
├── components/
│   ├── features/                  # Domain-specific feature modules & tab views
│   │   ├── AnalyticsReportTab.tsx # Honesty points & lending analytics charts
│   │   ├── BookClubsTab.tsx       # Community book clubs & discussions
│   │   ├── LeaderboardBadgesTab.tsx # Honor badges & community leaderboard
│   │   ├── LoansCalendarTab.tsx   # Due-date calendar & active loans tracking
│   │   ├── PhysicalSwapsTab.tsx   # Physical pickup spots & swap events
│   │   └── WishlistBoardTab.tsx   # Community wishlist & fulfillment board
│   │
│   ├── modals/                    # Contextual modal dialogs
│   │   ├── AddBookModal.tsx       # ISBN scanner & manual book addition
│   │   ├── BookDetailsModal.tsx   # Detailed book view & action launcher
│   │   └── BorrowRequestModal.tsx # Handshake code generator & borrow request form
│   │
│   └── ui/                        # Atomic, reusable UI primitives & shadcn components
│       ├── Badge.tsx              # Status indicator badge
│       ├── Button.tsx             # Standardized button with loading state & variants
│       ├── Card.tsx               # Card primitive with Header/Content/Footer
│       ├── Input.tsx              # Controlled input field with label & error handling
│       ├── Modal.tsx              # Overlay modal dialog primitive
│       ├── Spinner.tsx            # Animated loading indicator
│       ├── avatar.tsx             # Avatar primitive
│       ├── dialog.tsx             # Dialog primitive
│       ├── dropdown-menu.tsx      # Dropdown menu primitive
│       └── tabs.tsx               # Navigation tabs primitive
│
├── providers/                     # React Context providers
│   └── AuthProvider.tsx           # Authentication state tracker & context
│
├── hooks/                         # Encapsulated state & async logic hooks
│   ├── useBooks.ts                # Real-time book library fetching & mutations
│   └── useLoans.ts                # Loan history & handshake state hook
│
├── lib/                           # Infrastructure SDK initializations & utilities
│   ├── firebase.ts                # Client-side Firebase App & Auth instance
│   ├── firebase-admin.ts          # Server-side Firebase Admin SDK
│   
├── services/                      # Abstract API clients wrapping REST endpoints
│   ├── bookService.ts             # API client for /api/books
│   ├── clubService.ts             # API client for Book Clubs
│   ├── loanService.ts             # API client for /api/loans & handshake verification
│   ├── swapService.ts             # API client for physical swaps
│   ├── userService.ts             # API client for /api/users
│   └── wishlistService.ts         # API client for Wishlists
│
└── types/                         # Shared TypeScript interfaces & models
    └── index.ts                   # Domain models (Book, BorrowRequest, UserProfile, etc.)
```

---

## 3. Component Hierarchy & Conventions

### 1. Atomic UI Primitives (`src/components/ui/`)
- **Pure & Stateless**: Driven entirely by props without external side effects.
- **Variant Management**: Standardized variants (`primary`, `secondary`, `outline`, `ghost`, `danger`) and sizes (`sm`, `md`, `lg`).
- **Accessibility**: Include `aria-*` attributes, focus indicators, and keyboard navigation support (`Escape` key modal closing).

### 2. Feature Components (`src/components/`)
- Encapsulate distinct domain workflows (e.g., `LoansCalendarTab`, `BookClubsTab`, `LeaderboardBadgesTab`).
- Rely on custom hooks (`useBooks`, `useLoans`) for data fetching rather than raw inline `fetch` or `useEffect` calls.

### 3. Modal Dialogs (`src/components/modals/` or `/src/components/*Modal.tsx`)
- Wrapped in the atomic `<Modal />` primitive.
- Standardized header, body, and footer button actions.

---

## 4. State Management & API Communication

1. **Service Layer Abstraction**:
   - Web API requests are routed through dedicated services (`/src/services/*`).
   - Handles standard HTTP status checks and falls back gracefully to client Firestore when offline or during dev prototyping.

2. **Custom Hooks for React Components**:
   - React components consume data via custom hooks (`useBooks()`, `useLoans()`).
   - Hooks handle loading states, error boundary reporting, and optimistic UI updates.

---

## 5. Styling & Accessibility Standards

- **Tailwind CSS Utility Classes**: Direct, responsive tailwind classes with dark mode support (`dark:bg-slate-900`, `dark:text-slate-100`).
- **Typography**: Responsive font sizes and line heights (`text-xs` up to `text-2xl`).
- **Interactive States**: Hover transitions (`hover:bg-emerald-700`), active states, and disabled button opacity.
- **Color Palette**:
  - Primary Accent: **Emerald** (`bg-emerald-600`, `emerald-500`)
  - Secondary Accent: **Slate** (`bg-slate-800`, `slate-900`)
  - Status Indicators: Emerald (Success), Amber (Warning), Rose (Danger), Sky (Info)
