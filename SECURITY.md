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
- All application data access is performed **server-side through the Firebase Admin SDK** (`server/repositories/firestore/*`), which runs with privileged credentials and does not rely on client-facing security rules.
- Because no application path reads or writes Firestore directly from the browser, `firestore.rules` **denies all direct client access by default** (`allow read, write: if false`). This closes off the public internet from the database while leaving the Admin-SDK server paths fully functional.
- Changes to `firestore.rules` only take effect once deployed: `firebase deploy --only firestore:rules`.

### 4. The Firebase Web API Key Is Public by Design
- The `apiKey` in `firebase-applet-config.json` is a **Firebase Web API key**, not a secret credential. Per [Google's documentation](https://firebase.google.com/docs/projects/api-keys), these keys are meant to be embedded in client code and identify the project to Firebase — they do **not** grant privileged access on their own.
- Secret scanning tools may flag this key as a "leaked secret." That is expected and not a vulnerability; the key should **not** be rotated in response to such an alert, as it would break the app and the replacement would be published in the client bundle again.
- Actual protection comes from the Firestore/Storage security rules above and, optionally, HTTP-referrer restrictions configured on the key in the Google Cloud console.

### 5. Input Validation & Sanitization
- API payloads are sanitized and validated using `zod` schemas or strict TypeScript DTOs (`server/dtos/`).
