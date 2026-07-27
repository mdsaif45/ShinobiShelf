# ShinobiShelf 📚🥷

**ShinobiShelf** is a full-stack peer-to-peer community book-sharing platform. It empowers book lovers to build local sharing economies through physical book swaps, due-date calendar loan tracking, community wishlists, book clubs, honesty leaderboards, and physical pickup spot verification.

---

## 🌟 Key Features

- 📖 **Global & Personal Book Catalog**: Browse available books in the community or catalog personal items with ISBN lookup.
- 📅 **Loans Calendar & Due-Date Tracker**: Monitor active loans, track return dates, and execute handshake codes for physical verification.
- 💬 **Book Clubs & Discussions**: Join genre-focused or neighborhood reading clubs, create posts, share thoughts, and engage with fellow readers.
- 📍 **Physical Pickup Spots & Swap Events**: Discover physical swap spots, coordinate book drops, and RSVP for local community book exchange events.
- ✨ **Wishlist Board**: Post books you are seeking and allow community members to fulfill requests.
- 🏅 **Honesty Leaderboard & Badges**: Earn trust scores and honor badges based on timely returns and active community participation.
- 📊 **Analytics & Reading Insights**: Gain insights into reading trends, total books lent, and community contribution metrics.

---

## 🏗️ System Architecture

ShinobiShelf is built as a full-stack application with a clear separation of concerns between client and server layers.

```
.
├── frontend/                   # Frontend React SPA Application
│   └── ARCHITECTURE.md        # Detailed Frontend Architectural Documentation
├── server/                     # Express Backend & Controller/Repository Layer
│   └── ARCHITECTURE.md        # Detailed Backend Architectural Documentation
├── server.ts                   # Express Entry point & Vite Integration Middleware
├── firebase-applet-config.json # Firebase Configuration
├── firestore.rules             # Firestore Security Rules
├── package.json                # Project Dependencies & Build Scripts
└── vite.config.ts              # Vite & Path Alias Configurations
```

For detailed architecture overviews, consult:
- **[Frontend Architecture Documentation](./frontend/ARCHITECTURE.md)**
- **[Backend Architecture Documentation](./server/ARCHITECTURE.md)**
- **[Git Workflow Documentation](./GIT_WORKFLOW.md)**

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Motion, Recharts, React Router v7
- **Backend**: Express v4, Node.js, TSX, ESBuild
- **Database & Auth**: Firebase Firestore & Firebase Authentication, Drizzle ORM
- **AI Integrations**: Server-side Google GenAI SDK (`@google/genai`)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- pnpm

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/shinobishelf.git
   cd shinobishelf
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Environment Setup:**
   Copy `.env.example` to `.env` and fill in required secrets:
   ```bash
   cp .env.example .env
   ```

### Development

Run the development server (boots backend and Vite middleware on port `3000`):
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building & Production

Compile the client bundle and bundle the server using `esbuild`:
```bash
pnpm build
```

Start the production server:
```bash
pnpm start
```

---

## 📄 License & Governance

- **[Code of Conduct](./CODE_OF_CONDUCT.md)**
- **[Contributing Guidelines](./CONTRIBUTING.md)**
- **[Security Policy](./SECURITY.md)**
- **[Git Workflow](./GIT_WORKFLOW.md)**
