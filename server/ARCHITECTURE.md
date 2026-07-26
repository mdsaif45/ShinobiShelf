# Backend Architectural Standards & SOLID Guidelines

This document outlines the architectural standards, design patterns, and SOLID principles implemented in the **ShinobiShelf** server backend.

---

## 1. High-Level Architectural Overview

The backend uses a **Layered Architecture (N-Tier Architecture)** combined with **Dependency Injection (DI)** and the **Repository Pattern**.

```
   ┌────────────────────────────────────────────────────────┐
   │                   HTTP Requests                        │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │         Express Server & Application Entry             │
   │               (server.ts / server/app.ts)              │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │              Middlewares Layer                         │
   │   (Auth Verification, Zod Validation, Error Handler)   │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │                   Controller Layer                     │
   │    Handles HTTP req/res, parses params, sends JSON     │
   └───────────────────────────┬────────────────────────────┘
                               │
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │                    Service Layer                       │
   │      Encapsulates Domain Logic & Business Rules        │
   └───────────────────────────┬────────────────────────────┘
                               │ (Depends on Abstract Interfaces)
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │             Repository Interface Layer                 │
   │        (IBookRepository, ILoanRepository, etc.)       │
   └───────────────────────────┬────────────────────────────┘
                               │ (Instantiated via RepositoryFactory)
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │            Concrete Repository Implementations         │
   │    Firestore, Drizzle SQL / PostgreSQL, SQLite, etc.   │
   └───────────────────────────┬────────────────────────────┘
```

---

## 2. SOLID Principles in Practice

### 1. Single Responsibility Principle (SRP)
Each class and module has a single, well-defined reason to change:
- **Routes (`/server/routes`)**: Route declarations and middleware attachment.
- **Controllers (`/server/controllers`)**: Processing HTTP requests, mapping payload data, and delegating business logic to services.
- **Services (`/server/services`)**: Business rules, state transitions, domain calculations (e.g., verifying handshake passcodes, calculating honesty point rewards).
- **Repositories (`/server/repositories`)**: Raw data access, querying, and persistence operations.
- **DTOs (`/server/dtos/schemas.ts`)**: Data shape definitions and input validation.

### 2. Open/Closed Principle (OCP)
The system is open for extension but closed for modification.
- Adding support for a new database engine (e.g., SQLite or PostgreSQL) requires writing a new Repository implementation class (e.g., `SqliteBookRepository` implementing `IBookRepository`) without modifying existing controllers, services, or domain logic.

### 3. Liskov Substitution Principle (LSP)
Any concrete repository implementation (Firestore, PostgreSQL, SQLite, In-Memory) can be substituted for an interface (e.g., `IBookRepository`) without breaking service or controller code.

### 4. Interface Segregation Principle (ISP)
Database access interfaces are segregated into focused, domain-specific abstractions (`IBookRepository`, `ILoanRepository`, `IUserRepository`) rather than one bloated "DatabaseInterface".

### 5. Dependency Inversion Principle (DIP)
High-level modules (Services & Controllers) do not depend on low-level storage modules (Firestore SDK or SQL ORMs). Both depend on abstract repository interfaces (`IBookRepository`). Dependencies are injected at runtime via constructor injection and the `RepositoryFactory`.

---

## 3. Directory Structure

```
server/
├── app.ts                         # Express application setup & middleware assembly
├── config/
│   └── env.ts                     # Environment configuration & DB provider selection
├── controllers/
│   ├── BookController.ts          # Controller for Book catalog endpoints
│   ├── LoanController.ts          # Controller for Peer Loan & Handshake verification
│   └── UserController.ts          # Controller for User profile & Honesty scores
├── dtos/
│   └── schemas.ts                 # Zod schema definitions for request validation
├── middleware/
│   ├── auth.ts                    # Firebase Auth ID token verification middleware
│   ├── errorHandler.ts            # Global Express error handler
│   └── validate.ts                # Request body validation middleware
├── repositories/
│   ├── factory.ts                 # Central Repository Factory (Dependency Injection container)
│   ├── interfaces/
│   │   ├── IBookRepository.ts     # Abstract Book repository contract
│   │   ├── ILoanRepository.ts     # Abstract Loan repository contract
│   │   └── IUserRepository.ts     # Abstract User repository contract
│   └── firestore/
│       ├── FirestoreBookRepository.ts
│       ├── FirestoreLoanRepository.ts
│       └── FirestoreUserRepository.ts
├── routes/
│   ├── books.ts                   # Express router for /api/books
│   ├── loans.ts                   # Express router for /api/loans
│   └── users.ts                   # Express router for /api/users
└── services/
    ├── BookService.ts             # Domain service for Books
    ├── LoanService.ts             # Domain service for Loans & Handshake verification
    └── UserService.ts             # Domain service for Users
```

---

## 4. Swapping Database Engines

The database provider is controlled via environment settings (`envConfig.dbProvider`).

### Switching to another Database (e.g., SQLite or PostgreSQL/Drizzle)

To add and switch to a new database engine:

1. **Implement the Repository Interfaces**:
   Create new repository classes implementing the interfaces:
   ```ts
   // /server/repositories/sqlite/SqliteBookRepository.ts
   import { IBookRepository } from '../interfaces/IBookRepository';
   import { Book } from '../../../src/types';

   export class SqliteBookRepository implements IBookRepository {
     async findAll(): Promise<Book[]> { /* ... */ }
     async findById(id: string): Promise<Book | null> { /* ... */ }
     async create(book: Partial<Book>): Promise<Book> { /* ... */ }
     async update(id: string, updates: Partial<Book>): Promise<Book | null> { /* ... */ }
     async delete(id: string): Promise<boolean> { /* ... */ }
   }
   ```

2. **Register in `RepositoryFactory`**:
   Update `server/repositories/factory.ts`:
   ```ts
   switch (envConfig.dbProvider) {
     case 'sqlite':
       this.bookRepo = new SqliteBookRepository();
       break;
     case 'drizzle':
       this.bookRepo = new DrizzleBookRepository();
       break;
     case 'firebase':
     default:
       this.bookRepo = new FirestoreBookRepository();
       break;
   }
   ```

3. **Set Environment Variable**:
   Set `DB_PROVIDER=sqlite` or `DB_PROVIDER=drizzle` in `.env`.

No controller or service logic changes are required.

---

## 5. Middleware Pipeline & Validation Flow

Every incoming request passes through a structured, predictable pipeline:

```
[Request] ──► Auth Middleware ──► Zod Validation ──► Controller ──► Service ──► Repository ──► [Response]
                  │                   │                   │
                  ▼ (Failure)         ▼ (Failure)         ▼ (Unhandled Exception)
            401 Unauthorized    400 Bad Request     500 Global Error Handler
```

### Example Route Definition
```ts
router.post(
  '/request', 
  requireAuth,                            // 1. Verify Authentication
  validateRequest(createBorrowRequestSchema), // 2. Validate Payload Schema
  loanController.createBorrowRequest       // 3. Delegate to Controller
);
```

---

## 6. Verification and Maintenance

- **Type Check**: Run `npm run lint` (`tsc --noEmit`) to verify all interfaces and class types.
- **Build Server**: Run `npm run build` to compile client and bundle `server.ts` into `dist/server.cjs`.
- **Start Production**: Run `npm run start` to execute `node dist/server.cjs`.
