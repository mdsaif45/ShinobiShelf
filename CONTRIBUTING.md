# Contributing to ShinobiShelf

Thank you for taking the time to contribute to ShinobiShelf! We welcome contributions from developers of all skill levels.

---

## 🚀 Quick Start Guide

### 1. Fork & Clone
Fork the repository on GitHub, then clone your fork locally:
```bash
git clone https://github.com/your-username/shinobishelf.git
cd shinobishelf
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Copy `.env.example` to `.env` and configure your credentials:
```bash
cp .env.example .env
```

### 4. Run Development Server
```bash
npm run dev
```

---

## 🛠️ Code Structure Overview

- **`frontend/src/`**: React application UI, pages (`pages/`), feature tab components (`components/features/`), modals (`components/modals/`), and shared hooks/services.
- **`server/`**: Full-stack Express controllers, services, repositories, and routes following a layered architecture.

Refer to:
- [Frontend Architecture Documentation](./frontend/ARCHITECTURE.md)
- [Backend Architecture Documentation](./server/ARCHITECTURE.md)
- [Git Workflow Documentation](./GIT_WORKFLOW.md)

---

## 📋 Guidelines for Pull Requests

1. **Create a Feature Branch**: Always branch off of `develop` (or `main`) using the naming convention `feature/<short-description>` or `fix/<short-description>`.
   ```bash
   git checkout -b feature/add-loan-reminders
   ```

2. **Follow Coding Standards**:
   - Write clean, type-safe TypeScript code. Avoid `any` types wherever possible.
   - Use standard Tailwind utility classes for styling.
   - Ensure components in `frontend/src/` remain modular and single-purpose.

3. **Validate Code Before Committing**:
   Run type checks and linter prior to pushing:
   ```bash
   npm run lint
   ```

4. **Write Meaningful Commit Messages**:
   Use Conventional Commits syntax:
   - `feat: add loan return reminder notification`
   - `fix: resolve hydration issue in book details modal`
   - `refactor: move auth provider to providers directory`

5. **Submit a Pull Request**:
   - Provide a clear title and summary of changes.
   - Link any related issue numbers (e.g., `Fixes #42`).
   - Ensure continuous integration checks pass.

---

## 🧪 Testing & Quality Assurance

Before submitting your PR, ensure:
- The app builds without error using `npm run build`.
- Type checking passes with zero errors (`npm run lint`).
- UI controls function properly across desktop and mobile screens.

---

## ❓ Questions or Need Help?

Feel free to open an issue or reach out via community discussion boards. Thank you for making ShinobiShelf better!
