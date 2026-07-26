# Git Workflow & Branching Strategy

To maintain a clean codebase, reliable release cycles, and continuous integration, ShinobiShelf uses a structured Git workflow based on **Git Flow** and **Conventional Commits**.

---

## 🌳 Branching Model

```
   main        ───────────────────────● (Production Tag)
                 \                   /
   develop     ───●───────●─────────●───── (Integration Branch)
                   \     / \       /
   feature/*   ─────●───●   \     /
                             \   /
   fix/*       ───────────────●─●
```

### 1. Primary Branches

- **`main`**:
  - Reflects production-ready code.
  - Every commit on `main` is tagged with a release version (e.g., `v1.0.0`).
  - Direct commits to `main` are strictly prohibited. Code must arrive via Pull Requests from `develop` or critical hotfixes.

- **`develop`**:
  - Primary integration branch for upcoming releases.
  - Feature branches are branched off `develop` and merged back into `develop` after code review and CI verification.

---

## 🌿 Supporting Branches

### 1. Feature Branches (`feature/*`)
- **Source**: `develop`
- **Destination**: `develop`
- **Naming**: `feature/<short-feature-name>` (e.g., `feature/pickup-location-map`)
- **Usage**: Used for developing new features or refactoring functionality.

```bash
git checkout develop
git pull origin develop
git checkout -b feature/pickup-location-map
```

### 2. Bug Fix Branches (`fix/*`)
- **Source**: `develop`
- **Destination**: `develop`
- **Naming**: `fix/<bug-description>` (e.g., `fix/modal-close-event`)
- **Usage**: Addressing non-critical bugs found during development or testing.

### 3. Hotfix Branches (`hotfix/*`)
- **Source**: `main`
- **Destination**: `main` and `develop`
- **Naming**: `hotfix/<vulnerability-or-outage>` (e.g., `hotfix/firebase-rule-bypass`)
- **Usage**: Urgent production fixes.

---

## ✍️ Commit Message Conventions

We enforce [Conventional Commits](https://www.conventionalcommits.org/) format for all commits:

```
<type>(<scope>): <short summary>

[optional body]

[optional footer(s)]
```

### Allowed Types:
- `feat`: A new feature for the user
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Changes that do not affect code logic (formatting, white-space)
- `refactor`: Code refactoring without adding features or fixing bugs
- `perf`: Performance improvements
- `test`: Adding or correcting tests
- `chore`: Build process or auxiliary tool changes

### Examples:
```bash
git commit -m "feat(wishlist): add fulfillment handshake confirmation"
git commit -m "fix(auth): update token refresh logic in auth provider"
git commit -m "docs(readme): add directory layout overview"
```

---

## 🔄 Pull Request & Merge Process

1. **Keep Branch Updated**:
   Rebase onto `develop` before submitting PR:
   ```bash
   git checkout feature/my-feature
   git fetch origin
   git rebase origin/develop
   ```

2. **Automated CI Checks**:
   Every PR triggers GitHub Actions (`.github/workflows/ci.yml`) to run:
   - TypeScript compilation check (`npm run lint`)
   - Production bundle test (`npm run build`)

3. **Code Review Criteria**:
   - At least 1 code owner review approval.
   - All CI checks pass green.
   - Clean commit history (squash-and-merge or rebase-and-merge preferred).
