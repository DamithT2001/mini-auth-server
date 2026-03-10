---
name: Mini OAuth 2.0 Auth Server Development Rules
description: Copilot rules for the mini-auth-server project
applyTo: "**/*.ts,**/*.tsx"
---
alwaysApply: true
---

# Copilot Rules — Mini OAuth 2.0 Auth Server

This project is a production-grade OAuth 2.0 Authorization Server (Mini Cognito).

Copilot must think and write code like a senior backend engineer:
- Prefer clarity over cleverness.
- Prefer simplicity over abstraction.
- Prefer minimal code over verbosity.
- Do not over-engineer.
- Do not introduce unnecessary patterns.
- Every line must justify its existence.

Security and architecture quality are top priority.

---

# Engineering Mindset (Critical)

When generating code:

1. Write the simplest solution that satisfies the requirement.
2. Avoid premature abstraction.
3. Avoid generic utilities unless reused ≥ 2 times.
4. Avoid unnecessary interfaces.
5. Avoid over-splitting files.
6. Keep functions small and focused.
7. Remove duplication only when meaningful.
8. Prefer explicitness over magic.
9. No “enterprise ceremony”.
10. Production-ready, but not overbuilt.

Think:
"What would a calm, experienced backend engineer write?"

---

# Tech Stack

- Backend: NestJS (TypeScript)
- Database: PostgreSQL
- ORM: Prisma
- Auth: JWT (RS256), OAuth 2.0
- Validation: class-validator
- Documentation: Swagger
- Testing: Jest
- Deployment: Docker-ready

Follow NestJS best practices:

- Feature-based modules
- Constructor dependency injection
- DTO validation
- Guards for auth
- Interceptors only when necessary
- Global exception filter

Do not add patterns unless required.

---

# Architecture (Clean but Practical)

We follow a feature-module architecture grouped under `modules/`, with shared infrastructure kept separate.

### Directory Structure

```
src/
├── app.module.ts
├── main.ts
│
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── services/
│   │   │   ├── email-verification.service.ts
│   │   │   ├── refresh-token.service.ts
│   │   │   └── login-audit.service.ts
│   │   ├── dto/
│   │   │   ├── login.dto.ts
│   │   │   ├── register.dto.ts
│   │   │   ├── refresh-token.dto.ts
│   │   │   └── verify-email.dto.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   └── types/
│   │       └── jwt-payload.type.ts
│   ├── oauth/
│   │   ├── oauth.module.ts
│   │   ├── oauth.controller.ts
│   │   ├── oauth.service.ts
│   │   ├── services/
│   │   │   ├── authorization-code.service.ts
│   │   │   ├── pkce.service.ts
│   │   │   └── token.service.ts
│   │   └── dto/
│   │       ├── authorize.dto.ts
│   │       └── token.dto.ts
│   └── users/
│       ├── users.module.ts
│       └── users.service.ts
│
├── infrastructure/
│   ├── database/
│   │   └── prisma.service.ts
│   ├── security/
│   │   ├── jwt.service.ts
│   │   ├── password.service.ts
│   │   ├── token-hash.service.ts
│   │   └── crypto.service.ts
│   └── config/
│       └── jwt.config.ts
│
├── mail/
│   ├── mail.module.ts
│   └── mail.service.ts
│
└── common/
    ├── decorators/
    │   └── request-metadata.decorator.ts
    └── filters/
        └── http-exception.filter.ts
```

When adding a new feature module (e.g. `notifications`), follow the same pattern:
- Module root: `modules/<feature>/<feature>.module.ts`, `<feature>.controller.ts`, `<feature>.service.ts`
- Sub-services: `modules/<feature>/services/`
- DTOs: `modules/<feature>/dto/`
- Guards: `modules/<feature>/guards/`
- Types: `modules/<feature>/types/`

### Layer Rules

- **modules/<feature>/**: Feature controller delegates entirely to the feature service — no business logic in controllers. DTOs and types live inside the module.
- **modules/<feature>/services/**: Focused sub-services for a single concern (email verification, audit logging, token operations). Import infrastructure from `../../infrastructure/` or `../../../infrastructure/`.
- **infrastructure/database/**: Prisma service. Exported as a global module — import `PrismaService` directly anywhere.
- **infrastructure/security/**: JWT, password hashing, token hashing, and secure random generation. No feature-specific logic.
- **infrastructure/config/**: NestJS `registerAs` configuration factories.
- **mail/**: Email sending module. Import `MailModule` in any feature module that needs to send email.
- **common/**: Shared decorators, filters, and guards used across multiple modules.

Rules:
- No circular dependencies.
- Controllers contain no business logic.
- Do not import feature modules from infrastructure.
- Do not create layers unless necessary.

Avoid artificial separation.

---

# OAuth 2.0 Requirements

Must follow RFC 6749:

- Authorization Code Flow
- Strict redirect_uri validation
- Authorization code expiry ≤ 5 minutes
- Refresh token rotation
- Short-lived access tokens
- Scope validation
- RS256 (public/private key pair)

Never:
- Use HS256 in production
- Store plain passwords
- Return secrets in responses

---

# Security Rules

- Hash passwords using bcrypt.
- Never log secrets.
- Validate all input via DTOs.
- Rate limit:
  - Login
  - Token
  - Authorization
- Validate client credentials properly.
- Prevent replay attacks.
- Use environment variables for secrets.
- Never hardcode secrets.

Security > convenience.

---

# Prisma Rules

- Use Prisma for all DB operations.
- No raw SQL unless absolutely necessary.
- Use snake_case with @map / @@map.
- Add indexes for:
  - email
  - client_id
  - refresh_token
  - authorization_code
- Use Prisma migrations only.
- Version-control all migrations.

Keep queries simple and readable.

---

# Code Quality Rules

- Zero TypeScript errors.
- Zero ESLint errors.
- No unused variables.
- No console.log in production.
- Prefer direct named imports over namespace imports when possible
- camelCase for variables.
- PascalCase for classes.
- Small functions.
- Early returns preferred.
- Avoid nested conditionals.

Remove unnecessary code.

---

# JSDoc and Code Comments

Use minimal, meaningful JSDoc comments.
Comments must explain intent, not obvious syntax.
Add JSDoc only where it provides value.

Use JSDoc for:
- Public service methods
- Controllers
- Complex business logic
- Security-sensitive logic
- Non-obvious behavior

Keep comments short:
- 1-3 lines max
- No long explanations
- No redundant comments
- Do not add comments for every function
- Comment intent, not syntax

---

# SOLID — Applied Practically

Apply SOLID when it improves clarity.

Do NOT:
- Create interfaces for single implementations.
- Abstract too early.
- Introduce patterns without reason.

Use dependency inversion only where it adds value.

---

# Logging

- Use NestJS Logger.
- Log:
  - Login attempts
  - Token failures
  - Rate limit violations
- Never log tokens or secrets.
- Keep logs structured.

No noisy logs.

---

# Testing

- Unit test business logic.
- Integration test:
  - Login flow
  - Token issuance
  - Refresh flow
- ≥ 80% coverage.
- Clear test names.

Test behavior, not implementation details.

---

# General Development Rules

- Use environment variables for config.
- Always handle errors gracefully.
- Always paginate list endpoints.
- Use DTOs for request bodies.
- Use Guards for auth and roles.
- Avoid unnecessary interceptors.
- Keep commits small and meaningful.

This must feel like real identity infrastructure.

Not a demo app.
Not a tutorial project.

---

# Commit Standards

- feat:
- fix:
- refactor:
- chore:
- docs:

Every commit must:
- Compile
- Pass lint
- Pass type-check
- Pass tests

---

# Deployment Readiness

Code must be:

- Environment agnostic
- Config-driven
- Docker-ready
- Cloud-ready
- Free-tier deployable

No local-only assumptions.

---

# Final Rule

If a solution feels over-engineered,
rewrite it simpler.

If a class feels unnecessary,
remove it.

If an abstraction has no clear benefit,
delete it.

Senior engineers optimize for:
clarity, security, maintainability, and simplicity.