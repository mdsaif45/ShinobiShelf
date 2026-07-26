# Security Policy

## Supported Versions

We issue security updates for the following active versions of ShinobiShelf:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0.0 | :x:                |

---

## 🔒 Reporting a Vulnerability

If you discover a potential security vulnerability in ShinobiShelf, please **do not report it in a public GitHub issue**. Instead, follow these steps:

1. **Email Us Privately**: Send an email detailing the vulnerability to `security@shinobishelf.org`.
2. **Provide Details**:
   - Description of the vulnerability and its potential impact.
   - Steps to reproduce or proof-of-concept (PoC) code.
   - Any suggested mitigations or patches.

### Response Timeline
- **Initial Acknowledgment**: Within 24-48 hours.
- **Vulnerability Assessment**: Within 5 business days.
- **Patch & Advisory Release**: Coordinated with the reporter prior to public disclosure.

---

## 🛡️ Core Security Architecture & Safeguards

### 1. Secret Key Management & Server Proxying
- Secret API keys (e.g., `GEMINI_API_KEY`, database passwords) **MUST NEVER** be exposed to client-side code.
- All external API calls requiring authorization must pass through server-side Express `/api/*` proxies located in `server/`.
- Non-secret parameters (such as `VITE_` prefixed variables) are strictly restricted to public configurations.

### 2. Authentication & Authorization
- User authentication is powered by Firebase Authentication and managed server-side via `firebase-admin`.
- Authentication middleware (`server/middleware/auth.ts`) validates ID tokens on protected endpoints.

### 3. Firestore Database Security Rules
- Database access is enforced via granular security rules defined in `firestore.rules`.
- Reads and writes are scoped strictly to authenticated users and resource owners.

### 4. Input Validation & Sanitization
- API payloads are sanitized and validated using `zod` schemas or strict TypeScript DTOs (`server/dtos/`).
